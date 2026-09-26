import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CMakeProjectInfo } from './cmake-models';
import { CMakeDetector } from './cmake-detector';
import { CMakeParser } from './cmake-parser';
import { CompilerDetector } from '../prober/compiler-detector';
import { SystemIncludeExtractor } from '../prober/system-includes';

export class CMakeManager implements vscode.Disposable {
  private statusBarItem: vscode.StatusBarItem;
  private disposables: vscode.Disposable[] = [];
  private activeProject: CMakeProjectInfo | null = null;

  constructor(
    private readonly detector: CompilerDetector,
    private readonly extractor: SystemIncludeExtractor,
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

  public getIncludeDirectories(): string[] {
    return this.activeProject?.includeDirectories ?? [];
  }

  public getCompileDefinitions(): string[] {
    return this.activeProject?.compileDefinitions ?? [];
  }

  /**
   * Initializes the CMake subsystem by statically parsing the workspace CMakeLists.txt
   * and including discovered include paths and definitions.
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

    await this.refresh();
  }

  /**
   * Statically re-parses CMakeLists.txt across the workspace, updates active project info,
   * syncs include paths into IntelliSense, and notifies the language server.
   */
  public async refresh(): Promise<void> {
    const folders = vscode.workspace.workspaceFolders;
    if (!folders || folders.length === 0) {
      this.statusBarItem.hide();
      return;
    }

    const rootPath = folders[0].uri.fsPath;
    const project = CMakeParser.parseWorkspace(rootPath);
    if (!project) {
      this.activeProject = null;
      this.statusBarItem.hide();
      return;
    }

    this.activeProject = project;
    this.updateStatusBar();

    // Automatically synchronize discovered CMake includes into workspace compile_commands.json
    await this.synthesizeCompilationDatabase();

    if (this.onReloadServer) {
      await this.onReloadServer();
    }
  }

  /**
   * Synthesizes compile_commands.json directly from parsed CMake targets, sources, and include directories
   * without requiring any external cmake execution.
   */
  public async synthesizeCompilationDatabase(outputFilePath?: string): Promise<string | null> {
    if (!this.activeProject) return null;

    const workspaceRoot = this.activeProject.workspaceRoot;
    const compiler = await this.detector.getPreferredCompiler();
    const systemIncludes = compiler ? await this.extractor.extractSystemIncludes(compiler) : [];
    const compilerBin = compiler?.path || 'clang++';
    const isMsvc = compiler?.type === 'msvc';

    const cppStandard = this.activeProject.cppStandard || 'c++20';
    const cStandard = this.activeProject.cStandard || 'c11';
    const cStdMsvc = (cStandard === 'c17' || cStandard === 'c11') ? cStandard : 'c11';
    const targetFile = outputFilePath || path.join(workspaceRoot, 'compile_commands.json');

    const globalIncludes = this.activeProject.globalIncludeDirectories ?? this.activeProject.includeDirectories;
    const globalDefs = this.activeProject.globalCompileDefinitions ?? this.activeProject.compileDefinitions;

    const entries: {
      directory: string;
      command?: string;
      arguments?: string[];
      file: string;
    }[] = [];

    const seenFiles = new Set<string>();

    for (const target of this.activeProject.targets) {
      const allIncludes = Array.from(
        new Set([...target.includeDirectories, ...globalIncludes, ...systemIncludes])
      );
      const allDefs = Array.from(new Set([...target.compileDefinitions, ...globalDefs]));

      for (const src of target.sourceFiles) {
        const norm = src.replace(/\\/g, '/');
        if (seenFiles.has(norm.toLowerCase())) continue;
        seenFiles.add(norm.toLowerCase());

        const isC = /\.c$/i.test(src);
        const isHeader = /\.(h|hpp|hxx|inl|ipp)$/i.test(src);
        const args: string[] = [compilerBin];

        if (isMsvc) {
          if (isC) {
            args.push('/nologo', `/std:${cStdMsvc}`, '/TC');
          } else {
            args.push('/nologo', `/std:${cppStandard}`, '/EHsc', '/TP');
          }
          for (const def of allDefs) {
            args.push(`/D${def}`);
          }
          for (const inc of allIncludes) {
            args.push(`/I${inc.replace(/\\/g, '/')}`);
          }
          args.push('/c', norm);
        } else {
          if (isC) {
            args.push('-xc', `-std=${cStandard}`, '-Wall');
          } else {
            args.push(isHeader ? '-xc++-header' : '-xc++', `-std=${cppStandard}`, '-Wall');
          }
          for (const def of allDefs) {
            args.push(`-D${def}`);
          }
          for (const inc of allIncludes) {
            args.push(`-I${inc.replace(/\\/g, '/')}`);
          }
          args.push('-c', norm);
        }

        entries.push({
          directory: workspaceRoot.replace(/\\/g, '/'),
          arguments: args,
          file: norm
        });
      }
    }

    // If targets had no explicit source files (e.g., header-only library or globbed files),
    // scan for C/C++ files in workspace to populate compilation database
    if (entries.length === 0) {
      const sourceFiles = this.discoverWorkspaceCppFiles(workspaceRoot);
      const allIncludes = Array.from(new Set([...globalIncludes, ...systemIncludes]));

      for (const file of sourceFiles) {
        const norm = file.replace(/\\/g, '/');
        const isC = /\.c$/i.test(file);
        const isHeader = /\.(h|hpp|hxx|inl|ipp)$/i.test(file);
        const args: string[] = [compilerBin];

        if (isMsvc) {
          if (isC) {
            args.push('/nologo', `/std:${cStdMsvc}`, '/TC');
          } else {
            args.push('/nologo', `/std:${cppStandard}`, '/EHsc', '/TP');
          }
          for (const def of globalDefs) {
            args.push(`/D${def}`);
          }
          for (const inc of allIncludes) {
            args.push(`/I${inc.replace(/\\/g, '/')}`);
          }
          args.push('/c', norm);
        } else {
          if (isC) {
            args.push('-xc', `-std=${cStandard}`, '-Wall');
          } else {
            args.push(isHeader ? '-xc++-header' : '-xc++', `-std=${cppStandard}`, '-Wall');
          }
          for (const def of globalDefs) {
            args.push(`-D${def}`);
          }
          for (const inc of allIncludes) {
            args.push(`-I${inc.replace(/\\/g, '/')}`);
          }
          args.push('-c', norm);
        }

        entries.push({
          directory: workspaceRoot.replace(/\\/g, '/'),
          arguments: args,
          file: norm
        });
      }
    }

    if (entries.length > 0) {
      try {
        fs.writeFileSync(targetFile, JSON.stringify(entries, null, 2), 'utf8');
        console.log(`NovaCpp: Statically generated compilation database with ${entries.length} files from CMakeLists.txt`);
        return targetFile;
      } catch (err) {
        console.warn('NovaCpp: Failed to write CMake compile_commands.json:', err);
      }
    }

    return null;
  }

  /**
   * Helper to discover C/C++ source and header files in the workspace.
   */
  private discoverWorkspaceCppFiles(workspaceRoot: string): string[] {
    const files: string[] = [];
    const ignored = new Set(['node_modules', '.git', '.vscode', '.clangd', 'dist', 'build', 'out', '.cache', 'bin', 'obj']);
    const exts = new Set(['.cpp', '.cxx', '.cc', '.c', '.h', '.hpp', '.hxx', '.cu']);

    const scan = (dir: string, depth: number) => {
      if (depth > 6 || files.length >= 200) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const e of entries) {
          if (e.isDirectory()) {
            if (!ignored.has(e.name.toLowerCase())) {
              scan(path.join(dir, e.name), depth + 1);
            }
          } else if (e.isFile()) {
            const ext = path.extname(e.name).toLowerCase();
            if (exts.has(ext)) {
              files.push(path.join(dir, e.name));
            }
          }
        }
      } catch {
        // Ignore read errors
      }
    };

