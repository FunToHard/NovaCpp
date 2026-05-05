import * as vscode from 'vscode';
import * as os from 'os';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  RequestType,
  NotificationType,
  TextDocumentIdentifier,
  State
} from 'vscode-languageclient/node';
import { ClangdInstaller } from './installer';
import { createClangdMiddleware, EditorEventDebouncer } from './protocol-filter';
import { StlRankingTable } from '../telemetry/ranking-table';

export const defaultClangdArguments: string[] = [
  '--background-index',
  '--clang-tidy',
  '--header-insertion=iwyu',
  '--completion-style=detailed',
  '--function-arg-placeholders=true',
  '--fallback-style=llvm',
  '--header-insertion-decorators=true',
  '-j=0'
];

export interface InactiveRegionsParams {
  textDocument: TextDocumentIdentifier;
  regions: vscode.Range[];
}

export const SwitchSourceHeaderRequest = new RequestType<
  TextDocumentIdentifier,
  string | null,
  void
>('textDocument/switchSourceHeader');

export const InactiveRegionsNotification = new NotificationType<InactiveRegionsParams>(
  'textDocument/inactiveRegions'
);

export class DaemonManager implements vscode.Disposable {
  private client: LanguageClient | null = null;
  private statusBarItem: vscode.StatusBarItem;
  private outputChannel: vscode.OutputChannel;
  private eventDebouncer: EditorEventDebouncer;
  private disposables: vscode.Disposable[] = [];
  private onInactiveRegionsEmitter = new vscode.EventEmitter<InactiveRegionsParams>();
  public readonly onInactiveRegions = this.onInactiveRegionsEmitter.event;

