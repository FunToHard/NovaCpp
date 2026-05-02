import * as vscode from 'vscode';
import { InactiveRegionsParams } from '../substrate/daemon-manager';

export class InactiveRegionsManager implements vscode.Disposable {
  private decorationType: vscode.TextEditorDecorationType;
  private inactiveRegionsMap = new Map<string, vscode.Range[]>();
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.decorationType = vscode.window.createTextEditorDecorationType({
      opacity: '0.55',
      isWholeLine: false
    });

    this.disposables.push(
      this.decorationType,
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.applyDecorations(editor);
        }
      }),
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.inactiveRegionsMap.delete(doc.uri.toString());
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('novacpp.inactiveRegionsDimming')) {
          this.refreshAllVisibleEditors();
        }
      })
    );
  }

  /**
   * Updates inactive regions for a document and refreshes decorations.
   */
  public handleInactiveRegions(params: InactiveRegionsParams): void {
    const uriStr = params.textDocument.uri;

    // Convert raw ranges if necessary
    const ranges = params.regions.map((r) => {
      if (r instanceof vscode.Range) return r;
      const start = new vscode.Position((r as any).start.line, (r as any).start.character);
      const end = new vscode.Position((r as any).end.line, (r as any).end.character);
      return new vscode.Range(start, end);
    });

    this.inactiveRegionsMap.set(uriStr, ranges);

    for (const editor of vscode.window.visibleTextEditors) {
      if (editor.document.uri.toString() === uriStr) {
        this.applyDecorations(editor);
      }
    }
  }

  /**
   * Applies the decoration to the given editor.
   */
  public applyDecorations(editor: vscode.TextEditor): void {
    const config = vscode.workspace.getConfiguration('novacpp');
    const enabled = config.get<boolean>('inactiveRegionsDimming', true);

    if (!enabled) {
      editor.setDecorations(this.decorationType, []);
      return;
    }

    const uriStr = editor.document.uri.toString();
    const regions = this.inactiveRegionsMap.get(uriStr) ?? [];
    editor.setDecorations(this.decorationType, regions);
  }

  public refreshAllVisibleEditors(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      this.applyDecorations(editor);
    }
  }

  public getRegions(uriStr: string): vscode.Range[] | undefined {
    return this.inactiveRegionsMap.get(uriStr);
  }

  public dispose(): void {
    this.inactiveRegionsMap.clear();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
