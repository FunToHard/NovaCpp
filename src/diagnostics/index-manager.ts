import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export class IndexManager {
  /**
   * Clears the Clangd index and cache directories in the workspace and prompts to restart the language server.
   */
  public static async resetIndex(
    workspaceRoot?: string,
    onRestartServer?: () => Promise<void>,
    onStopServer?: () => Promise<void>
  ): Promise<boolean> {
    const root =
      workspaceRoot ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
    if (!root) {
      vscode.window.showWarningMessage('C/C++ Pro: No workspace folder open to reset index.');
      return false;
    }

    // Stop language server to release open file handles on Windows before deleting
    if (onStopServer) {
      await onStopServer();
    }

    const candidateDirs = [
      path.join(root, '.clangd', 'index'),
      path.join(root, '.clangd', 'cache'),
      path.join(root, '.cache', 'clangd')
    ];

    const maxAttempts = 5;
    const baseDelayMs = 300;

    for (const dir of candidateDirs) {
      if (!fs.existsSync(dir)) {
        continue;
      }

      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          if (!fs.existsSync(dir)) {
            break;
          }
          await fs.promises.rm(dir, { recursive: true, force: true });
          break;
        } catch (err) {
          if (attempt === maxAttempts) {
            console.warn(`C/C++ Pro: Could not remove directory ${dir} after ${maxAttempts} attempts:`, err);
          } else {
            const delay = baseDelayMs * attempt;
            await new Promise((resolve) => setTimeout(resolve, delay));
          }
        }
      }
    }

    vscode.window.showInformationMessage(
      'C/C++ Pro: Clangd symbol index reset. Restarting language server...'
    );

    if (onRestartServer) {
      await onRestartServer();
    }

    return true;
  }
}
