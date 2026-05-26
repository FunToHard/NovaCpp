import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { SolutionModel, SolutionConfiguration, VcxProjectModel } from './solution-models';
import { parseSolutionFile, loadVcxProject } from './sln-parser';
import { CompilationDatabaseGenerator } from './compilation-database-generator';
import { CompilerDetector } from '../prober/compiler-detector';
import { SystemIncludeExtractor } from '../prober/system-includes';
import { debounce } from '../substrate/protocol-filter';

export class SolutionManager implements vscode.Disposable {
  private solutions: SolutionModel[] = [];
  private activeSolution: SolutionModel | null = null;
  private activeConfiguration: SolutionConfiguration = {
    configuration: 'Debug',
    platform: 'x64',
    key: 'Debug|x64'
  };

  private statusBarItem: vscode.StatusBarItem;
  private watcher: vscode.FileSystemWatcher | null = null;
  private disposables: vscode.Disposable[] = [];
  private compDbGenerator = new CompilationDatabaseGenerator();

  private debouncedReload = debounce(async () => {
    try {
      await this.refreshSolutions();
      if (this.activeSolution) {
        await this.synthesizeCompilationDatabase();
      }
    } catch (err) {
      console.warn('NovaCpp: Solution reload failed:', err);
    }
  }, 1200);

  constructor(
    private readonly detector: CompilerDetector,
    private readonly extractor: SystemIncludeExtractor,
    private readonly onReloadServer?: () => Promise<void>
  ) {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Left,
      65
    );
    this.statusBarItem.command = 'novacpp.solutionMenu';
    this.disposables.push(this.statusBarItem);

