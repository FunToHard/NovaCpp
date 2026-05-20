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

  private normalizeUri(uriStr: string): string {
    try {
      const decoded = decodeURIComponent(uriStr);
      return vscode.Uri.parse(decoded).toString();
    } catch {
      return uriStr;
    }
  }

  private static parseColor(colorStr: string): string | vscode.ThemeColor | undefined {
    const trimmed = colorStr.trim();
    if (!trimmed) return undefined;
    const lower = trimmed.toLowerCase();
    if (lower === 'none' || lower === 'syntax') return undefined;

    const namedCssColors = new Set([
      'gray', 'grey', 'silver', 'dimgray', 'dimgrey', 'lightgray', 'lightgrey',
      'darkgray', 'darkgrey', 'black', 'white', 'red', 'green', 'blue', 'yellow'
    ]);

    if (
      trimmed.startsWith('#') ||
      trimmed.startsWith('rgb') ||
      trimmed.startsWith('hsl') ||
      namedCssColors.has(lower)
    ) {
      return trimmed;
    }
    return new vscode.ThemeColor(trimmed);
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

    const color = foregroundSetting ? InactiveRegionsManager.parseColor(foregroundSetting) : undefined;
    const backgroundColor = backgroundSetting ? InactiveRegionsManager.parseColor(backgroundSetting) : undefined;

    const opacity =
      typeof opacityVal === 'number' && !isNaN(opacityVal)
        ? Math.max(0.1, Math.min(1.0, opacityVal)).toString()
        : '0.6';

    return vscode.window.createTextEditorDecorationType({
      opacity,
      color,
      backgroundColor,
      isWholeLine: false,
      rangeBehavior: vscode.DecorationRangeBehavior.ClosedClosed
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
    const uriStr = this.normalizeUri(params.textDocument.uri);

    // Convert raw ranges if necessary
    const ranges = params.regions.map((r) => {
      if (r instanceof vscode.Range) return r;
      const start = new vscode.Position((r as any).start.line, (r as any).start.character);
      const end = new vscode.Position((r as any).end.line, (r as any).end.character);
      return new vscode.Range(start, end);
    });

    this.inactiveRegionsMap.set(uriStr, ranges);

    for (const editor of vscode.window.visibleTextEditors) {
      if (this.normalizeUri(editor.document.uri.toString()) === uriStr) {
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

    const uriStr = this.normalizeUri(editor.document.uri.toString());
    const rawRegions = this.inactiveRegionsMap.get(uriStr) ?? [];
    const regions = rawRegions
      .filter((r) => (r && r.isEmpty !== undefined ? !r.isEmpty : true))
      .map((r) => (typeof editor.document?.validateRange === 'function' ? editor.document.validateRange(r) : r));
    editor.setDecorations(this.decorationType, regions);
  }

  public refreshAllVisibleEditors(): void {
    for (const editor of vscode.window.visibleTextEditors) {
      this.applyDecorations(editor);
    }
  }

  public getRegions(uriStr: string): vscode.Range[] | undefined {
    return this.inactiveRegionsMap.get(this.normalizeUri(uriStr));
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
