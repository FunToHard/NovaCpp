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

/**
 * Parses Linux Kernel / Zephyr / RTOS Kconfig `.config` file into compiler defines (-D).
 */
export function parseDotConfig(content: string): string[] {
  const defines: string[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();

      if (val === 'y') {
        defines.push(`${key}=1`);
      } else if (val === 'm') {
        defines.push(`${key}=1`);
      } else if (val.startsWith('"') && val.endsWith('"')) {
        defines.push(`${key}=${val}`);
      } else {
        defines.push(`${key}=${val}`);
      }
    }
  }

  return defines;
}

export class ProfileManager implements vscode.Disposable {
  private activeProfile: CppProfile;
  private statusBarItem: vscode.StatusBarItem;
  private onReloadCallback?: () => Promise<void>;

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
  }

  public dispose(): void {
    this.statusBarItem.dispose();
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

    // Auto-update compile_flags.txt if in workspace
    if (wsRoot) {
      try {
        const compiler = await this.detector.getPreferredCompiler();
        if (compiler) {
          const flags = this.synthesizeProfileFlags(this.activeProfile, wsRoot, compiler);
          const flagsPath = path.join(wsRoot, 'compile_flags.txt');
          await fs.promises.writeFile(flagsPath, flags.join('\n') + '\n', 'utf8');
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
