import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { CompilerDetector, CompilerInfo } from '../prober/compiler-detector';
import { isCppFile, getOutputBinaryPath } from './runner';

const execFileAsync = promisify(execFile);

/**
 * Builds the shell command string for compiling and immediately running a C/C++ source file.
 */
export function buildRunCommand(
  compiler: CompilerInfo,
  sourceFile: string,
  outputBinary: string,
  standard: string = 'c++20',
  isWindows: boolean = process.platform === 'win32'
): string {
  if (compiler.type === 'msvc') {
    if (isWindows) {
      return `& "${compiler.path}" /EHsc /std:${standard} /Zi "${sourceFile}" /Fe:"${outputBinary}" ; if ($LASTEXITCODE -eq 0) { & "${outputBinary}" }`;
    }
    return `"${compiler.path}" /EHsc /std:${standard} /Zi "${sourceFile}" /Fe:"${outputBinary}" && "${outputBinary}"`;
  }

  // GCC / Clang
  const winLibs = compiler.type === 'gcc' && isWindows ? ' -static-libgcc -static-libstdc++' : '';
  if (isWindows) {
    return `& "${compiler.path}" "${sourceFile}" -std=${standard} -g${winLibs} -o "${outputBinary}" ; if ($LASTEXITCODE -eq 0) { & "${outputBinary}" }`;
  }
  return `"${compiler.path}" "${sourceFile}" -std=${standard} -g -o "${outputBinary}" && "${outputBinary}"`;
}

/**
 * Locates the Launch-VsDevShell.ps1 script associated with an installed Visual Studio / MSVC instance.
 */
export function findLaunchVsDevShell(compiler?: CompilerInfo): string | null {
  if (process.platform !== 'win32') {
    return null;
  }

  const candidateRoots: string[] = [];
  if (compiler && compiler.type === 'msvc') {
    if (compiler.path) {
      candidateRoots.push(path.dirname(compiler.path));
    }
    if (compiler.msvcInstallDir) {
      candidateRoots.push(compiler.msvcInstallDir);
    }
  }

  for (const root of candidateRoots) {
    let current = root;
    while (current && path.dirname(current) !== current) {
      const script = path.join(current, 'Common7', 'Tools', 'Launch-VsDevShell.ps1');
      if (fs.existsSync(script)) {
        return script;
      }
      current = path.dirname(current);
    }
  }

  const commonVsRoots = [
    'C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise',
    'C:\\Program Files\\Microsoft Visual Studio\\18\\Professional',
    'C:\\Program Files\\Microsoft Visual Studio\\18\\Community',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional',
    'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Enterprise',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Professional',
    'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019\\Community'
  ];

  for (const vsRoot of commonVsRoots) {
    const script = path.join(vsRoot, 'Common7', 'Tools', 'Launch-VsDevShell.ps1');
    if (fs.existsSync(script)) {
      return script;
    }
  }

  return null;
}

/**
 * Controller for running and debugging C/C++ source files from editor title bar buttons.
 */
export class RunController {
  private runTerminal: vscode.Terminal | null = null;

  constructor(private detector: CompilerDetector) {}

  /**
   * Compiles the active C/C++ file and executes it in the integrated terminal.
   */
  public async runFile(document?: vscode.TextDocument): Promise<boolean> {
    const doc = document || vscode.window.activeTextEditor?.document;
    if (!doc || !isCppFile(doc)) {
      vscode.window.showWarningMessage('NovaCpp: Open a valid C/C++ source file to run.');
      return false;
    }

    if (doc.isDirty) {
      await doc.save();
    }

    const compiler = await this.detector.getPreferredCompiler();
    if (!compiler) {
      vscode.window.showErrorMessage(
        'NovaCpp: No C/C++ compiler detected on system. Please install MSVC, GCC, or Clang.'
      );
      return false;
    }

    const sourceFile = doc.fileName;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const outputBinary = getOutputBinaryPath(sourceFile, workspaceRoot);

    // Ensure output directory exists
    const outputDir = path.dirname(outputBinary);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const config = vscode.workspace.getConfiguration('novacpp');
    const standard = config.get<string>('cppStandard', 'c++20');
    const runCmd = buildRunCommand(compiler, sourceFile, outputBinary, standard);

    const { terminal, isNew } = this.getOrCreateTerminal(compiler);
    terminal.show();
    if (isNew && compiler.type === 'msvc' && process.platform === 'win32') {
      // Allow Developer PowerShell environment initialization to finish
      await new Promise((r) => setTimeout(r, 600));
    }
    terminal.sendText(runCmd);
    return true;
  }

