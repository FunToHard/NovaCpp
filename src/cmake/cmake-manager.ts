import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CMakeBuildType, CMakePreset, CMakeProjectInfo } from './cmake-models';
import { CMakeDetector } from './cmake-detector';
import { CMakeParser } from './cmake-parser';

export class CMakeManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];
  private activeProject: CMakeProjectInfo | null = null;
  private activeBuildType: CMakeBuildType = 'Debug';
  private activePreset: CMakePreset | null = null;
  private isConfiguring: boolean = false;

  constructor(
    private readonly onReloadServer?: () => Promise<void>
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      66
    );
    this.statusBarItem.command = 'novacpp.cmake.menu';
    this.disposables.push(this.statusBarItem);
  }

  public getActiveProject(): CMakeProjectInfo | null {
    return this.activeProject;
  }

  public getActiveBuildType(): CMakeBuildType {
    return this.activeBuildType;
  }

  public getActivePreset(): CMakePreset | null {
    return this.activePreset;
  }

  /**
   * Initializes CMake subsystem: detects CMakeLists.txt and seamlessly connects compilation databases.
   */
  public async initialize(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      this.statusBarItem.hide();
      return;
    }

    const rootPath = folders[0].uri.fsPath;
    if (!CMakeDetector.isCMakeWorkspace(rootPath)) {
      this.statusBarItem.hide();
      return;
    }

    const config = vscode.workspace.getConfiguration('novacpp.cmake');
    this.activeBuildType = (config.get<string>('buildType') as CMakeBuildType) || 'Debug';
    const buildDirectorySetting = config.get<string>('buildDirectory', 'build');

    const cmakeLists = CMakeDetector.findCMakeLists(rootPath);
    if (!cmakeLists) {
      this.statusBarItem.hide();
      return;
    }

    this.activeProject = {
      workspaceRoot: rootPath,
      sourceDir: rootPath,
      buildDir: path.isAbsolute(buildDirectorySetting)
        ? buildDirectorySetting
        : path.join(rootPath, buildDirectorySetting),
      cmakeListsPath: cmakeLists,
      buildType: this.activeBuildType
    };

    this.updateStatusBar();

    // Seamlessly synchronize compilation database with Clangd
    const synced = await this.syncCompilationDatabase();

    // If no compilation database exists yet, check if autoConfigure is enabled
    if (!synced && config.get<boolean>('autoConfigure', true)) {
      // Fallback: immediate include directory parsing from CMakeLists.txt
      const parsed = CMakeParser.parse(cmakeLists, rootPath);
      if (parsed.includeDirectories.length > 0) {
        console.log(`NovaCpp: Statically discovered ${parsed.includeDirectories.length} CMake include paths.`);
      }

      // Auto-configure CMake in background to generate compile_commands.json
      void this.configure();
    }
  }

  /**
   * Synchronizes discovered compile_commands.json into workspace root and .clangd
   * so Clangd immediately recognizes all include paths and compiler definitions.
   */
  public async syncCompilationDatabase(customBuildDir?: string): Promise<boolean> {
    if (!this.activeProject) return false;

    const workspaceRoot = this.activeProject.workspaceRoot;
    const compDb = CMakeDetector.findCompilationDatabase(
      workspaceRoot,
      customBuildDir || this.activeProject.buildDir
    );

    if (!compDb) {
      return false;
    }

    this.activeProject.compilationDatabasePath = compDb;

    try {
      const rootCompDb = path.join(workspaceRoot, 'compile_commands.json');
      const compDbDir = path.dirname(compDb);

      // If compile_commands.json is located in a build directory, mirror/link it to root
      if (path.normalize(compDb) !== path.normalize(rootCompDb)) {
        try {
          fs.copyFileSync(compDb, rootCompDb);
        } catch {
          // If copy fails, fallback to updating .clangd
        }
      }

      // Configure .clangd CompilationDatabase directive non-destructively
      this.updateClangdCompilationDatabase(workspaceRoot, compDbDir);

      this.updateStatusBar();

      if (this.onReloadServer) {
        await this.onReloadServer();
      }

      console.log(`NovaCpp: Seamlessly synchronized CMake compilation database from ${compDb}`);
      return true;
    } catch (err) {
      console.warn('NovaCpp: Error synchronizing CMake compilation database:', err);
      return false;
    }
  }

  /**
   * Updates .clangd CompilationDatabase directive non-destructively.
   */
  private updateClangdCompilationDatabase(workspaceRoot: string, compilationDbDir: string): void {
    try {
      const clangdPath = path.join(workspaceRoot, '.clangd');
      const normalizedDir = compilationDbDir.replace(/\\/g, '/');

      if (!fs.existsSync(clangdPath)) {
        const content = [
          '# Generated by NovaCpp - CMake Integration',
          'CompileFlags:',
          `  CompilationDatabase: "${normalizedDir}"`,
          ''
        ].join('\n');
        fs.writeFileSync(clangdPath, content, 'utf8');
        return;
      }

      const existing = fs.readFileSync(clangdPath, 'utf8');
      if (existing.includes(`CompilationDatabase: "${normalizedDir}"`)) {
        return; // Already configured
      }

      // Replace or insert CompilationDatabase
      if (/CompilationDatabase:\s*".*?"/i.test(existing)) {
        const updated = existing.replace(
          /CompilationDatabase:\s*".*?"/i,
          `CompilationDatabase: "${normalizedDir}"`
        );
        fs.writeFileSync(clangdPath, updated, 'utf8');
      } else if (/^CompileFlags:/im.test(existing)) {
        const updated = existing.replace(
          /(^CompileFlags:)/im,
          `$1\n  CompilationDatabase: "${normalizedDir}"`
        );
        fs.writeFileSync(clangdPath, updated, 'utf8');
      } else {
        const toAppend = [
          '',
          '# CMake Compilation Database',
          'CompileFlags:',
          `  CompilationDatabase: "${normalizedDir}"`,
          ''
        ].join('\n');
        fs.writeFileSync(clangdPath, existing.trimEnd() + '\n' + toAppend, 'utf8');
      }
    } catch {
      // Safe ignore
    }
  }

  /**
   * Configures the CMake project with -DCMAKE_EXPORT_COMPILE_COMMANDS=ON.
   */
  public async configure(presetName?: string, additionalArgs: string[] = []): Promise<void> {
    if (!this.activeProject) return;
    if (this.isConfiguring) {
      vscode.window.showInformationMessage('CMake configure is already running.');
      return;
    }

    const config = vscode.workspace.getConfiguration('novacpp.cmake');
    const customCmake = config.get<string>('cmakePath');
    const cmakeBin = await CMakeDetector.findCMake(customCmake);

    if (!cmakeBin) {
      vscode.window.showErrorMessage(
        'NovaCpp: CMake binary could not be found. Please install CMake or configure "novacpp.cmake.cmakePath".'
      );
      return;
    }

    this.isConfiguring = true;
    this.updateStatusBar('$(sync~spin) CMake: Configuring...');

    const workspaceRoot = this.activeProject.workspaceRoot;
    const buildDir = this.activeProject.buildDir;
    const buildType = this.activeProject.buildType;

    const args: string[] = [];
    if (presetName || this.activePreset) {
      const preset = presetName || this.activePreset!.name;
      args.push('--preset', preset);
    } else {
      args.push(
        '-B',
        buildDir,
        '-S',
        workspaceRoot,
        '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON',
        `-DCMAKE_BUILD_TYPE=${buildType}`
      );
    }

    const userArgs = config.get<string[]>('additionalArgs') || [];
    args.push(...userArgs, ...additionalArgs);

    try {
      const terminal = vscode.window.createTerminal({
        name: 'CMake Configure',
        cwd: workspaceRoot
      });
      terminal.show(true);

      const commandLine = `"${cmakeBin}" ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`;
      terminal.sendText(commandLine);

      // Setup watcher / delay to sync compilation database once written
      setTimeout(async () => {
        await this.syncCompilationDatabase();
        this.isConfiguring = false;
        this.updateStatusBar();
      }, 3500);
    } catch (err) {
      this.isConfiguring = false;
      this.updateStatusBar();
      vscode.window.showErrorMessage(`NovaCpp: CMake configuration failed: ${err}`);
    }
  }

  /**
   * Builds the CMake target or whole project.
   */
  public async build(target?: string): Promise<void> {
    if (!this.activeProject) return;

    const config = vscode.workspace.getConfiguration('novacpp.cmake');
    const cmakeBin = await CMakeDetector.findCMake(config.get<string>('cmakePath'));
    if (!cmakeBin) {
      vscode.window.showErrorMessage('NovaCpp: CMake binary not found.');
      return;
    }

    const buildDir = this.activeProject.buildDir;
    const buildType = this.activeProject.buildType;
    const args: string[] = ['--build', buildDir, '--config', buildType];

    if (target && target.trim().length > 0) {
      args.push('--target', target.trim());
    }

    const terminal = vscode.window.createTerminal({
      name: 'CMake Build',
      cwd: this.activeProject.workspaceRoot
    });
    terminal.show(true);
    terminal.sendText(`"${cmakeBin}" ${args.map((a) => (a.includes(' ') ? `"${a}"` : a)).join(' ')}`);
  }

  /**
   * Cleans the CMake build outputs.
   */
  public async clean(): Promise<void> {
    if (!this.activeProject) return;

    const config = vscode.workspace.getConfiguration('novacpp.cmake');
    const cmakeBin = await CMakeDetector.findCMake(config.get<string>('cmakePath'));
    if (!cmakeBin) {
      vscode.window.showErrorMessage('NovaCpp: CMake binary not found.');
      return;
    }

    const buildDir = this.activeProject.buildDir;
    const terminal = vscode.window.createTerminal({
      name: 'CMake Clean',
      cwd: this.activeProject.workspaceRoot
    });
    terminal.show(true);
    terminal.sendText(`"${cmakeBin}" --build "${buildDir}" --target clean`);
  }

  /**
   * Changes the active build type (Debug, Release, RelWithDebInfo, MinSizeRel).
   */
  public async setBuildType(type: CMakeBuildType): Promise<void> {
    this.activeBuildType = type;
    if (this.activeProject) {
      this.activeProject.buildType = type;
    }

    const config = vscode.workspace.getConfiguration('novacpp.cmake');
    await config.update('buildType', type, vscode.ConfigurationTarget.Workspace);

    this.updateStatusBar();
    vscode.window.showInformationMessage(`NovaCpp: Active CMake build type set to ${type}`);
    await this.syncCompilationDatabase();
  }

  /**
   * Displays QuickPick for selecting configure presets.
   */
  public async selectPreset(): Promise<void> {
    if (!this.activeProject) return;

    const presets = CMakeDetector.readPresets(this.activeProject.workspaceRoot);
    if (presets.length === 0) {
      vscode.window.showInformationMessage('No configure presets found in CMakePresets.json');
      return;
    }

    const items = presets.map((p) => ({
      label: p.displayName || p.name,
      description: p.description || p.generator || '',
      detail: p.binaryDir || '',
      preset: p
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a CMake Configure Preset'
    });

    if (picked) {
      this.activePreset = picked.preset;
      this.updateStatusBar();
      await this.configure(picked.preset.name);
    }
  }

  /**
   * Displays the comprehensive CMake interactive actions menu.
   */
  public async openMenu(): Promise<void> {
    if (!this.activeProject) {
      vscode.window.showInformationMessage('No active CMake project in workspace.');
      return;
    }

    const dbStatus = this.activeProject.compilationDatabasePath
      ? `$(check) Connected (${path.basename(path.dirname(this.activeProject.compilationDatabasePath))})`
      : '$(x) Missing';

    const items: (vscode.QuickPickItem & { action: string })[] = [
      {
        label: '$(play) Build Target',
        description: `Build active configuration [${this.activeBuildType}]`,
        action: 'build'
      },
      {
        label: '$(sync) Configure Project',
        description: 'Run cmake configure and export compile_commands.json',
        action: 'configure'
      },
      {
        label: '$(trash) Clean Build',
        description: 'Clean build outputs',
        action: 'clean'
      },
      {
        label: '$(gear) Select Build Type',
        description: `Current: ${this.activeBuildType}`,
        action: 'setBuildType'
      },
      {
        label: '$(list-selection) Select Configure Preset',
        description: this.activePreset ? `Current: ${this.activePreset.name}` : 'Select from CMakePresets.json',
        action: 'selectPreset'
      },
      {
        label: '$(database) Sync Compilation Database',
        description: `IntelliSense Database: ${dbStatus}`,
        action: 'syncDb'
      }
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `NovaCpp CMake Menu — ${this.activeProject.workspaceRoot}`
    });

    if (!selected) return;

    switch (selected.action) {
      case 'build':
        await this.build();
        break;
      case 'configure':
        await this.configure();
        break;
      case 'clean':
        await this.clean();
        break;
      case 'setBuildType': {
        const types: CMakeBuildType[] = ['Debug', 'Release', 'RelWithDebInfo', 'MinSizeRel'];
        const pickedType = await vscode.window.showQuickPick(types, {
          placeHolder: 'Select CMake Build Type'
        });
        if (pickedType) {
          await this.setBuildType(pickedType as CMakeBuildType);
        }
        break;
      }
      case 'selectPreset':
        await this.selectPreset();
        break;
      case 'syncDb': {
        const ok = await this.syncCompilationDatabase();
        if (ok) {
          vscode.window.showInformationMessage('NovaCpp: Successfully synchronized CMake compilation database.');
        } else {
          vscode.window.showWarningMessage('NovaCpp: No compile_commands.json found. Run Configure first.');
        }
        break;
      }
    }
  }

  private updateStatusBar(customText?: string): void {
    if (customText) {
      this.statusBarItem.text = customText;
      this.statusBarItem.show();
      return;
    }

    if (!this.activeProject) {
      this.statusBarItem.hide();
      return;
    }

    const label = this.activePreset
      ? this.activePreset.name
      : this.activeBuildType;

    const hasDb = !!this.activeProject.compilationDatabasePath;
    const dbIcon = hasDb ? '$(check)' : '$(alert)';

    this.statusBarItem.text = `$(tools) CMake: [${label}]`;
    this.statusBarItem.tooltip = [
      `NovaCpp CMake Integration:`,
      `Workspace: ${this.activeProject.workspaceRoot}`,
      `Build Type: ${this.activeBuildType}`,
      `Build Dir: ${this.activeProject.buildDir}`,
      `Compilation DB: ${hasDb ? this.activeProject.compilationDatabasePath : 'Not found (Click to Configure)'}`
    ].join('\n');
    this.statusBarItem.show();
  }

  public dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
