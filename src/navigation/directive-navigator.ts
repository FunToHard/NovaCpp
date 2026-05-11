import * as vscode from 'vscode';

export interface PreprocessorDirective {
  line: number;
  type: 'if' | 'elif' | 'else' | 'endif';
  depth: number;
  text: string;
}

export class DirectiveNavigator {
  /**
   * Scans a document or line array to extract preprocessor directives with nesting depth.
   */
  public static extractDirectives(lines: string[]): PreprocessorDirective[] {
    const directives: PreprocessorDirective[] = [];
    let depth = 0;

    for (let i = 0; i < lines.length; i++) {
      const lineText = lines[i].trim();
      const match = lineText.match(/^#\s*(if|ifdef|ifndef|elif|elifdef|elifndef|else|endif)\b/);
      if (!match) continue;

      const keyword = match[1];

      if (keyword === 'if' || keyword === 'ifdef' || keyword === 'ifndef') {
        depth++;
        directives.push({
          line: i,
          type: 'if',
          depth,
          text: lineText
        });
      } else if (keyword.startsWith('elif')) {
        directives.push({
          line: i,
          type: 'elif',
          depth,
          text: lineText
        });
      } else if (keyword === 'else') {
        directives.push({
          line: i,
          type: 'else',
          depth,
          text: lineText
        });
      } else if (keyword === 'endif') {
        directives.push({
          line: i,
          type: 'endif',
          depth,
          text: lineText
        });
        if (depth > 0) depth--;
      }
    }

    return directives;
  }

  /**
   * Finds the line number of the next directive in the active preprocessor group.
   */
  public static findNextDirective(lines: string[], currentLine: number): number | null {
    const directives = this.extractDirectives(lines);
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
  public static findPrevDirective(lines: string[], currentLine: number): number | null {
    const directives = this.extractDirectives(lines);
    if (directives.length === 0) return null;

    // Find directives strictly before currentLine
    const candidates = directives.filter((d) => d.line < currentLine);
    if (candidates.length === 0) return null;

    // Find the last candidate
    const lastCandidate = candidates[candidates.length - 1];
    const targetDepth = lastCandidate.depth;

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