    // Watch for solution and vcxproj changes
    this.watcher = vscode.workspace.createFileSystemWatcher(
      '**/*.{sln,slnx,vcxproj}'
    );
    this.disposables.push(
      this.watcher.onDidChange(() => this.debouncedReload()),
      this.watcher.onDidCreate(() => this.debouncedReload()),
      this.watcher.onDidDelete(() => this.debouncedReload())
    );
  }

  public getActiveSolution(): SolutionModel | null {
    return this.activeSolution;
  }

  public getActiveConfiguration(): SolutionConfiguration {
    return this.activeConfiguration;
  }

  public getAvailableSolutions(): SolutionModel[] {
    return this.solutions;
  }

  /**
   * Initializes the solution subsystem by searching the workspace for solutions.
   */
  public async initialize(): Promise<void> {
    await this.refreshSolutions();
    if (this.activeSolution) {
      this.updateStatusBar();
      await this.synthesizeCompilationDatabase();
    }
  }

  /**
   * Scans workspace folders for .sln and .slnx files.
   */
  public async refreshSolutions(): Promise<void> {
    const discovered: SolutionModel[] = [];
    const files = await vscode.workspace.findFiles(
      '**/*.{sln,slnx}',
      '**/node_modules/**'
    );

    for (const file of files) {
      const parsed = await parseSolutionFile(file.fsPath);
      if (parsed) {
        discovered.push(parsed);
      }
    }

    this.solutions = discovered;

    if (this.solutions.length > 0) {
      // Preserve active solution if still present, otherwise choose the first
      const existing = this.solutions.find(
        (s) => this.activeSolution && s.filePath === this.activeSolution.filePath
      );
      this.activeSolution = existing || this.solutions[0];

      // Update active configuration if current is invalid
      if (
        !this.activeSolution.configurations.some(
          (c) => c.key === this.activeConfiguration.key
        )
      ) {
        this.activeConfiguration =
          this.activeSolution.configurations[0] || {
            configuration: 'Debug',
            platform: 'x64',
            key: 'Debug|x64'
          };
      }
      this.updateStatusBar();
    } else {
      this.activeSolution = null;
      this.statusBarItem.hide();
    }
  }

  /**
   * Synthesizes compile_commands.json from the active solution.
   */
  public async synthesizeCompilationDatabase(): Promise<string | null> {
    if (!this.activeSolution) {
      return null;
    }

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      return null;
    }

    const rootDir = workspaceFolders[0].uri.fsPath;
    const compiler = await this.detector.getPreferredCompiler();
    if (!compiler) {
      console.warn('NovaCpp: No compiler available for solution compilation database synthesis.');
      return null;
    }

    // Load all projects in the solution
    const projectModels: VcxProjectModel[] = [];
    for (const proj of this.activeSolution.projects) {
      const model = await loadVcxProject(proj.fullPath);
      if (model) {
        projectModels.push(model);
      }
    }

    if (projectModels.length === 0) {
      return null;
    }

    const systemIncludes = await this.extractor.extractSystemIncludes(compiler);
    const entries = this.compDbGenerator.generateEntries(
      this.activeSolution,
      projectModels,
      compiler,
      systemIncludes,
      this.activeConfiguration.key
    );

    if (entries.length === 0) {
      return null;
    }

    const targetFile = path.join(rootDir, 'compile_commands.json');
    await this.compDbGenerator.writeCompilationDatabase(targetFile, entries);

    console.log(
      `NovaCpp: Generated compile_commands.json from solution ${this.activeSolution.name} (${entries.length} files)`
    );

    if (this.onReloadServer) {
      await this.onReloadServer();
    }

    return targetFile;
  }

  /**
   * Presents a QuickPick menu for solution actions.
   */
  public async showSolutionMenu(): Promise<void> {
    if (!this.activeSolution) {
      const scan = await vscode.window.showInformationMessage(
        'NovaCpp: No Visual Studio solution (.sln / .slnx) currently loaded.',
        'Scan Workspace'
      );
      if (scan) {
        await this.refreshSolutions();
      }
      return;
    }

    const items: Array<vscode.QuickPickItem & { action: string }> = [
      {
        label: '$(gear) Switch Solution Configuration',
        description: `Current: ${this.activeConfiguration.key}`,
        action: 'switchConfig'
      },
      {
        label: '$(play) Build Solution (MSBuild)',
        description: `${this.activeSolution.name} [${this.activeConfiguration.key}]`,
        action: 'build'
      },
      {
        label: '$(refresh) Rebuild Solution (MSBuild)',
        description: 'Clean and build all projects',
        action: 'rebuild'
      },
      {
        label: '$(trash) Clean Solution (MSBuild)',
        description: 'Delete intermediate build outputs',
        action: 'clean'
      },
      {
        label: '$(database) Regenerate compile_commands.json',
        description: 'Update Clangd IntelliSense database from solution projects',
        action: 'regenDb'
      }
    ];

    if (this.solutions.length > 1) {
      items.unshift({
        label: '$(folder) Switch Active Solution',
        description: `${this.activeSolution.name} (${this.solutions.length} available)`,
        action: 'switchSolution'
      });
    }

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `Solution: ${this.activeSolution.name} (${this.activeConfiguration.key})`
    });

    if (!selected) return;

    switch (selected.action) {
      case 'switchSolution':
        await this.selectSolution();
        break;
      case 'switchConfig':
        await this.selectConfiguration();
        break;
      case 'build':
        await this.runMSBuildTask('Build');
        break;
      case 'rebuild':
        await this.runMSBuildTask('Rebuild');
        break;
      case 'clean':
        await this.runMSBuildTask('Clean');
        break;
      case 'regenDb':
        await this.synthesizeCompilationDatabase();
        vscode.window.showInformationMessage(
          `NovaCpp: Updated compile_commands.json for ${this.activeSolution.name} [${this.activeConfiguration.key}].`
        );
        break;
    }
  }

  /**
   * Prompts user to select the active solution from discovered solutions.
   */
  public async selectSolution(): Promise<void> {
    if (this.solutions.length === 0) {
      vscode.window.showWarningMessage('NovaCpp: No .sln or .slnx files found in workspace.');
      return;
    }

    const items = this.solutions.map((s) => ({
      label: s.name,
      description: path.relative(vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '', s.filePath),
      detail: `${s.format.toUpperCase()} Solution | ${s.projects.length} C++ Projects`,
      solution: s
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select Active Visual Studio Solution'
    });

    if (picked) {
      this.activeSolution = picked.solution;
      if (
        !this.activeSolution.configurations.some(
          (c) => c.key === this.activeConfiguration.key
        )
      ) {
        this.activeConfiguration =
          this.activeSolution.configurations[0] || {
            configuration: 'Debug',
            platform: 'x64',
            key: 'Debug|x64'
          };
      }
      this.updateStatusBar();
      await this.synthesizeCompilationDatabase();
    }
  }

  /**
   * Prompts user to select configuration for active solution.
   */
  public async selectConfiguration(): Promise<void> {
    if (!this.activeSolution) {
      vscode.window.showWarningMessage('NovaCpp: No active solution selected.');
      return;
    }

    const items = this.activeSolution.configurations.map((c) => ({
      label: c.key,
      description: `Configuration: ${c.configuration} | Platform: ${c.platform}`,
      config: c
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: `Select Solution Configuration (Current: ${this.activeConfiguration.key})`
    });

    if (picked) {
      this.activeConfiguration = picked.config;
      this.updateStatusBar();
      await this.synthesizeCompilationDatabase();
      vscode.window.showInformationMessage(
        `NovaCpp: Switched solution configuration to ${picked.config.key}.`
      );
    }
  }

  /**
   * Runs an MSBuild task for the active solution.
   */
  public async runMSBuildTask(target: 'Build' | 'Rebuild' | 'Clean'): Promise<void> {
    const tasks = await vscode.tasks.fetchTasks({ type: 'msbuild' });
    const match = tasks.find(
      (t) =>
        t.name.includes(target) &&
        this.activeSolution &&
        t.name.includes(this.activeSolution.name)
    );

    if (match) {
      await vscode.tasks.executeTask(match);
    } else {
      vscode.window.showErrorMessage(
        `NovaCpp: Could not locate MSBuild task for ${target}. Ensure MSBuild or Visual Studio is installed.`
      );
    }
  }

  private updateStatusBar(): void {
    if (!this.activeSolution) {
      this.statusBarItem.hide();
      return;
    }

    this.statusBarItem.text = `$(project) ${this.activeSolution.name}.${this.activeSolution.format} [${this.activeConfiguration.key}]`;
    this.statusBarItem.tooltip = `Visual Studio Solution: ${this.activeSolution.name} (${this.activeSolution.format.toUpperCase()})\nConfiguration: ${this.activeConfiguration.key}\nClick to view solution menu`;
    this.statusBarItem.show();
  }

  public dispose(): void {
    this.debouncedReload.cancel();
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