  private restartCount = 0;
  private maxRestarts = 5;
  private lastRestartTime = 0;

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly installer: ClangdInstaller,
    private readonly rankingTable: StlRankingTable = new StlRankingTable()
  ) {
    this.outputChannel = vscode.window.createOutputChannel('NovaCpp Language Server');
    this.eventDebouncer = new EditorEventDebouncer();
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.name = 'NovaCpp Status';
    this.statusBarItem.command = 'novacpp.restartServer';

    this.disposables.push(
      this.outputChannel,
      this.eventDebouncer,
      this.statusBarItem,
      this.onInactiveRegionsEmitter
    );
  }

  public async start(): Promise<void> {
    this.updateStatusBar('$(sync~spin) NovaCpp: Resolving clangd...', 'Searching for clangd binary');
    this.statusBarItem.show();

    const clangdPath = await this.installer.resolveClangdPath();
    if (!clangdPath) {
      this.updateStatusBar('$(error) NovaCpp: clangd missing', 'Click to install clangd');
      this.statusBarItem.command = 'novacpp.installClangd';
      const action = await vscode.window.showErrorMessage(
        'NovaCpp: clangd executable not found. Would you like to install it now?',
        'Install clangd',
        'Configure Path'
      );
      if (action === 'Install clangd') {
        await vscode.commands.executeCommand('novacpp.installClangd');
      } else if (action === 'Configure Path') {
        await vscode.commands.executeCommand('workbench.action.openSettings', 'novacpp.clangdPath');
      }
      return;
    }

    this.updateStatusBar('$(sync~spin) NovaCpp: Starting...', `Launching ${clangdPath}`);

    const config = vscode.workspace.getConfiguration('novacpp');
    const userArgs = config.get<string[]>('clangdArgs') ?? [];

    // Combine default and user arguments uniquely
    const argSet = new Set<string>(defaultClangdArguments);
    for (const arg of userArgs) {
      argSet.add(arg);
    }

    // Sanitize arguments: Clangd rejects -j=0 with "A number of worker threads cannot be 0"
    // Worker threads must be >= 1. Map 0 to all available hardware CPU cores.
    const finalArgs = Array.from(argSet).map((arg) => {
      if (arg === '-j=0' || arg === '-j 0') {
        const cores = Math.max(1, os.cpus()?.length || 4);
        return `-j=${cores}`;
      }
      return arg;
    });

    const serverOptions: ServerOptions = {
      command: clangdPath,
      args: finalArgs,
      options: {
        env: process.env
      }
    };

    const clientOptions: LanguageClientOptions = {
      documentSelector: [
        { scheme: 'file', language: 'c' },
        { scheme: 'file', language: 'cpp' },
        { scheme: 'file', language: 'cuda-cpp' }
      ],
      synchronize: {
        fileEvents: [
          vscode.workspace.createFileSystemWatcher('**/compile_commands.json'),
          vscode.workspace.createFileSystemWatcher('**/compile_flags.txt'),
          vscode.workspace.createFileSystemWatcher('**/.clangd')
        ]
      },
      initializationOptions: {
        clangdFileStatus: true,
        fallbackFlags: ['-std=c++20', '-xc++']
      },
      outputChannel: this.outputChannel,
      middleware: createClangdMiddleware(this.rankingTable),
      errorHandler: {
        error: (error, message, count) => {
          this.outputChannel.appendLine(`[Error] ${error.message} (${count})`);
          return { action: 1 }; // Continue
        },
        closed: () => {
          this.outputChannel.appendLine('[Closed] Connection to clangd closed.');
          const now = Date.now();
          if (now - this.lastRestartTime > 60000) {
            this.restartCount = 0;
          }
          this.lastRestartTime = now;
          this.restartCount++;

          if (this.restartCount <= this.maxRestarts) {
            this.outputChannel.appendLine(
              `[Watchdog] Attempting auto-restart (${this.restartCount}/${this.maxRestarts})...`
            );
            this.restart();
            return { action: 2 }; // Restart
          } else {
            vscode.window.showErrorMessage(
              'NovaCpp: clangd daemon crashed repeatedly. Auto-restart aborted.'
            );
            this.updateStatusBar('$(error) NovaCpp: Crashed', 'Click to restart language server');
            return { action: 1 }; // Do not restart
          }
        }
      }
    };

    this.client = new LanguageClient(
      'novacpp.clangd',
      'NovaCpp Language Server',
      serverOptions,
      clientOptions
    );

    this.client.onDidChangeState((event) => {
      if (event.newState === State.Running) {
        this.updateStatusBar('$(check) NovaCpp: Ready', 'clangd is active and ready');
        this.registerCustomProtocolHandlers();
      } else if (event.newState === State.Stopped) {
        this.updateStatusBar('$(circle-slash) NovaCpp: Stopped', 'Click to start language server');
      }
    });

    try {
      await this.client.start();
      this.outputChannel.appendLine(`[Info] clangd daemon started successfully from ${clangdPath}`);
    } catch (err: any) {
      this.outputChannel.appendLine(`[Fatal] Failed to start clangd: ${err.message ?? err}`);
      this.updateStatusBar('$(error) NovaCpp: Launch Failed', 'Click to inspect logs');
      vscode.window.showErrorMessage(`NovaCpp: Failed to start clangd: ${err.message ?? err}`);
    }
  }

  private registerCustomProtocolHandlers(): void {
    if (!this.client) return;

    // Listen to inactive regions notification for dead code dimming
    this.client.onNotification(InactiveRegionsNotification, (params: InactiveRegionsParams) => {
      this.onInactiveRegionsEmitter.fire(params);
    });

    // Listen to clangd file status for status bar index progress
    this.client.onNotification(
      'textDocument/clangd.fileStatus',
      (status: { uri: string; state: string }) => {
        if (status.state.includes('idle')) {
          this.updateStatusBar('$(check) NovaCpp: Idle', `Idle on ${status.uri}`);
        } else {
          this.updateStatusBar(`$(sync~spin) NovaCpp: ${status.state}`, status.state);
        }
      }
    );
  }

  public async switchSourceHeader(): Promise<void> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor || !this.client || !this.client.isRunning()) {
      vscode.window.showWarningMessage('NovaCpp: No active C/C++ file or clangd is not running');
      return;
    }

    const docId: TextDocumentIdentifier = {
      uri: activeEditor.document.uri.toString()
    };

    try {
      const targetUriString = await this.client.sendRequest(SwitchSourceHeaderRequest, docId);
      if (targetUriString) {
        const targetUri = vscode.Uri.parse(targetUriString);
        const doc = await vscode.workspace.openTextDocument(targetUri);
        await vscode.window.showTextDocument(doc, { preview: false });
      } else {
        vscode.window.showInformationMessage('NovaCpp: Corresponding source/header not found');
      }
    } catch (err: any) {
      vscode.window.showErrorMessage(`NovaCpp: Failed to switch source/header: ${err.message ?? err}`);
    }
  }

  public async restart(): Promise<void> {
    this.outputChannel.appendLine('[Info] Restarting NovaCpp Language Server...');
    await this.stop();
    await this.start();
  }

  public async stop(): Promise<void> {
    if (this.client) {
      try {
        if (this.client.isRunning()) {
          await this.client.stop();
        } else {
          await this.client.dispose();
        }
      } catch (err) {
        this.outputChannel.appendLine(`[Warn] Error stopping client: ${err}`);
      }
      this.client = null;
    }
  }

  private updateStatusBar(text: string, tooltip: string): void {
    this.statusBarItem.text = text;
    this.statusBarItem.tooltip = tooltip;
    this.statusBarItem.command = 'novacpp.restartServer';
  }

  public getClient(): LanguageClient | null {
    return this.client;
  }

  dispose(): void {
    this.stop();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