    scan(workspaceRoot, 0);
    return files;
  }

  /**
   * Displays the CMake interactive menu allowing inspection of discovered include directories and targets.
   */
  public async openMenu(): Promise<void> {
    if (!this.activeProject) {
      vscode.window.showInformationMessage('No CMakeLists.txt found in the active workspace.');
      return;
    }

    const incCount = this.activeProject.includeDirectories.length;
    const targetCount = this.activeProject.targets.length;

    const items: (vscode.QuickPickItem & { action: string })[] = [
      {
        label: `$(folder) View Discovered Include Directories (${incCount})`,
        description: 'Inspect include directories extracted from CMakeLists.txt',
        action: 'showIncludes'
      },
      {
        label: `$(symbol-class) View Discovered Targets (${targetCount})`,
        description: 'Inspect executable and library targets declared in CMakeLists.txt',
        action: 'showTargets'
      },
      {
        label: '$(refresh) Re-parse CMakeLists.txt',
        description: 'Re-scan CMakeLists.txt and refresh IntelliSense includes',
        action: 'rescan'
      },
      {
        label: '$(database) Generate compile_commands.json from CMakeLists.txt',
        description: 'Synthesize compilation database directly from parsed CMake project',
        action: 'generateDb'
      }
    ];

    const selected = await vscode.window.showQuickPick(items, {
      placeHolder: `NovaCpp CMake Intelligence — ${path.basename(this.activeProject.workspaceRoot)}`
    });

    if (!selected) return;

    switch (selected.action) {
      case 'showIncludes': {
        const incItems = this.activeProject.includeDirectories.map((inc) => ({
          label: `$(file-directory) ${path.basename(inc)}`,
          description: inc
        }));
        if (incItems.length === 0) {
          vscode.window.showInformationMessage('No include directories found in CMakeLists.txt.');
        } else {
          await vscode.window.showQuickPick(incItems, {
            placeHolder: `Discovered Include Directories (${incItems.length})`
          });
        }
        break;
      }

      case 'showTargets': {
        const targetItems = this.activeProject.targets.map((t) => ({
          label: `$(symbol-property) ${t.name} [${t.type}]`,
          description: `${t.sourceFiles.length} file(s), ${t.includeDirectories.length} include path(s)`,
          detail: t.sourceFiles.map((s) => path.basename(s)).join(', ')
        }));
        if (targetItems.length === 0) {
          vscode.window.showInformationMessage('No targets found in CMakeLists.txt.');
        } else {
          await vscode.window.showQuickPick(targetItems, {
            placeHolder: `Discovered CMake Targets (${targetItems.length})`
          });
        }
        break;
      }

      case 'rescan': {
        await this.refresh();
        vscode.window.showInformationMessage(
          `NovaCpp: Successfully re-parsed CMakeLists.txt. Discovered ${this.activeProject.includeDirectories.length} include directory(ies).`
        );
        break;
      }

      case 'generateDb': {
        const generated = await this.synthesizeCompilationDatabase();
        if (generated) {
          vscode.window.showInformationMessage(
            `NovaCpp: Generated compile_commands.json from CMakeLists.txt at ${generated}`
          );
        } else {
          vscode.window.showWarningMessage('NovaCpp: Could not generate compile_commands.json.');
        }
        break;
      }
    }
  }

  private updateStatusBar(): void {
    if (!this.activeProject) {
      this.statusBarItem.hide();
      return;
    }

    const incCount = this.activeProject.includeDirectories.length;
    this.statusBarItem.text = `$(tools) CMake: [${incCount} include${incCount === 1 ? '' : 's'}]`;
    this.statusBarItem.tooltip = [
      'NovaCpp CMake Intelligence (Direct Static Parser):',
      `CMakeLists: ${this.activeProject.cmakeListsPath}`,
      `Discovered Includes: ${incCount}`,
      ...this.activeProject.includeDirectories.map((d) => `  - ${d}`),
      `Standard: ${this.activeProject.cppStandard || 'default'}`,
      'Click to inspect includes and targets'
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
