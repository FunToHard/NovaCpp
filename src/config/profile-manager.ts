import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompilerDetector, CompilerInfo } from '../prober/compiler-detector';

export interface CppProfile {
  name: string;
  compilerPath?: string;
  compilerArgs?: string[];
  cStandard?: string;
  cppStandard?: string;
  includePath?: string[];
  defines?: string[];
  forcedInclude?: string[];
  dotConfig?: string;
  compileCommands?: string;
}

export interface PropertiesConfigFile {
  configurations?: CppProfile[];
  version?: number;
}

export { parseDotConfig } from './kconfig-parser';
import { parseDotConfig } from './kconfig-parser';

export class ProfileManager implements vscode.Disposable {
  private activeProfile: CppProfile;
  private statusBarItem: vscode.StatusBarItem;
  private onReloadCallback?: () => Promise<void>;
  private disposables: vscode.Disposable[] = [];

  constructor(
    private readonly detector: CompilerDetector,
    onReloadCallback?: () => Promise<void>
  ) {
    this.onReloadCallback = onReloadCallback;
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'novacpp.selectProfile';

    this.activeProfile = this.getDefaultProfile();
    this.updateStatusBar();
    this.registerWatchers();
  }

  private registerWatchers(): void {
    const configWatcher = vscode.workspace.createFileSystemWatcher('**/.config');
    const propsWatcher = vscode.workspace.createFileSystemWatcher('**/.vscode/c_cpp_properties.json');

    const handleExternalEdit = async () => {
      await this.reloadProfiles();
    };

    this.disposables.push(
      configWatcher,
      propsWatcher,
      configWatcher.onDidChange(handleExternalEdit),
      configWatcher.onDidCreate(handleExternalEdit),
      configWatcher.onDidDelete(handleExternalEdit),
      propsWatcher.onDidChange(handleExternalEdit),
      propsWatcher.onDidCreate(handleExternalEdit),
      propsWatcher.onDidDelete(handleExternalEdit)
    );
  }

  public async reloadProfiles(): Promise<void> {
    const wsFolders = vscode.workspace.workspaceFolders;
    const wsRoot = wsFolders?.[0]?.uri.fsPath;
    const profiles = this.loadProfiles(wsRoot);

    const matching = profiles.find((p) => p.name === this.activeProfile.name);
    if (matching) {
      this.activeProfile = matching;
    } else if (profiles.length > 0) {
      this.activeProfile = profiles[0];
    } else {
      this.activeProfile = this.getDefaultProfile();
    }
    this.updateStatusBar();

    if (wsRoot) {
      try {
        const flagsPath = path.join(wsRoot, 'compile_flags.txt');
        if (fs.existsSync(flagsPath)) {
          const compiler = await this.detector.getPreferredCompiler();
          if (compiler) {
            const flags = this.synthesizeProfileFlags(this.activeProfile, wsRoot, compiler);
            await fs.promises.writeFile(flagsPath, flags.join('\n') + '\n', 'utf8');
          }
        }
      } catch (err) {
        console.warn('NovaCpp: Could not update compile_flags.txt on profile reload:', err);
      }
    }

    if (this.onReloadCallback) {
      await this.onReloadCallback();
    }
  }

  public dispose(): void {
    this.statusBarItem.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }

  public getActiveProfile(): CppProfile {
    return this.activeProfile;
  }

  private updateStatusBar(): void {
    this.statusBarItem.text = `$(gear) ${this.activeProfile.name}`;
    this.statusBarItem.tooltip = `NovaCpp Target Profile: ${this.activeProfile.name} (Click to switch)`;
    this.statusBarItem.show();
  }

  public getDefaultProfile(): CppProfile {
    const config = vscode.workspace.getConfiguration('novacpp');
    return {
      name: 'Default',
      cppStandard: config.get<string>('cppStandard', 'c++20'),
      cStandard: config.get<string>('cStandard', 'c17'),
      includePath: ['${workspaceFolder}/**'],
      defines: [],
      forcedInclude: config.get<string[]>('default.forcedInclude', [])
    };
  }

  /**
   * Discovers all defined profiles in the workspace.
   */
  public loadProfiles(workspaceRoot?: string): CppProfile[] {
    const root = workspaceRoot ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) return [this.getDefaultProfile()];

