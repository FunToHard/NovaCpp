import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { CompilerDetector, CompilerInfo } from '../prober/compiler-detector';

const execFileAsync = promisify(execFile);

export class VsEnvironmentManager {
  private static readonly STORAGE_KEY = 'c-cpp-pro.activeVsEnvironment';
  private static readonly envCache = new Map<string, Record<string, string>>();

  /**
   * Retrieves or extracts the environment variables for an MSVC compiler.
   */
  public static async getEnvironmentForCompiler(
    compiler: CompilerInfo,
    arch: 'x64' | 'x86' = 'x64'
  ): Promise<Record<string, string> | undefined> {
    if (compiler.type !== 'msvc') return undefined;
    const vcvars = this.findVcvarsall(compiler);
    if (!vcvars) return undefined;

    const cacheKey = `${vcvars}|${arch}`;
    const cached = this.envCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const env = await this.extractEnvironment(vcvars, arch);
      this.envCache.set(cacheKey, env);
      return env;
    } catch {
      return undefined;
    }
  }

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
    const editions = ['Enterprise', 'Professional', 'Community', 'BuildTools', 'Preview'];
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
      maxBuffer: 10 * 1024 * 1024,
      timeout: 15000
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

    // Deduplicate PATH entries in the extracted environment
    for (const key of Object.keys(envMap)) {
      if (key.toUpperCase() === 'PATH') {
        const seen = new Set<string>();
        const uniquePaths: string[] = [];
        for (const part of envMap[key].split(';')) {
          const trimmed = part.trim();
          if (!trimmed) continue;
          const norm = path.normalize(trimmed).toLowerCase();
          if (!seen.has(norm)) {
            seen.add(norm);
            uniquePaths.push(trimmed);
          }
        }
        envMap[key] = uniquePaths.join(';');
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
      vscode.window.showErrorMessage('C/C++ Pro: No Visual Studio / MSVC installation found on this system.');
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
      vscode.window.showErrorMessage('C/C++ Pro: Could not locate vcvarsall.bat for selected compiler.');
      return false;
    }

    try {
      const env = await this.extractEnvironment(vcvars, arch);
      this.applyEnvironment(context, env, `${selectedCompiler.name} (${arch})`);

      const config = vscode.workspace.getConfiguration('c-cpp-pro');
      if (config.get<boolean>('persistVsDeveloperEnvironment', true)) {
        await context.workspaceState.update(this.STORAGE_KEY, { vcvars, arch, name: selectedCompiler.name });
      }

      vscode.window.showInformationMessage(
        `C/C++ Pro: Visual Studio Developer Environment [${selectedCompiler.name} (${arch})] activated for all integrated terminals and build tasks.`
      );
      return true;
    } catch (err: any) {
      vscode.window.showErrorMessage(`C/C++ Pro: Failed to activate developer environment: ${err.message ?? err}`);
      return false;
    }
  }

  /**
   * Clears the active Visual Studio Developer Environment from VS Code.
   */
  public static clearVsDeveloperEnvironment(context: vscode.ExtensionContext): void {
    context.environmentVariableCollection.clear();
    context.workspaceState.update(this.STORAGE_KEY, undefined);
    vscode.window.showInformationMessage('C/C++ Pro: Visual Studio Developer Environment cleared.');
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
      const matchKey = Object.keys(env).find((k) => k.toUpperCase() === key.toUpperCase());
      if (matchKey && env[matchKey]) {
        col.replace(key, env[matchKey]);
      }
    }

    // Prepend only newly added PATH entries to prevent Windows terminal environment overflow
    const pathKey = Object.keys(env).find((k) => k.toUpperCase() === 'PATH');
    if (pathKey && env[pathKey]) {
      const vcvarsEntries = env[pathKey].split(';').filter((p) => p.trim().length > 0);
      const existingEntries = new Set(
        (process.env['PATH'] || process.env['Path'] || '')
          .split(';')
          .filter((p) => p.trim().length > 0)
          .map((p) => path.normalize(p.trim()).toLowerCase())
      );
      const seen = new Set<string>();
      const newEntries: string[] = [];
      for (const p of vcvarsEntries) {
        const trimmed = p.trim();
        if (!trimmed) continue;
        const norm = path.normalize(trimmed).toLowerCase();
        if (!existingEntries.has(norm) && !seen.has(norm)) {
          seen.add(norm);
          newEntries.push(trimmed);
        }
      }
      const pathToAdd = newEntries.length > 0 ? newEntries.join(';') : '';
      if (pathToAdd) {
        col.prepend('PATH', pathToAdd + ';');
      }
    }
  }

  /**
   * Restores saved developer environment on extension activation if enabled.
   */
  public static async restoreSavedEnvironment(context: vscode.ExtensionContext): Promise<void> {
    const config = vscode.workspace.getConfiguration('c-cpp-pro');
    if (!config.get<boolean>('persistVsDeveloperEnvironment', true)) return;

    const saved = context.workspaceState.get<{ vcvars: string; arch: 'x64' | 'x86'; name: string }>(
      this.STORAGE_KEY
    );
    if (saved && fs.existsSync(saved.vcvars)) {
      try {
        const env = await this.extractEnvironment(saved.vcvars, saved.arch);
        this.applyEnvironment(context, env, `${saved.name} (${saved.arch})`);
        console.log(`C/C++ Pro: Restored Visual Studio Developer Environment for ${saved.name}`);
      } catch (err) {
        console.warn('C/C++ Pro: Could not restore saved developer environment:', err);
      }
    }
  }
}
