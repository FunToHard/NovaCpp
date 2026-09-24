import * as vscode from 'vscode';
import * as fs from 'fs';
import { debounce } from '../substrate/protocol-filter';

export class CMakeWatcher implements vscode.Disposable {
  private watcher: vscode.FileSystemWatcher | null = null;
  private disposables: vscode.Disposable[] = [];

  private debouncedReload = debounce(async (uri: vscode.Uri) => {
    try {
      if (fs.existsSync(uri.fsPath)) {
        const stats = fs.statSync(uri.fsPath);
        if (stats.size > 0) {
          console.log(`NovaCpp: Build database updated at ${uri.fsPath}. Reloading language server...`);
          await this.onReload();
        }
      }
    } catch (err) {
      console.warn(`NovaCpp: Error handling compilation database update:`, err);
    }
  }, 1500);

  constructor(
    private readonly onReload: () => Promise<void>,
    private readonly onCmakeUpdate?: (uri: vscode.Uri) => Promise<void>
  ) {
    // Watch for build artifacts and CMake configuration changes
    this.watcher = vscode.workspace.createFileSystemWatcher(
      '{**/compile_commands.json,**/compile_flags.txt,**/.clangd,**/CMakeLists.txt,**/CMakePresets.json,**/CMakeUserPresets.json}'
    );

    this.disposables.push(
      this.watcher.onDidChange(async (uri) => {
        if (this.onCmakeUpdate) await this.onCmakeUpdate(uri);
        this.debouncedReload(uri);
      }),
      this.watcher.onDidCreate(async (uri) => {
        if (this.onCmakeUpdate) await this.onCmakeUpdate(uri);
        this.debouncedReload(uri);
      }),
      this.watcher.onDidDelete(async (uri) => {
        if (this.onCmakeUpdate) await this.onCmakeUpdate(uri);
        this.debouncedReload({ fsPath: '' } as any);
      })
    );
  }

  public dispose(): void {
    this.debouncedReload.cancel();
    if (this.watcher) {
      this.watcher.dispose();
      this.watcher = null;
    }
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
