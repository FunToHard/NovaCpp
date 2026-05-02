import * as vscode from 'vscode';

/**
 * Manages configuration and lifecycle of C/C++ Inlay Hints for NovaCpp.
 */
export class InlayHintManager implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.ensureInlayHintsConfigured();
  }

  /**
   * Validates and applies recommended settings for parameter name and type inlay hints.
   */
  public async ensureInlayHintsConfigured(): Promise<void> {
    const editorConfig = vscode.workspace.getConfiguration('editor.inlayHints');
    const enabled = editorConfig.get<string>('enabled');

    if (!enabled || enabled === 'off') {
      try {
        await editorConfig.update('enabled', 'on', vscode.ConfigurationTarget.Global);
      } catch {
        // Silently ignore if permission restricted in test harnesses
      }
    }
  }

  public dispose(): void {
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
