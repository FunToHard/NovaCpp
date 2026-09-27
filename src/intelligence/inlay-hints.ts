import * as vscode from 'vscode';

/**
 * Manages configuration and lifecycle of C/C++ Inlay Hints for NovaCpp.
 */
export class InlayHintManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.ensureInlayHintsConfigured();
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('novacpp.inlayHints')) {
          this.ensureInlayHintsConfigured();
        }
      })
    );
  }

  /**
   * Evaluates the scoped NovaCpp inlay hint setting without mutating global editor configurations.
   */
  public async ensureInlayHintsConfigured(): Promise<void> {
    const novacppConfig = vscode.workspace.getConfiguration('novacpp.inlayHints');
    const enabled = novacppConfig.get<boolean>('enabled', true);

    if (!enabled) {
      return;
    }
    // Respect user configuration sovereignty: do not unconditionally mutate global editor.inlayHints.enabled
  }

  /**
   * Returns whether NovaCpp inlay hints are enabled via scoped novacpp.inlayHints.enabled.
   */
  public isEnabled(): boolean {
    return vscode.workspace.getConfiguration('novacpp.inlayHints').get<boolean>('enabled', true);
  }

  public dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
