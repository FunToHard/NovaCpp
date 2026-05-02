import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as which from 'which';
import * as clangdInstall from '@clangd/install';

export interface ClangdUI {
  readonly storagePath: string;
  clangdPath: string;
  info(s: string): void;
  error(s: string): void;
  showHelp(message: string, url: string): void;
  promptReload(message: string): void;
  promptUpdate(oldVersion: string, newVersion: string): void;
  promptInstall(version: string): void;
  shouldReuse(path: string): Promise<boolean | undefined>;
  slow<T>(title: string, work: Promise<T>): Promise<T>;
  progress<T>(
    title: string,
    cancel: AbortController | null,
    work: (progress: (fraction: number) => void) => Promise<T>
  ): Promise<T>;
  localize(message: string, ...args: Array<string | number | boolean>): string;
}

export class VSCodeClangdUI implements ClangdUI {
  constructor(
    private readonly context: vscode.ExtensionContext,
    public clangdPath: string = 'clangd'
  ) {}

  get storagePath(): string {
    return this.context.globalStorageUri.fsPath;
  }

  info(s: string): void {
    vscode.window.showInformationMessage(`NovaCpp: ${s}`);
  }

  error(s: string): void {
    vscode.window.showErrorMessage(`NovaCpp: ${s}`);
  }

  showHelp(message: string, url: string): void {
    vscode.window
      .showInformationMessage(`NovaCpp: ${message}`, 'Open Help')
      .then((choice) => {
        if (choice === 'Open Help') {
          vscode.env.openExternal(vscode.Uri.parse(url));
        }
      });
  }

  promptReload(message: string): void {
    vscode.window
      .showInformationMessage(`NovaCpp: ${message}`, 'Reload Window')
      .then((choice) => {
        if (choice === 'Reload Window') {
          vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
      });
  }

  promptUpdate(oldVersion: string, newVersion: string): void {
    vscode.window
      .showInformationMessage(
        `NovaCpp: A clangd update is available (${oldVersion} -> ${newVersion}). Install now?`,
        'Install',
        'Later'
      )
      .then((choice) => {
        if (choice === 'Install') {
          clangdInstall.installLatest(this);
        }
      });
  }

  promptInstall(version: string): void {
    vscode.window
      .showInformationMessage(
        `NovaCpp: clangd language server (${version}) is required but not installed. Install now?`,
        'Install clangd',
        'Cancel'
      )
      .then((choice) => {
        if (choice === 'Install clangd') {
          clangdInstall.installLatest(this);
        }
      });
  }

  async shouldReuse(reusePath: string): Promise<boolean | undefined> {
    const choice = await vscode.window.showInformationMessage(
      `NovaCpp: Found existing clangd at ${reusePath}. Use it?`,
      'Yes',
      'No'
    );
    return choice === 'Yes';
  }

  async slow<T>(title: string, work: Promise<T>): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `NovaCpp: ${title}`,
        cancellable: false
      },
      () => work
    );
  }

  async progress<T>(
    title: string,
    cancel: AbortController | null,
    work: (progress: (fraction: number) => void) => Promise<T>
  ): Promise<T> {
    return vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `NovaCpp: ${title}`,
        cancellable: cancel !== null
      },
      (progress, token) => {
        if (cancel) {
          token.onCancellationRequested(() => cancel.abort());
        }
        return work((fraction) => {
          progress.report({ increment: Math.round(fraction * 100) });
        });
      }
    );
  }

  localize(message: string, ...args: Array<string | number | boolean>): string {
    return message.replace(/{(\d+)}/g, (match, number) => {
      return typeof args[number] !== 'undefined' ? String(args[number]) : match;
    });
  }
}

export class ClangdInstaller {
  constructor(private readonly context?: vscode.ExtensionContext) {}

  /**
   * Resolves the clangd binary path.
   * Priority:
   * 1. Configuration setting `novacpp.clangdPath`
   * 2. System PATH
   * 3. Downloaded binary in extension globalStorageUri
   * 4. Interactive install via @clangd/install
   */
  public async resolveClangdPath(checkUpdate = false): Promise<string | null> {
    // 1. Check user configuration
    const config = vscode.workspace.getConfiguration('novacpp');
    const configuredPath = config.get<string>('clangdPath')?.trim();
    if (configuredPath && configuredPath.length > 0) {
      if (fs.existsSync(configuredPath)) {
        return configuredPath;
      }
      try {
        const found = which.sync(configuredPath);
        if (found) {
          return found;
        }
      } catch {
        // Fall through
      }
    }

    // 2. Check system PATH
    try {
      const foundInPath = which.sync('clangd');
      if (foundInPath && fs.existsSync(foundInPath)) {
        return foundInPath;
      }
    } catch {
      // Clangd not in PATH
    }

    // 3. Check installed binary in global storage
    if (this.context) {
      const storageDir = this.context.globalStorageUri.fsPath;
      const expectedBinary = process.platform === 'win32' ? 'clangd.exe' : 'clangd';
      const installedBinary = path.join(storageDir, 'install', 'bin', expectedBinary);
      if (fs.existsSync(installedBinary)) {
        return installedBinary;
      }

      // Check versioned directories in storage
      const installBase = path.join(storageDir, 'install');
      if (fs.existsSync(installBase)) {
        const files = fs.readdirSync(installBase);
        for (const f of files) {
          const candidate = path.join(installBase, f, 'bin', expectedBinary);
          if (fs.existsSync(candidate)) {
            return candidate;
          }
        }
      }

      // 4. Offer automated installation using @clangd/install
      try {
        const ui = new VSCodeClangdUI(this.context);
        const status = await clangdInstall.prepare(ui, checkUpdate);
        if (status.clangdPath) {
          return status.clangdPath;
        }
      } catch (err) {
        console.error('NovaCpp: Error running clangd installer:', err);
      }
    }

    return null;
  }

  /**
   * Explicitly triggers download and install of the latest clangd.
   */
  public async installLatest(): Promise<void> {
    if (!this.context) {
      throw new Error('Extension context required for installation');
    }
    const ui = new VSCodeClangdUI(this.context);
    await clangdInstall.installLatest(ui);
  }
}
