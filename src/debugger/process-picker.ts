import * as vscode from 'vscode';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

export interface ProcessInfo {
  pid: number;
  name: string;
  cmdline?: string;
}

export class ProcessPicker {
  /**
   * Retrieves the list of currently running processes on the system.
   */
  public static async getRunningProcesses(): Promise<ProcessInfo[]> {
    const processes: ProcessInfo[] = [];

    if (process.platform === 'win32') {
      try {
        const { stdout } = await execFileAsync('tasklist.exe', ['/FO', 'CSV', '/NH'], {
          windowsHide: true
        });
        const lines = stdout.split(/\r?\n/);
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          // Format: "chrome.exe","1234","Console","1","12,345 K"
          const parts = trimmed.split('","').map((p) => p.replace(/^"|"$/g, ''));
          if (parts.length >= 2) {
            const name = parts[0];
            const pid = parseInt(parts[1], 10);
            if (!isNaN(pid) && pid > 0) {
              processes.push({ pid, name });
            }
          }
        }
      } catch (err) {
        console.warn('NovaCpp: tasklist.exe failed:', err);
      }
    } else {
      // Linux & macOS
      try {
        const { stdout } = await execFileAsync('ps', ['-eo', 'pid,comm'], {
          maxBuffer: 5 * 1024 * 1024
        });
        const lines = stdout.split(/\r?\n/);
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].trim().split(/\s+/);
          if (parts.length >= 2) {
            const pid = parseInt(parts[0], 10);
            const name = parts.slice(1).join(' ');
            if (!isNaN(pid) && pid > 0) {
              processes.push({ pid, name });
            }
          }
        }
      } catch (err) {
        console.warn('NovaCpp: ps command failed:', err);
      }
    }

    // Sort by name
    return processes.sort((a, b) => a.name.localeCompare(b.name));
  }

  /**
   * Shows an interactive QuickPick allowing the user to select a process to attach to.
   * Returns the PID string.
   */
  public static async pickProcess(): Promise<string | undefined> {
    const processes = await this.getRunningProcesses();
    if (processes.length === 0) {
      vscode.window.showWarningMessage('NovaCpp: No running native processes detected.');
      return undefined;
    }

    const items = processes.map((p) => ({
      label: `$(symbol-event) ${p.name}`,
      description: `PID: ${p.pid}`,
      pid: String(p.pid)
    }));

    const picked = await vscode.window.showQuickPick(items, {
      placeHolder: 'Select a process to attach the debugger'
    });

    return picked?.pid;
  }
}

/**
 * Extracts continuous C++ expression around a given column (e.g. obj.member, ptr->val, arr[i], ns::var).
 */
export function extractExpressionAtColumn(
  line: string,
  col: number
): { start: number; end: number; text: string } | null {
  if (col < 0 || col >= line.length) return null;

  // Whitespace guard: cursor directly on whitespace should not evaluate adjacent tokens
  if (/\s/.test(line[col])) return null;

  // If cursor is on '>' in '->' or second ':' in '::', adjust seed to operator start
  let seedCol = col;
  if (line[col] === '>' && col > 0 && line[col - 1] === '-') {
    seedCol = col - 1;
  } else if (line[col] === ':' && col > 0 && line[col - 1] === ':') {
    seedCol = col - 1;
  }

  // Find start boundary
  let start = seedCol;
  while (start > 0) {
    const prevChar = line[start - 1];
    if (/[a-zA-Z0-9_]/.test(prevChar)) {
      start--;
    } else if (prevChar === '.') {
      start--;
    } else if (start >= 2 && line.substring(start - 2, start) === '->') {
      start -= 2;
    } else if (start >= 2 && line.substring(start - 2, start) === '::') {
      start -= 2;
    } else if (prevChar === ']') {
      // Backtrack matching opening bracket '['
      let bracketDepth = 1;
      let bIdx = start - 2;
      while (bIdx >= 0 && bracketDepth > 0) {
        if (line[bIdx] === ']') bracketDepth++;
        else if (line[bIdx] === '[') bracketDepth--;
        bIdx--;
      }
      if (bracketDepth === 0) {
        start = bIdx + 1;
      } else {
        break;
      }
    } else if (prevChar === ')') {
      // Backtrack matching opening paren '(' for (*ptr).field
      let parenDepth = 1;
      let pIdx = start - 2;
      while (pIdx >= 0 && parenDepth > 0) {
        if (line[pIdx] === ')') parenDepth++;
        else if (line[pIdx] === '(') parenDepth--;
        pIdx--;
      }
      if (parenDepth === 0) {
        start = pIdx + 1;
      } else {
        break;
      }
    } else if (prevChar === '>' && start >= 2 && line[start - 2] !== '-') {
      // Backtrack matching opening template angle bracket '<'
      let angleDepth = 1;
      let aIdx = start - 2;
      while (aIdx >= 0 && angleDepth > 0) {
        if (line[aIdx] === '>') angleDepth++;
        else if (line[aIdx] === '<') angleDepth--;
        aIdx--;
      }
      if (angleDepth === 0) {
        start = aIdx + 1;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  // Check for unary leading '*' or '&' (e.g. *ptr, &var)
  if (start > 0 && (line[start - 1] === '*' || line[start - 1] === '&')) {
    const beforeOp = start >= 2 ? line[start - 2] : ' ';
    if (/[\s(,=;+\-*/%]/.test(beforeOp)) {
      start--;
    }
  }

  // Find end boundary
  let end = seedCol;
  while (end < line.length) {
    const ch = line[end];
    if (/[a-zA-Z0-9_]/.test(ch)) {
      end++;
    } else if (ch === '.') {
      end++;
    } else if (line.startsWith('->', end)) {
      end += 2;
    } else if (line.startsWith('::', end)) {
      end += 2;
    } else if (ch === '[') {
      // Fast forward matching closing bracket ']'
      let bracketDepth = 1;
      let bIdx = end + 1;
      while (bIdx < line.length && bracketDepth > 0) {
        if (line[bIdx] === '[') bracketDepth++;
        else if (line[bIdx] === ']') bracketDepth--;
        bIdx++;
      }
      if (bracketDepth === 0) {
        end = bIdx;
      } else {
        break;
      }
    } else if (ch === '<' && (end === 0 || !/[\s(,=;+\-*/%]/.test(line[end - 1]))) {
      // Fast forward matching closing angle bracket '>' for template args
      let angleDepth = 1;
      let aIdx = end + 1;
      while (aIdx < line.length && angleDepth > 0) {
        if (line[aIdx] === '<') angleDepth++;
        else if (line[aIdx] === '>') angleDepth--;
        aIdx++;
      }
      if (angleDepth === 0) {
        end = aIdx;
      } else {
        break;
      }
    } else {
      break;
    }
  }

  const text = line.substring(start, end).trim();
  if (!text) return null;

  return { start, end, text };
}

/**
 * C++ Evaluatable Expression Provider for VS Code Debugger.
 */
export class CppEvaluatableExpressionProvider implements vscode.EvaluatableExpressionProvider {
  provideEvaluatableExpression(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.EvaluatableExpression> {
    const line = document.lineAt(position.line).text;
    const expr = extractExpressionAtColumn(line, position.character);
    if (!expr) return undefined;

    return new (vscode as any).EvaluatableExpression(
      new vscode.Range(position.line, expr.start, position.line, expr.end),
      expr.text
    );
  }
}
