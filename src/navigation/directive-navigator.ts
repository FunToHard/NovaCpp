import * as vscode from 'vscode';

export interface PreprocessorDirective {
  line: number;
  type: 'if' | 'elif' | 'else' | 'endif';
  depth: number;
  text: string;
}

export class DirectiveNavigator {
  public static toLines(input: string[] | { lineCount: number; lineAt(i: number): { text: string } }): string[] {
    if (Array.isArray(input)) {
      return input;
    }
    if (input && typeof (input as any).lineCount === 'number') {
      const result: string[] = [];
      for (let i = 0; i < input.lineCount; i++) {
        result.push(input.lineAt(i).text);
      }
      return result;
    }
    return [];
  }

  /**
   * Scans a document or line array to extract preprocessor directives with nesting depth.
   */
  public static extractDirectives(
    input: string[] | { lineCount: number; lineAt(i: number): { text: string } }
  ): PreprocessorDirective[] {
    const lines = this.toLines(input);
    const directives: PreprocessorDirective[] = [];
    let depth = 0;
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const rawLine = lines[i];
      const trimmed = rawLine.trim();

      // Handle multi-line block comments
      if (inBlockComment) {
        if (trimmed.includes('*/')) {
          inBlockComment = false;
        }
        continue;
      }
      if (trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) {
          inBlockComment = true;
        }
        continue;
      }

      // Ignore single-line comments
      if (trimmed.startsWith('//')) continue;

      const match = trimmed.match(/^#(?:\/\*.*?\*\/|\s)*(if|ifdef|ifndef|elif|elifdef|elifndef|else|endif)\b/);
      if (!match) continue;

      const keyword = match[1];

      if (keyword === 'if' || keyword === 'ifdef' || keyword === 'ifndef') {
        depth++;
        directives.push({
          line: i,
          type: 'if',
          depth,
          text: trimmed
        });
      } else if (keyword.startsWith('elif')) {
        directives.push({
          line: i,
          type: 'elif',
          depth,
          text: trimmed
        });
      } else if (keyword === 'else') {
        directives.push({
          line: i,
          type: 'else',
          depth,
          text: trimmed
        });
      } else if (keyword === 'endif') {
        directives.push({
          line: i,
          type: 'endif',
          depth,
          text: trimmed
        });
        if (depth > 0) depth--;
      }
    }

    return directives;
  }

  /**
   * Finds the line number of the next directive in the active preprocessor group.
   */
  public static findNextDirective(
    input: string[] | { lineCount: number; lineAt(i: number): { text: string } },
    currentLine: number
  ): number | null {
    const directives = this.extractDirectives(input);
    if (directives.length === 0) return null;

    // Find closest enclosing or preceding directive to determine group depth
    let targetDepth: number | null = null;
    for (let i = directives.length - 1; i >= 0; i--) {
      if (directives[i].line <= currentLine) {
        targetDepth = directives[i].depth;
        break;
      }
    }

    // If currentLine is before any directive, jump to first directive
    if (targetDepth === null) {
      return directives[0].line;
    }

    // Look for next directive at same depth or closing endif
    for (const d of directives) {
      if (d.line > currentLine) {
        if (d.depth === targetDepth) {
          return d.line;
        }
      }
    }

    // If nothing at same depth, jump to next directive overall
    for (const d of directives) {
      if (d.line > currentLine) {
        return d.line;
      }
    }

    return null;
  }

  /**
   * Finds the line number of the previous directive in the active preprocessor group.
   */
  public static findPrevDirective(
    input: string[] | { lineCount: number; lineAt(i: number): { text: string } },
    currentLine: number
  ): number | null {
    const directives = this.extractDirectives(input);
    if (directives.length === 0) return null;

    // Find directives strictly before currentLine
    const candidates = directives.filter((d) => d.line < currentLine);
    if (candidates.length === 0) return null;

    // If currentLine is directly on a directive, use its depth as targetDepth
    const currentDir = directives.find((d) => d.line === currentLine);
    const lastCandidate = candidates[candidates.length - 1];
    const targetDepth = currentDir ? currentDir.depth : lastCandidate.depth;

    // Try finding candidate at the same depth
    for (let i = candidates.length - 1; i >= 0; i--) {
      if (candidates[i].depth === targetDepth) {
        return candidates[i].line;
      }
    }

    return lastCandidate.line;
  }

  /**
   * Moves editor cursor to the next directive in the preprocessor group.
   */
  public static async goToNextDirective(editor?: vscode.TextEditor): Promise<boolean> {
    const ed = editor ?? vscode.window.activeTextEditor;
    if (!ed) return false;

    const doc = ed.document;
    const lines = doc.getText().split(/\r?\n/);
    const currentLine = ed.selection.active.line;

    const nextLine = this.findNextDirective(lines, currentLine);
    if (nextLine !== null && nextLine !== currentLine) {
      const newPos = new vscode.Position(nextLine, 0);
      ed.selection = new vscode.Selection(newPos, newPos);
      ed.revealRange(new vscode.Range(newPos, newPos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
      return true;
    }

    vscode.window.showInformationMessage('NovaCpp: No subsequent preprocessor directive found.');
    return false;
  }

  /**
   * Moves editor cursor to the previous directive in the preprocessor group.
   */
  public static async goToPrevDirective(editor?: vscode.TextEditor): Promise<boolean> {
    const ed = editor ?? vscode.window.activeTextEditor;
    if (!ed) return false;

    const doc = ed.document;
    const lines = doc.getText().split(/\r?\n/);
    const currentLine = ed.selection.active.line;

    const prevLine = this.findPrevDirective(lines, currentLine);
    if (prevLine !== null && prevLine !== currentLine) {
      const newPos = new vscode.Position(prevLine, 0);
      ed.selection = new vscode.Selection(newPos, newPos);
      ed.revealRange(new vscode.Range(newPos, newPos), vscode.TextEditorRevealType.InCenterIfOutsideViewport);
      return true;
    }

    vscode.window.showInformationMessage('NovaCpp: No preceding preprocessor directive found.');
    return false;
  }
}
