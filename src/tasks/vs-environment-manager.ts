import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { CompilerDetector, CompilerInfo } from '../prober/compiler-detector';

const execFileAsync = promisify(execFile);

export class VsEnvironmentManager {
  private static readonly STORAGE_KEY = 'novacpp.activeVsEnvironment';

  /**
   * Locates vcvarsall.bat associated with a compiler or Visual Studio directory.
   */
  public static findVcvarsall(compiler?: CompilerInfo | null): string | null {
    if (process.platform !== 'win32') return null;

    const candidateRoots: string[] = [];

    if (compiler && compiler.path) {
      candidateRoots.push(path.dirname(compiler.path));
    }
    if (compiler && compiler.msvcInstallDir) {
      candidateRoots.push(compiler.msvcInstallDir);
    }

    // Standard VS installation directories
    const progFiles = process.env['ProgramFiles'] ?? 'C:\\Program Files';
    const editions = ['Enterprise', 'Professional', 'Community'];
    for (const year of ['18', '2022', '2019']) {
      for (const ed of editions) {
        candidateRoots.push(path.join(progFiles, 'Microsoft Visual Studio', year, ed));
      }
    }

    for (const root of candidateRoots) {
      let current = root;
      while (current && path.dirname(current) !== current) {
        const vcvars = path.join(current, 'VC', 'Auxiliary', 'Build', 'vcvarsall.bat');
        if (fs.existsSync(vcvars)) {
          return vcvars;
        }
        current = path.dirname(current);
      }
    }

    return null;
  }

  /**
   * Extracts environment variables emitted by vcvarsall.bat.
   */
  public static async extractEnvironment(
    vcvarsPath: string,
    arch: 'x64' | 'x86' = 'x64'
  ): Promise<Record<string, string>> {
    const comSpec = process.env.ComSpec || 'cmd.exe';
    const cmd = `call "${vcvarsPath}" ${arch} >nul && set`;

    const { stdout } = await execFileAsync(comSpec, ['/c', cmd], {
      windowsHide: true,
      maxBuffer: 10 * 1024 * 1024
    });

    const envMap: Record<string, string> = {};
    const lines = stdout.split(/\r?\n/);

    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx > 0) {
        const key = line.substring(0, eqIdx).trim();
        const value = line.substring(eqIdx + 1).trim();
        if (key && value) {
          envMap[key] = value;
        }
      }
    }

    return envMap;
  }

  /**
   * Interactive command to set the Visual Studio Developer Environment.
   */
  public static async setVsDeveloperEnvironment(
    context: vscode.ExtensionContext,
    detector: CompilerDetector
  ): Promise<boolean> {
    if (process.platform !== 'win32') {
      vscode.window.showWarningMessage('Visual Studio Developer Environment is only available on Windows.');
      return false;
    }

    const compilers = await detector.detectAllCompilers();
    const msvcCompilers = compilers.filter((c) => c.type === 'msvc');

    if (msvcCompilers.length === 0) {
      vscode.window.showErrorMessage('NovaCpp: No Visual Studio / MSVC installation found on this system.');
      return false;
    }

    let selectedCompiler: CompilerInfo;
    if (msvcCompilers.length === 1) {
      selectedCompiler = msvcCompilers[0];
    } else {
      const items = msvcCompilers.map((c) => ({
        label: c.name,
        description: c.path,
        compiler: c
      }));
      const picked = await vscode.window.showQuickPick(items, {
        placeHolder: 'Select Visual Studio MSVC Toolset'
      });
      if (!picked) return false;
      selectedCompiler = picked.compiler;
    }

    const archItems: Array<{ label: 'x64' | 'x86'; description: string }> = [
      { label: 'x64', description: '64-bit Native Tools (Recommended)' },
      { label: 'x86', description: '32-bit Native / Cross Tools' }
    ];
    const pickedArch = await vscode.window.showQuickPick(archItems, {
      placeHolder: 'Select Target Architecture'
    });
    const arch = pickedArch?.label ?? 'x64';

    const vcvars = this.findVcvarsall(selectedCompiler);
    if (!vcvars) {
      vscode.window.showErrorMessage('NovaCpp: Could not locate vcvarsall.bat for selected compiler.');
      return false;
    }

    try {
      const env = await this.extractEnvironment(vcvars, arch);
      this.applyEnvironment(context, env, `${selectedCompiler.name} (${arch})`);

      const config = vscode.workspace.getConfiguration('novacpp');
      if (config.get<boolean>('persistVsDeveloperEnvironment', true)) {
        await context.workspaceState.update(this.STORAGE_KEY, { vcvars, arch, name: selectedCompiler.name });
      }

      vscode.window.showInformationMessage(
        `NovaCpp: Visual Studio Developer Environment [${selectedCompiler.name} (${arch})] activated for all integrated terminals and build tasks.`
      );
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(`NovaCpp: Failed to activate developer environment: ${err.message ?? err}`);
      return false;
    }
  }

  /**
   * Clears the active Visual Studio Developer Environment from VS Code.
   */
  public static clearVsDeveloperEnvironment(context: vscode.ExtensionContext): void {
    context.environmentVariableCollection.clear();
    context.workspaceState.update(this.STORAGE_KEY, undefined);
    vscode.window.showInformationMessage('NovaCpp: Visual Studio Developer Environment cleared.');
  }

  /**
   * Injects the extracted environment map into VS Code's environmentVariableCollection.
   */
  public static applyEnvironment(
    context: vscode.ExtensionContext,
    env: Record<string, string>,
    label: string
  ): void {
    const col = context.environmentVariableCollection;
    col.clear();
    col.description = `Visual Studio Developer Environment: ${label}`;

    // Variables to replace
    const replaceKeys = [
      'INCLUDE',
      'LIB',
      'LIBPATH',
      'VCToolsInstallDir',
      'VCToolsVersion',
      'WindowsSdkDir',
      'WindowsSdkVersion',
      'WindowsSDKLibVersion',
      'UniversalCRTSdkDir',
      'UCRTVersion',
      'VCINSTALLDIR'
    ];

    for (const key of replaceKeys) {
      if (env[key]) {
        col.replace(key, env[key]);
      }
    }

    // Prepend PATH so cl.exe, link.exe, msbuild.exe take precedence
    if (env['PATH']) {
      col.prepend('PATH', env['PATH'] + ';');
    }
  }

  /**
   * Restores saved developer environment on extension activation if enabled.
   */
  public static async restoreSavedEnvironment(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('novacpp');
    if (!config.get<boolean>('persistVsDeveloperEnvironment', true)) return;

    const saved = context.workspaceState.get<{ vcvars: string; arch: 'x64' | 'x86'; name: string }>(
      this.STORAGE_KEY
    );
    if (saved && fs.existsSync(saved.vcvars)) {
      try {
        const env = await this.extractEnvironment(saved.vcvars, saved.arch);
        this.applyEnvironment(context, env, `${saved.name} (${saved.arch})`);
        console.log(`NovaCpp: Restored Visual Studio Developer Environment for ${saved.name}`);
      } catch (err) {
        console.warn('NovaCpp: Could not restore saved developer environment:', err);
      }
    }
  }
}