  /**
   * Compiles the active C/C++ file with debug flags and launches a NovaCpp DAP debug session.
   */
  public async debugFile(document?: vscode.TextDocument): Promise<boolean> {
    const doc = document || vscode.window.activeTextEditor?.document;
    if (!doc || !isCppFile(doc)) {
      vscode.window.showWarningMessage('NovaCpp: Open a valid C/C++ source file to debug.');
      return false;
    }

    if (doc.isDirty) {
      await doc.save();
    }

    const compiler = await this.detector.getPreferredCompiler();
    if (!compiler) {
      vscode.window.showErrorMessage('NovaCpp: No C/C++ compiler detected on system for debugging.');
      return false;
    }

    const sourceFile = doc.fileName;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    const outputBinary = getOutputBinaryPath(sourceFile, workspaceRoot);

    const outputDir = path.dirname(outputBinary);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const config = vscode.workspace.getConfiguration('novacpp');
    const standard = config.get<string>('cppStandard', 'c++20');

    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `NovaCpp: Building ${path.basename(sourceFile)} for debugging...`,
        cancellable: false
      },
      async () => {
        try {
          const isWindows = process.platform === 'win32';

          if (compiler.type === 'msvc') {
            const devShellScript = isWindows ? findLaunchVsDevShell(compiler) : null;
            if (devShellScript) {
              const arch = compiler.is64Bit !== false ? 'x64' : 'x86';
              const clCmd = `& "${compiler.path}" /EHsc /std:${standard} /Zi "${sourceFile}" /Fe:"${outputBinary}"`;
              const psArgs = [
                '-NoProfile',
                '-ExecutionPolicy',
                'Bypass',
                '-Command',
                `& '${devShellScript}' -Arch ${arch} -HostArch ${arch} -SkipAutomaticLocation -NoLogo ; ${clCmd}`
              ];

              await execFileAsync('powershell.exe', psArgs, {
                cwd: path.dirname(sourceFile)
              });
            } else {
              const compileArgs = ['/EHsc', `/std:${standard}`, '/Zi', `/Fe:${outputBinary}`, sourceFile];
              await execFileAsync(compiler.path, compileArgs, {
                cwd: path.dirname(sourceFile)
              });
            }
          } else {
            const compileArgs = [sourceFile, `-std=${standard}`, '-g', '-o', outputBinary];
            if (compiler.type === 'gcc' && isWindows) {
              compileArgs.push('-static-libgcc', '-static-libstdc++');
            }
            await execFileAsync(compiler.path, compileArgs, {
              cwd: path.dirname(sourceFile)
            });
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `NovaCpp: Compilation failed: ${err.stderr || err.message || err}`
          );
          return false;
        }

        // Launch NovaCpp debugger
        const debugConfig: vscode.DebugConfiguration = {
          name: `NovaCpp: Debug ${path.basename(sourceFile)}`,
          type: 'novacpp-debug',
          request: 'launch',
          program: outputBinary,
          cwd: path.dirname(sourceFile),
          stopOnEntry: false,
          console: 'integratedTerminal'
        };

        return await vscode.debug.startDebugging(undefined, debugConfig);
      }
    );
  }

  private getOrCreateTerminal(compiler: CompilerInfo): { terminal: vscode.Terminal; isNew: boolean } {
    const isWindows = process.platform === 'win32';
    const isMsvc = compiler.type === 'msvc' && isWindows;
    const terminalName = isMsvc ? 'Developer PowerShell for VS' : 'NovaCpp: Run';

    // Verify existing terminal is still alive
    const existing = vscode.window.terminals?.find(
      (t) => t.name === terminalName && (t as any).exitStatus === undefined
    );
    if (existing) {
      this.runTerminal = existing;
      return { terminal: existing, isNew: false };
    }

    if (isMsvc) {
      const devShellScript = findLaunchVsDevShell(compiler);
      if (devShellScript) {
        const arch = compiler.is64Bit !== false ? 'x64' : 'x86';
        const terminal = vscode.window.createTerminal({
          name: terminalName,
          shellPath: 'powershell.exe',
          shellArgs: [
            '-NoExit',
            '-ExecutionPolicy',
            'Bypass',
            '-Command',
            `& '${devShellScript}' -Arch ${arch} -HostArch ${arch} -SkipAutomaticLocation`
          ]
        });
        this.runTerminal = terminal;
        return { terminal, isNew: true };
      }
    }

    this.runTerminal = vscode.window.createTerminal(terminalName);
    return { terminal: this.runTerminal, isNew: true };
  }
}
