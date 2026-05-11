import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class IndexManager {
  /**
   * Clears the Clangd index and cache directories in the workspace and prompts to restart the language server.
   */
  public static async resetIndex(
    workspaceRoot?: string,
    onRestartServer?: () => Promise<void>
  ): Promise<boolean> {
    const root =
      workspaceRoot ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      vscode.window.showWarningMessage('NovaCpp: No workspace folder open to reset index.');
      return false;
    }

    const candidateDirs = [
      path.join(root, '.clangd', 'index'),
      path.join(root, '.clangd', 'cache'),
      path.join(root, '.cache', 'clangd')
    ];

    let removedAny = false;
    for (const dir of candidateDirs) {
      try {
        if (fs.existsSync(dir)) {
          await fs.promises.rm(dir, { recursive: true, force: true });
          removedAny = true;
        }
      } catch (err) {
        console.warn(`NovaCpp: Could not remove directory ${dir}:`, err);
      }
    }

    vscode.window.showInformationMessage(
      'NovaCpp: Clangd symbol index reset. Restarting language server...'
    );

    if (onRestartServer) {
      await onRestartServer();
    }

    return true;
  }
}
