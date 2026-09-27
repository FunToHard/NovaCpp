import * as vscode from 'vscode';

/**
 * Manages configuration and lifecycle of C/C++ Inlay Hints for c-cpp-pro.
 */
export class InlayHintManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.ensureInlayHintsConfigured();
    this.disposables.push(
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('c-cpp-pro.inlayHints')) {
          this.ensureInlayHintsConfigured();
        }
      })
    );
  }

  /**
   * Evaluates the scoped C/C++ Pro inlay hint setting without mutating global editor configurations.
   */
  public async ensureInlayHintsConfigured(): Promise<void> {
    const cppProConfig = vscode.workspace.getConfiguration('c-cpp-pro.inlayHints');
    const enabled = cppProConfig.get<boolean>('enabled', true);

    if (!enabled) {
      return;
    }
    // Respect user configuration sovereignty: do not unconditionally mutate global editor.inlayHints.enabled
  }

  /**
   * Returns whether C/C++ Pro inlay hints are enabled via scoped c-cpp-pro.inlayHints.enabled.
   */
  public isEnabled(): boolean {
    return vscode.workspace.getConfiguration('c-cpp-pro.inlayHints').get<boolean>('enabled', true);
  }

  public dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
