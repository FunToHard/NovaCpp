import * as vscode from 'vscode';
import { CompilerDetector, CompilerInfo } from '../prober/compiler-detector';
import { execFile } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const execFileAsync = promisify(execFile);

export interface DisassemblyOptions {
  optimizationLevel: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Ofast';
  intelSyntax: boolean;
  demangle: boolean;
  filterDirectives: boolean;
}

/**
 * Builds the compiler invocation arguments to output assembly.
 */
export function buildDisassemblyArgs(
  compiler: CompilerInfo,
  sourceFile: string,
  outputFile: string,
  options: DisassemblyOptions
): { command: string; args: string[] } {
  const optFlag = `-${options.optimizationLevel}`;

  if (compiler.type === 'msvc') {
    // MSVC: cl.exe /c /FA /Fa"outputFile" /std:c++20 /EHsc /O2 "sourceFile"
    const msvcOpt = options.optimizationLevel === 'O0' ? '/Od' : '/O2';
    return {
      command: compiler.path,
      args: [
        '/nologo',
        '/c',
        '/FA',
        `/Fa${outputFile}`,
        msvcOpt,
        '/EHsc',
        '/std:c++20',
        sourceFile
      ]
    };
  }

  // GCC / Clang
  const args: string[] = [
    '-S',
    optFlag,
    '-std=c++20'
  ];

  if (options.intelSyntax) {
    args.push('-masm=intel');
  }

  args.push(sourceFile, '-o', outputFile);

  return {
    command: compiler.path,
    args
  };
}

/**
 * Filters out raw compiler directives, debug CFI frames, and clutter to produce clean assembly.
 */
export function filterAssembly(rawAsm: string, options: { filterDirectives?: boolean } = {}): string {
  const lines = rawAsm.split(/\r?\n/);
  const result: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (options.filterDirectives) {
      // Filter CFI directives (.cfi_startproc, .cfi_def_cfa_offset, etc.)
      if (trimmed.startsWith('.cfi_') || trimmed.startsWith('.seh_')) continue;
      // Filter metadata directives (.file, .ident, .addrsig, .section with debug)
      if (trimmed.startsWith('.file') || trimmed.startsWith('.ident') || trimmed.startsWith('.def') || trimmed.startsWith('.scl')) continue;
      // Filter MSVC metadata like INCLUDELIB, TITLE, etc.
      if (trimmed.startsWith('INCLUDELIB') || trimmed.startsWith('TITLE') || trimmed.startsWith('PUBLIC')) continue;
    }

    result.push(line);
  }

  return result.join('\n');
}

/**
 * TextDocumentContentProvider for the virtual scheme "novacpp-disasm".
 */
export class DisassemblyContentProvider implements vscode.TextDocumentContentProvider, vscode.Disposable {
  public static readonly scheme = 'novacpp-disasm';
  private onDidChangeEmitter = new vscode.EventEmitter<vscode.Uri>();
  public readonly onDidChange = this.onDidChangeEmitter.event;

  private currentOptLevel: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Ofast' = 'O2';
  private cachedAsm = new Map<string, string>();

  constructor(private detector: CompilerDetector) {}

  public dispose(): void {
    this.onDidChangeEmitter.dispose();
  }

  public setOptimizationLevel(level: 'O0' | 'O1' | 'O2' | 'O3' | 'Os' | 'Ofast'): void {
    this.currentOptLevel = level;
    this.cachedAsm.clear();
  }

  public async provideTextDocumentContent(uri: vscode.Uri): Promise<string> {
    const sourceFilePath = uri.fsPath;
    const cacheKey = `${sourceFilePath}::${this.currentOptLevel}`;

    if (this.cachedAsm.has(cacheKey)) {
      return this.cachedAsm.get(cacheKey)!;
    }

    const compiler = await this.detector.getPreferredCompiler();
    if (!compiler) {
      return '; NovaCpp: No C/C++ compiler detected on your system to generate assembly.';
    }

    const tempAsm = path.join(os.tmpdir(), `novacpp_disasm_${Date.now()}.asm`);

    try {
      const { command, args } = buildDisassemblyArgs(compiler, sourceFilePath, tempAsm, {
        optimizationLevel: this.currentOptLevel,
        intelSyntax: true,
        demangle: true,
        filterDirectives: true
      });

      await execFileAsync(command, args, { timeout: 15000 });

      if (fs.existsSync(tempAsm)) {
        const raw = fs.readFileSync(tempAsm, 'utf-8');
        fs.unlinkSync(tempAsm);
        const filtered = filterAssembly(raw, { filterDirectives: true });

        const header = [
          `; =======================================================`,
          `; NovaCpp: Compiler Explorer Inline Disassembly`,
          `; Source: ${path.basename(sourceFilePath)}`,
          `; Compiler: ${compiler.name} (${compiler.path})`,
          `; Optimization: -${this.currentOptLevel} (Intel Syntax)`,
          `; =======================================================`,
          ''
        ].join('\n');

        const content = header + filtered;
        this.cachedAsm.set(cacheKey, content);
        return content;
      } else {
        return '; NovaCpp: Compiler did not produce assembly output file.';
      }
    } catch (err: any) {
      return `; NovaCpp: Disassembly failed:\n; ${err.message ?? err}`;
    }
  }

  public async openDisassemblyForActiveEditor(editor?: vscode.TextEditor): Promise<void> {
    const active = editor || vscode.window.activeTextEditor;
    if (!active) {
      vscode.window.showWarningMessage('NovaCpp: Open a C/C++ source file to view disassembly.');
      return;
    }

    const doc = active.document;
    const disasmUri = vscode.Uri.from({
      scheme: DisassemblyContentProvider.scheme,
      path: doc.fileName,
      query: `opt=${this.currentOptLevel}`
    });

    const disasmDoc = await vscode.workspace.openTextDocument(disasmUri);
    await vscode.window.showTextDocument(disasmDoc, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: true,
      preserveFocus: true
    });
  }
}
