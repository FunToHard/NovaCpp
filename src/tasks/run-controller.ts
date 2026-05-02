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

    const terminal = this.getOrCreateTerminal();
    terminal.show();
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
          const compileArgs: string[] = [];

          if (compiler.type === 'msvc') {
            compileArgs.push('/EHsc', `/std:${standard}`, '/Zi', `/Fe:${outputBinary}`, sourceFile);
          } else {
            compileArgs.push(sourceFile, `-std=${standard}`, '-g', '-o', outputBinary);
            if (compiler.type === 'gcc' && isWindows) {
              compileArgs.push('-static-libgcc', '-static-libstdc++');
            }
          }

          await execFileAsync(compiler.path, compileArgs, {
            cwd: path.dirname(sourceFile)
          });
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
          stopOnEntry: false
        };

        return await vscode.debug.startDebugging(undefined, debugConfig);
      }
    );
  }

  private getOrCreateTerminal(): vscode.Terminal {
    // Verify existing terminal is still alive
    const existing = vscode.window.terminals?.find((t) => t.name === 'NovaCpp: Run');
    if (existing) {
      this.runTerminal = existing;
      return existing;
    }

    this.runTerminal = vscode.window.createTerminal('NovaCpp: Run');
    return this.runTerminal;
  }
}
