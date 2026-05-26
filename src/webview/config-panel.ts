import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompilerDetector, CompilerInfo } from '../prober/compiler-detector';
import { FlagSynthesizer } from '../prober/flag-synthesizer';

export interface WebviewSaveData {
  compilerPath: string;
  cppStandard: string;
  cStandard: string;
  outputFormat: 'compile_flags' | 'clangd_yaml';
  includes: string[];
  defines: string[];
}

export class ConfigPanel {
  public static currentPanel: ConfigPanel | undefined;
  public static readonly viewType = 'novacpp.configPanel';

  private readonly panel: vscode.WebviewPanel;
  private disposables: vscode.Disposable[] = [];

  public static render(
    extensionUri: vscode.Uri,
    detector: CompilerDetector,
    synthesizer: FlagSynthesizer,
    onReloadServer: () => Promise<void>
  ): ConfigPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (ConfigPanel.currentPanel) {
      ConfigPanel.currentPanel.panel.reveal(column);
      return ConfigPanel.currentPanel;
    }

    const panel = vscode.window.createWebviewPanel(
      ConfigPanel.viewType,
      'NovaCpp: Project Configuration',
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, 'src', 'webview', 'media'),
          vscode.Uri.joinPath(extensionUri, 'dist', 'media')
        ]
      }
    );

    ConfigPanel.currentPanel = new ConfigPanel(
      panel,
      extensionUri,
      detector,
      synthesizer,
      onReloadServer
    );
    return ConfigPanel.currentPanel;
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly extensionUri: vscode.Uri,
    private readonly detector: CompilerDetector,
    private readonly synthesizer: FlagSynthesizer,
    private readonly onReloadServer: () => Promise<void>
  ) {
    this.panel = panel;
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.html = this.getHtmlForWebview(this.panel.webview);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case 'getInitialData': {
            const data = await this.gatherInitialData();
            this.panel.webview.postMessage({ command: 'init', data });
            break;
          }
          case 'saveSettings': {
            const result = await this.handleSaveSettings(message.data as WebviewSaveData);
            this.panel.webview.postMessage({
              command: 'saveResult',
              success: result.success,
              message: result.message
            });
            break;
          }
        }
      },
      null,
      this.disposables
    );
  }

  public async gatherInitialData(): Promise<{
    compilers: CompilerInfo[];
    selectedCompiler: string;
    cppStandard: string;
    cStandard: string;
    outputFormat: string;
    includes: string[];
    defines: string[];
  }> {
    const compilers = await this.detector.detectAllCompilers();
    const config = vscode.workspace.getConfiguration('novacpp');
    const cppStandard = config.get<string>('cppStandard') ?? 'c++20';
    const cStandard = config.get<string>('cStandard') ?? 'c17';

    const preferred = await this.detector.getPreferredCompiler();
    const selectedCompiler = preferred ? preferred.path : compilers[0]?.path ?? '';

    let outputFormat = 'compile_flags';
    const includes: string[] = [];
    const defines: string[] = [];

    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (workspaceFolders && workspaceFolders.length > 0) {
      const rootPath = workspaceFolders[0].uri.fsPath;
      const flagsPath = path.join(rootPath, 'compile_flags.txt');
      const clangdPath = path.join(rootPath, '.clangd');

      if (fs.existsSync(clangdPath)) {
        outputFormat = 'clangd_yaml';
      }

      if (fs.existsSync(flagsPath)) {
        try {
          const lines = fs.readFileSync(flagsPath, 'utf8').split(/\r?\n/);
          for (const l of lines) {
            const trimmed = l.trim();
            if (trimmed.startsWith('-I')) {
              includes.push(trimmed.substring(2));
            } else if (trimmed.startsWith('-D')) {
              defines.push(trimmed.substring(2));
            }
          }
        } catch {
          // Ignored
        }
      }
    }

    return {
      compilers,
      selectedCompiler,
      cppStandard,
      cStandard,
      outputFormat,
      includes,
      defines
    };
  }

  public async handleSaveSettings(
    data: WebviewSaveData
  ): Promise<{ success: boolean; message: string }> {
    try {
      const config = vscode.workspace.getConfiguration('novacpp');
      await config.update('cppStandard', data.cppStandard, vscode.ConfigurationTarget.Workspace);
      await config.update('cStandard', data.cStandard, vscode.ConfigurationTarget.Workspace);

      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders || workspaceFolders.length === 0) {
        return {
          success: true,
          message: 'Settings saved to user configuration (no workspace folder open).'
        };
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const compilers = await this.detector.detectAllCompilers();
      const selected = compilers.find((c) => c.path === data.compilerPath) ?? {
        name: 'Custom Compiler',
        type: 'gcc',
        path: data.compilerPath
      } as CompilerInfo;

      if (data.outputFormat === 'compile_flags') {
        const extraFlags: string[] = [];
        for (const inc of data.includes) {
          extraFlags.push(`-I${inc.replace(/\\/g, '/')}`);
        }
        for (const def of data.defines) {
          extraFlags.push(`-D${def}`);
        }

        const flags = await this.synthesizer.generateFlags(selected, {
          standard: data.cppStandard,
          extraFlags,
          forceOverwrite: true
        });

        const targetFile = path.join(rootPath, 'compile_flags.txt');
        fs.writeFileSync(targetFile, flags.join('\n') + '\n', 'utf8');
      } else if (data.outputFormat === 'clangd_yaml') {
        const addFlags: string[] = [`-std=${data.cppStandard}`];
        for (const inc of data.includes) {
          const sanitizedInc = inc.replace(/[\r\n]/g, '').replace(/"/g, '\\"').replace(/\\/g, '/');
          addFlags.push(`-I${sanitizedInc}`);
        }
        for (const def of data.defines) {
          const sanitizedDef = def.replace(/[\r\n]/g, '').replace(/"/g, '\\"');
          addFlags.push(`-D${sanitizedDef}`);
        }

        const yamlContent = [
          '# Generated by NovaCpp',
          'CompileFlags:',
          '  Add:',
          ...addFlags.map((f) => `    - "${f}"`)
        ].join('\n') + '\n';

        const targetFile = path.join(rootPath, '.clangd');
        fs.writeFileSync(targetFile, yamlContent, 'utf8');
      }

      // Reload language server
      await this.onReloadServer();

      return {
        success: true,
        message: `Successfully updated ${data.outputFormat === 'compile_flags' ? 'compile_flags.txt' : '.clangd'} and reloaded language server.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: `Failed to save configuration: ${err.message ?? err}`
      };
    }
  }

  private getHtmlForWebview(webview: vscode.Webview): string {
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'media', 'main.js')
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, 'src', 'webview', 'media', 'style.css')
    );

    let nonce = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < 32; i++) {
      nonce += possible.charAt(Math.floor(Math.random() * possible.length));
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="${styleUri}">
  <title>NovaCpp Configuration</title>
</head>
<body>
  <div class="container">
    <header>
      <h1>NovaCpp Configuration</h1>
      <p class="subtitle">Visual Settings Editor for C/C++ Standards, Toolchains & Flag Generation</p>
    </header>

    <div id="statusMessage" class="status-message"></div>

    <div class="card">
      <h2>1. Active Toolchain & Compilers</h2>
      <div class="form-group">
        <label for="toolchain">Detected Toolchain</label>
        <select id="toolchain">
          <option>Scanning compilers...</option>
        </select>
        <p class="help-text">Select compiler toolset for system headers and standard library extraction.</p>
      </div>
    </div>

    <div class="card">
      <h2>2. Language Standards</h2>
      <div class="form-group">
        <label for="cppStandard">C++ Language Standard</label>
        <select id="cppStandard">
          <option value="c++11">C++11</option>
          <option value="c++14">C++14</option>
          <option value="c++17">C++17</option>
          <option value="c++20" selected>C++20</option>
          <option value="c++23">C++23</option>
          <option value="c++26">C++26 (Experimental)</option>
        </select>
      </div>

      <div class="form-group">
        <label for="cStandard">C Language Standard</label>
        <select id="cStandard">
          <option value="c89">C89 / ANSI C</option>
          <option value="c99">C99</option>
          <option value="c11">C11</option>
          <option value="c17" selected>C17</option>
          <option value="c23">C23</option>
        </select>
      </div>
    </div>

    <div class="card">
      <h2>3. Include Directories</h2>
      <div class="form-group">
        <div class="inline-form">
          <input type="text" id="newInclude" placeholder="e.g. /usr/local/include or include/">
          <button id="addIncludeBtn">Add Include</button>
        </div>
        <div id="includeList" class="tag-list"></div>
      </div>
    </div>

    <div class="card">
      <h2>4. Preprocessor Definitions</h2>
      <div class="form-group">
        <div class="inline-form">
          <input type="text" id="newDefine" placeholder="e.g. DEBUG=1 or USE_FAST_MATH">
          <button id="addDefineBtn">Add Definition</button>
        </div>
        <div id="defineList" class="tag-list"></div>
      </div>
    </div>

    <div class="card">
      <h2>5. Configuration Target</h2>
      <div class="form-group">
        <label for="outputFormat">Generated Configuration File</label>
        <select id="outputFormat">
          <option value="compile_flags" selected>compile_flags.txt (Simple flag list)</option>
          <option value="clangd_yaml">.clangd (Clangd Project Configuration)</option>
        </select>
        <p class="help-text">Saving will write to the chosen file in your workspace root and seamlessly reload clangd.</p>
      </div>
    </div>

    <div class="actions">
      <button id="saveBtn">Save and Apply</button>
    </div>
  </div>

  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  private isDisposing = false;
  public dispose(): void {
    if (this.isDisposing) return;
    this.isDisposing = true;

    ConfigPanel.currentPanel = undefined;
    this.panel.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
