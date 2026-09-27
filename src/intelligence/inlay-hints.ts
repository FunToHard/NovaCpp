import * as vscode from 'vscode';

/**
 * Manages configuration and lifecycle of C/C++ Inlay Hints for TurboCpp.
 */
export class InlayHintManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.ensureInlayHintsConfigured();
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('turbocpp.inlayHints')) {
          this.ensureInlayHintsConfigured();
        }
      })
    );
  }

  /**
   * Evaluates the scoped TurboCpp inlay hint setting without mutating global editor configurations.
   */
  public async ensureInlayHintsConfigured(): Promise<void> {
    const novacppConfig = vscode.workspace.getConfiguration('turbocpp.inlayHints');
    const enabled = novacppConfig.get<boolean>('enabled', true);

    if (!enabled) {
      return;
    }
    // Respect user configuration sovereignty: do not unconditionally mutate global editor.inlayHints.enabled
  }

  /**
   * Returns whether TurboCpp inlay hints are enabled via scoped turbocpp.inlayHints.enabled.
   */
  public isEnabled(): boolean {
    return vscode.workspace.getConfiguration('turbocpp.inlayHints').get<boolean>('enabled', true);
  }

  public dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
