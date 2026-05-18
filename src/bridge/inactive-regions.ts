import * as vscode from 'vscode';
import { InactiveRegionsParams } from '../substrate/daemon-manager';

export class InactiveRegionsManager implements vscode.Disposable {
  private decorationType: vscode.TextEditorDecorationType;
  private inactiveRegionsMap = new Map<string, vscode.Range[]>();
  private disposables: vscode.Disposable[] = [];

  constructor() {
    this.decorationType = this.createDecorationType();

    this.disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        if (editor) {
          this.applyDecorations(editor);
        }
      }),
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.inactiveRegionsMap.delete(doc.uri.toString());
      }),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (
          e.affectsConfiguration('novacpp.inactiveRegionsDimming') ||
          e.affectsConfiguration('novacpp.inactiveRegionForegroundColor') ||
          e.affectsConfiguration('novacpp.inactiveRegionBackgroundColor') ||
          e.affectsConfiguration('novacpp.inactiveRegionOpacity')
        ) {
          this.recreateDecorationType();
          this.refreshAllVisibleEditors();
        }
      })
    );
  }

  /**
   * Constructs decoration styling so inactive regions are explicitly grayed out
   * rather than simply faded or matching theme comment colors.
   */
  public createDecorationType(): vscode.TextEditorDecorationType {
    const config = vscode.workspace.getConfiguration('novacpp');
    const opacityVal = config.get<number>('inactiveRegionOpacity', 0.6);
    const foregroundSetting = config.get<string>('inactiveRegionForegroundColor', 'disabledForeground');
    const backgroundSetting = config.get<string>('inactiveRegionBackgroundColor', '');

    let color: string | vscode.ThemeColor | undefined;
    if (foregroundSetting && foregroundSetting.trim() !== '') {
      const trimmed = foregroundSetting.trim();
      const lower = trimmed.toLowerCase();
      if (lower !== 'none' && lower !== 'syntax') {
        if (trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
          color = trimmed;
        } else {
          color = new vscode.ThemeColor(trimmed);
        }
      }
    }

    let backgroundColor: string | vscode.ThemeColor | undefined;
    if (backgroundSetting && backgroundSetting.trim() !== '') {
      const trimmed = backgroundSetting.trim();
      if (trimmed.startsWith('#') || trimmed.startsWith('rgb') || trimmed.startsWith('hsl')) {
        backgroundColor = trimmed;
      } else {
        backgroundColor = new vscode.ThemeColor(trimmed);
      }
    }

    const opacity =
      typeof opacityVal === 'number' && !isNaN(opacityVal)
        ? Math.max(0.1, Math.min(1.0, opacityVal)).toString()
        : '0.6';

    return vscode.window.createTextEditorDecorationType({
      opacity,
      color,
      backgroundColor,
      isWholeLine: false,
      rangeBehavior: vscode.DecorationRangeBehavior.OpenOpen
    });
  }

  public recreateDecorationType(): void {
    const oldDecoration = this.decorationType;
    this.decorationType = this.createDecorationType();
    oldDecoration.dispose();
  }

  public getDecorationType(): vscode.TextEditorDecorationType {
    return this.decorationType;
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
    this.decorationType.dispose();
    this.inactiveRegionsMap.clear();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
