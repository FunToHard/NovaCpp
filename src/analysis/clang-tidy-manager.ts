import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { spawn } from 'child_process';

export class ClangTidyManager implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Empty
  ];

  private static instance: ClangTidyManager | null = null;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('NovaCpp Clang-Tidy');
    this.outputChannel = vscode.window.createOutputChannel('NovaCpp Clang-Tidy');
  }

  public static getInstance(): ClangTidyManager {
    if (!this.instance) {
      this.instance = new ClangTidyManager();
    }
    return this.instance;
  }

  public getDiagnosticCollection(): vscode.DiagnosticCollection {
    return this.diagnosticCollection;
  }

  public getOutputChannel(): vscode.OutputChannel {
    return this.outputChannel;
  }

  public dispose(): void {
    this.diagnosticCollection.dispose();
    this.outputChannel.dispose();
  }

  /**
   * Extracts Clang-Tidy check name from diagnostic code or message.
   * Examples: 'modernize-use-override', 'readability-identifier-naming', '[bugprone-narrowing-conversions]'
   */
  public static extractCheckName(diagnostic: vscode.Diagnostic): string | null {
    if (diagnostic.code !== undefined && diagnostic.code !== null) {
      let codeStr = '';
      if (typeof diagnostic.code === 'string') {
        codeStr = diagnostic.code;
      } else if (typeof diagnostic.code === 'object' && 'value' in diagnostic.code) {
        codeStr = String((diagnostic.code as any).value ?? '');
      }
      if (/^[a-z0-9]+-[a-z0-9-]+$/i.test(codeStr)) {
        return codeStr;
      }
    }

    const match = diagnostic.message.match(/\[([a-z0-9]+-[a-z0-9-]+)\]\s*$/i);
    if (match) {
      return match[1];
    }

    return null;
  }

  /**
   * Generates official LLVM documentation URL for a given Clang-Tidy check.
   */
  public static getDocUrl(checkName: string): string {
    const dashIdx = checkName.indexOf('-');
    if (dashIdx !== -1) {
      const family = checkName.substring(0, dashIdx);
      const name = checkName.substring(dashIdx + 1);
      return `https://clang.llvm.org/extra/clang-tidy/checks/${family}/${name}.html`;
    }
    return 'https://clang.llvm.org/extra/clang-tidy/checks/list.html';
  }

  /**
   * Provides Clang-Tidy Code Actions: Documentation link, // NOLINTNEXTLINE, // NOLINT, and batch fix.
   */
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const actions: vscode.CodeAction[] = [];
    const checkNamesSeen = new Set<string>();

    for (const diag of context.diagnostics) {
      const checkName = ClangTidyManager.extractCheckName(diag);
      if (!checkName || checkNamesSeen.has(checkName)) continue;
      checkNamesSeen.add(checkName);

      const lineIndex = diag.range.start.line;
      const lineText = document.lineAt(lineIndex).text;
      const indentMatch = lineText.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1] : '';

      // 1. Documentation Link Code Action
      const docUrl = ClangTidyManager.getDocUrl(checkName);
      const docAction = new vscode.CodeAction(
        `📖 Open Clang-Tidy Documentation for '${checkName}'`,
        vscode.CodeActionKind.Empty
      );
      docAction.command = {
        command: 'vscode.open',
        title: 'Open Documentation',
        arguments: [vscode.Uri.parse(docUrl)]
      };
      actions.push(docAction);

      // 2. Disable with // NOLINTNEXTLINE
      const disableNextLineAction = new vscode.CodeAction(
        `Disable '${checkName}' with // NOLINTNEXTLINE`,
        vscode.CodeActionKind.QuickFix
      );
      const editNextLine = new vscode.WorkspaceEdit();
      editNextLine.insert(
        document.uri,
        new vscode.Position(lineIndex, 0),
        `${indent}// NOLINTNEXTLINE(${checkName})\n`
      );
      disableNextLineAction.edit = editNextLine;
      actions.push(disableNextLineAction);

      // 3. Disable on this line with // NOLINT
      const disableLineAction = new vscode.CodeAction(
        `Disable '${checkName}' on this line with // NOLINT`,
        vscode.CodeActionKind.QuickFix
      );
      const editLine = new vscode.WorkspaceEdit();
      editLine.insert(
        document.uri,
        new vscode.Position(lineIndex, lineText.length),
        ` // NOLINT(${checkName})`
      );
      disableLineAction.edit = editLine;
      actions.push(disableLineAction);
    }

    return actions;
  }

  /**
   * Finds the clang-tidy binary path from config, PATH, or standard LLVM directory.
   */
  public static findClangTidyBinary(): string | null {
    const config = vscode.workspace.getConfiguration('novacpp');
    const customPath = config.get<string>('codeAnalysis.clangTidy.path', '').trim();
    if (customPath && fs.existsSync(customPath)) {
      return customPath;
    }

    const candidatePaths: string[] = [];
    if (process.platform === 'win32') {
      candidatePaths.push(
        'C:\\Program Files\\LLVM\\bin\\clang-tidy.exe',
        'C:\\ProgramData\\mingw64\\mingw64\\bin\\clang-tidy.exe'
      );
    } else {
      candidatePaths.push('/usr/bin/clang-tidy', '/usr/local/bin/clang-tidy');
    }

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) return p;
    }

    return 'clang-tidy';
  }

  /**
   * Locates the active compilation database directory.
   */
  public static findCompilationDatabaseDir(fileFsPath: string): string | null {
    let currentDir = path.dirname(fileFsPath);
    const root = path.parse(fileFsPath).root;

    while (currentDir !== root) {
      if (fs.existsSync(path.join(currentDir, 'compile_commands.json'))) {
        return currentDir;
      }
      if (fs.existsSync(path.join(currentDir, 'build', 'compile_commands.json'))) {
        return path.join(currentDir, 'build');
      }
      currentDir = path.dirname(currentDir);
    }

    const wsFolders = vscode.workspace.workspaceFolders;
    if (wsFolders && wsFolders.length > 0) {
      const wsRoot = wsFolders[0].uri.fsPath;
      if (fs.existsSync(path.join(wsRoot, 'compile_commands.json'))) {
        return wsRoot;
      }
      if (fs.existsSync(path.join(wsRoot, 'build', 'compile_commands.json'))) {
        return path.join(wsRoot, 'build');
      }
    }

    return null;
  }

  /**
   * Runs Clang-Tidy on the active file and populates the diagnostics collection.
   */
  public async runOnActiveFile(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showWarningMessage('NovaCpp: No active editor to run Clang-Tidy on.');
      return;
    }

    const doc = editor.document;
    if (doc.languageId !== 'cpp' && doc.languageId !== 'c') {
      vscode.window.showWarningMessage('NovaCpp: Active file is not a C/C++ source file.');
      return;
    }

    const filePath = doc.uri.fsPath;
    const clangTidyBin = ClangTidyManager.findClangTidyBinary();
    if (!clangTidyBin) {
      vscode.window.showErrorMessage('NovaCpp: clang-tidy binary not found.');
      return;
    }

    const compDbDir = ClangTidyManager.findCompilationDatabaseDir(filePath);
    const args: string[] = [];
    if (compDbDir) {
      args.push(`-p=${compDbDir}`);
    }

    const config = vscode.workspace.getConfiguration('novacpp');
    const enabledChecks = config.get<string[]>('codeAnalysis.clangTidy.checks.enabled', []);
    const disabledChecks = config.get<string[]>('codeAnalysis.clangTidy.checks.disabled', []);

    if (enabledChecks.length > 0 || disabledChecks.length > 0) {
      const checkArg = [
        ...enabledChecks,
        ...disabledChecks.map((c) => (c.startsWith('-') ? c : `-${c}`))
      ].join(',');
      args.push(`--checks=${checkArg}`);
    }

    args.push(filePath);

    this.outputChannel.clear();
    this.outputChannel.appendLine(`=== NovaCpp Clang-Tidy Analysis: ${path.basename(filePath)} ===`);
    this.outputChannel.appendLine(`Command: ${clangTidyBin} ${args.join(' ')}\n`);
    this.outputChannel.show(true);

    const diagnostics: vscode.Diagnostic[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `NovaCpp: Running Clang-Tidy on ${path.basename(filePath)}...`,
        cancellable: true
      },
      (_progress, token) => {
        return new Promise<void>((resolve) => {
          const child = spawn(clangTidyBin, args, { shell: true });

          token.onCancellationRequested(() => {
            child.kill();
            resolve();
          });

          let stdoutData = '';
          let stderrData = '';

          child.stdout?.on('data', (d) => {
            const str = d.toString();
            stdoutData += str;
            this.outputChannel.append(str);
          });

          child.stderr?.on('data', (d) => {
            const str = d.toString();
            stderrData += str;
            this.outputChannel.append(str);
          });

          child.on('close', (code) => {
            this.outputChannel.appendLine(`\n[Clang-Tidy finished with exit code ${code}]`);

            // Parse diagnostics from stdout/stderr:
            // Example: F:/DEV/project/main.cpp:15:5: warning: message [check-name]
            const lineRegex = /^([^:\r\n]+):(\d+):(\d+):\s+(warning|error|note):\s+(.*?)(?:\s+\[([a-z0-9-]+)\])?\s*$/;
            const outputLines = (stdoutData + '\n' + stderrData).split(/\r?\n/);

            for (const outLine of outputLines) {
              const match = outLine.match(lineRegex);
              if (match) {
                const lineNum = Math.max(0, parseInt(match[2], 10) - 1);
                const colNum = Math.max(0, parseInt(match[3], 10) - 1);
                const severity =
                  match[4] === 'error'
                    ? vscode.DiagnosticSeverity.Error
                    : match[4] === 'warning'
                    ? vscode.DiagnosticSeverity.Warning
                    : vscode.DiagnosticSeverity.Information;

                const msg = match[5];
                const check = match[6];
                const fullMsg = check ? `${msg} [${check}]` : msg;

                const diag = new vscode.Diagnostic(
                  new vscode.Range(lineNum, colNum, lineNum, colNum + 5),
                  fullMsg,
                  severity
                );
                diag.source = 'clang-tidy';
                if (check) {
                  diag.code = check;
                }
                diagnostics.push(diag);
              }
            }

            this.diagnosticCollection.set(doc.uri, diagnostics);
            vscode.window.showInformationMessage(
              `NovaCpp: Clang-Tidy completed with ${diagnostics.length} diagnostic(s).`
            );
            resolve();
          });

          child.on('error', (err) => {
            this.outputChannel.appendLine(`Failed to spawn clang-tidy: ${err.message}`);
            resolve();
          });
        });
      }
    );
  }

  /**
   * Clears all static analysis diagnostics.
   */
  public clearDiagnostics(): void {
    this.diagnosticCollection.clear();
    vscode.window.showInformationMessage('NovaCpp: Cleared all Clang-Tidy code analysis problems.');
  }
}