    const cCppProps = path.join(root, '.vscode', 'c_cpp_properties.json');
    const novacppProps = path.join(root, '.vscode', 'novacpp.json');

    for (const filePath of [cCppProps, novacppProps]) {
      if (fs.existsSync(filePath)) {
        try {
          const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8')) as PropertiesConfigFile;
          if (parsed.configurations && parsed.configurations.length > 0) {
            return parsed.configurations;
          }
        } catch (err) {
          console.warn(`NovaCpp: Could not parse configuration profiles from ${filePath}:`, err);
        }
      }
    }

    return [this.getDefaultProfile()];
  }

  /**
   * Synthesizes compiler flags array for the active profile.
   */
  public synthesizeProfileFlags(profile: CppProfile, workspaceRoot: string, compiler: CompilerInfo): string[] {
    const flags: string[] = [];
    const isMsvc = compiler.type === 'msvc';

    if (isMsvc) {
      flags.push('--driver-mode=cl');
      flags.push(`-std:${profile.cppStandard ?? 'c++20'}`);
      flags.push('/EHsc');
      flags.push('/TP');
    } else {
      flags.push('-xc++');
      flags.push(`-std=${profile.cppStandard ?? 'c++20'}`);
      flags.push('-Wall');
    }

    // Defines from profile
    if (profile.defines) {
      for (const d of profile.defines) {
        flags.push(isMsvc ? `/D${d}` : `-D${d}`);
      }
    }

    // Defines from Kconfig .config
    if (profile.dotConfig) {
      const dotConfigPath = path.isAbsolute(profile.dotConfig)
        ? profile.dotConfig
        : path.join(workspaceRoot, profile.dotConfig);

      if (fs.existsSync(dotConfigPath)) {
        try {
          const content = fs.readFileSync(dotConfigPath, 'utf8');
          const kconfigDefines = parseDotConfig(content);
          for (const d of kconfigDefines) {
            flags.push(isMsvc ? `/D${d}` : `-D${d}`);
          }
        } catch {
          // Ignore
        }
      }
    }

    // Forced includes (/FI or -include)
    if (profile.forcedInclude) {
      for (const fi of profile.forcedInclude) {
        const resolved = fi.replace(/\$\{workspaceFolder\}/g, workspaceRoot);
        flags.push(isMsvc ? `/FI${resolved}` : `-include ${resolved}`);
      }
    }

    // Extra compiler args
    if (profile.compilerArgs) {
      flags.push(...profile.compilerArgs);
    }

    return flags;
  }

  /**
   * Prompts the developer to select an active configuration profile.
   */
  public async selectProfile(): Promise<boolean> {
    const wsFolders = vscode.workspace.workspaceFolders;
    const wsRoot = wsFolders?.[0]?.uri.fsPath;
    const profiles = this.loadProfiles(wsRoot);

    const items = profiles.map((p) => ({
      label: p.name,
      description: p.compilerPath ?? (p.cppStandard ? `Standard: ${p.cppStandard}` : ''),
      detail: p.defines && p.defines.length > 0 ? `Defines: ${p.defines.join(', ')}` : undefined,
      profile: p
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: `Active Profile: ${this.activeProfile.name}`
    });

    if (!picked) return false;

    this.activeProfile = picked.profile;
    this.updateStatusBar();

    // Update compile_flags.txt if already present in workspace
    if (wsRoot) {
      try {
        const flagsPath = path.join(wsRoot, 'compile_flags.txt');
        if (fs.existsSync(flagsPath)) {
          const compiler = await this.detector.getPreferredCompiler();
          if (compiler) {
            const flags = this.synthesizeProfileFlags(this.activeProfile, wsRoot, compiler);
            await fs.promises.writeFile(flagsPath, flags.join('\n') + '\n', 'utf8');
          }
        }
      } catch (err) {
        console.warn('NovaCpp: Could not update compile_flags.txt on profile change:', err);
      }
    }

    vscode.window.showInformationMessage(
      `NovaCpp: Switched active target profile to '${this.activeProfile.name}'.`
    );

    if (this.onReloadCallback) {
      await this.onReloadCallback();
    }

    return true;
  }
}
