import * as vscode from 'vscode';

export interface MacroDef {
  name: string;
  params?: string[]; // undefined for object-like macros, string[] for function-like macros
  body: string;
  isFunctionLike: boolean;
}

export interface MacroExpansionStep {
  step: number;
  description: string;
  result: string;
}

export interface MacroExpansionResult {
  original: string;
  finalExpansion: string;
  steps: MacroExpansionStep[];
  isExpanded: boolean;
}

/**
 * Extracts all #define macro directives in the provided source text.
 */
export function extractMacroDefinitions(sourceText: string): Map<string, MacroDef> {
  const macros = new Map<string, MacroDef>();
  const lines = sourceText.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line.startsWith('#')) continue;

    // Handle multiline continuation lines with trailing backslash
    let fullLine = line;
    while (fullLine.endsWith('\\') && i + 1 < lines.length) {
      i++;
      fullLine = fullLine.slice(0, -1).trim() + ' ' + lines[i].trim();
    }

    // Match #define NAME(params) body or #define NAME body
    const match = fullLine.match(/^#\s*define\s+([a-zA-Z_]\w*)(?:\(([^\)]*)\))?(?:\s+(.*))?$/);
    if (match) {
      const name = match[1];
      const hasParams = match[2] !== undefined;
      const params = hasParams
        ? match[2].split(',').map((p) => p.trim()).filter((p) => p.length > 0)
        : undefined;
      const body = (match[3] || '').trim();

      macros.set(name, {
        name,
        params,
        body,
        isFunctionLike: hasParams
      });
    }
  }

  return macros;
}

/**
 * Expands a single function-like macro with given arguments.
 */
function substituteMacroParams(def: MacroDef, args: string[]): string {
  if (!def.isFunctionLike || !def.params) {
    return def.body;
  }

  let result = def.body;

  // 1. Handle stringification #param (not preceded by another #)
  for (let i = 0; i < def.params.length; i++) {
    const param = def.params[i];
    const arg = args[i] !== undefined ? args[i].trim() : '';
    const stringifyRegex = new RegExp(`(?<!#)#[\\t ]*\\b${param}\\b`, 'g');
    result = result.replace(stringifyRegex, `"${arg.replace(/"/g, '\\"')}"`);
  }

  // 2. Handle standard parameter substitution (preserving ## intact)
  for (let i = 0; i < def.params.length; i++) {
    const param = def.params[i];
    const arg = args[i] !== undefined ? args[i].trim() : '';
    const paramRegex = new RegExp(`\\b${param}\\b`, 'g');
    result = result.replace(paramRegex, arg);
  }

  // 3. Concatenate tokens across ## (deleting ## and surrounding whitespace)
  result = result.replace(/[\\t ]*##[\\t ]*/g, '').replace(/\s+/g, ' ').trim();
  return result;
}

/**
 * Splits comma-separated macro arguments while respecting nested parentheses and string literals.
 */
export function splitMacroArguments(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let depth = 0;
  let inQuote = false;
  let quoteChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const c = argsStr[i];
    if (inQuote) {
      current += c;
      if (c === quoteChar && argsStr[i - 1] !== '\\') {
        inQuote = false;
      }
    } else if (c === '"' || c === "'") {
      inQuote = true;
      quoteChar = c;
      current += c;
    } else if (c === '(') {
      depth++;
      current += c;
    } else if (c === ')') {
      depth--;
      current += c;
    } else if (c === ',' && depth === 0) {
      args.push(current.trim());
      current = '';
    } else {
      current += c;
    }
  }

  if (current.trim().length > 0 || args.length > 0) {
    args.push(current.trim());
  }

  return args;
}

/**
 * Finds a function-like macro call in text while properly balancing nested parentheses.
 */
function findBalancedFunctionCall(text: string): { match: string; name: string; argsStr: string } | null {
  const regex = /\b([a-zA-Z_]\w*)\s*\(/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    const name = m[1];
    const openIndex = m.index + m[0].length - 1;
    let depth = 1;
    let inQuote = false;
    let quoteChar = '';
    let closeIndex = -1;

    for (let i = openIndex + 1; i < text.length; i++) {
      const c = text[i];
      if (inQuote) {
        if (c === quoteChar && text[i - 1] !== '\\') inQuote = false;
      } else if (c === '"' || c === "'") {
        inQuote = true;
        quoteChar = c;
      } else if (c === '(') {
        depth++;
      } else if (c === ')') {
        depth--;
        if (depth === 0) {
          closeIndex = i;
          break;
        }
      }
    }

    if (closeIndex !== -1) {
      const argsStr = text.substring(openIndex + 1, closeIndex);
      const match = text.substring(m.index, closeIndex + 1);
      return { match, name, argsStr };
    }
  }
  return null;
}

/**
 * Step-by-step recursive macro expansion engine.
 */
export function expandMacroRecursively(
  invocation: string,
  defines: Map<string, MacroDef>,
  maxSteps: number = 10
): MacroExpansionResult {
  const steps: MacroExpansionStep[] = [];
  let current = invocation.trim();
  steps.push({
    step: 0,
    description: 'Initial token / invocation',
    result: current
  });

  let stepCount = 0;
  let changed = true;

  while (changed && stepCount < maxSteps) {
    changed = false;
    stepCount++;

    // 1. Try matching function-like macro calls: NAME(...)
    const fnCall = findBalancedFunctionCall(current);
    if (fnCall) {
      const { name, argsStr, match } = fnCall;
      const def = defines.get(name);

      if (def && def.isFunctionLike) {
        const args = splitMacroArguments(argsStr);
        const expanded = substituteMacroParams(def, args);
        current = current.replace(match, expanded);
        steps.push({
          step: stepCount,
          description: `Expand function-like macro ${name}(${args.join(', ')})`,
          result: current
        });
        changed = true;
        continue;
      }
    }

    // 2. Try matching object-like macros
    for (const [name, def] of defines.entries()) {
      if (!def.isFunctionLike) {
        const objRegex = new RegExp(`\\b${name}\\b`, 'g');
        if (objRegex.test(current)) {
          current = current.replace(objRegex, def.body);
          steps.push({
            step: stepCount,
            description: `Expand object-like macro ${name} -> ${def.body}`,
            result: current
          });
          changed = true;
          break;
        }
      }
    }
  }

  return {
    original: invocation,
    finalExpansion: current,
    steps,
    isExpanded: steps.length > 1
  };
}

/**
 * Evaluates constant compile-time arithmetic, bitwise expressions and sizes.
 */
export function evaluateConstexprExpression(
  expression: string
): { success: boolean; value?: number | bigint; type?: string; error?: string } {
  let clean = expression.trim();
  if (clean.endsWith(';')) clean = clean.slice(0, -1).trim();

  // Strip constexpr specifier and variable declaration if present: constexpr auto x = ...
  const declMatch = clean.match(/(?:constexpr|consteval)\s+(?:[\w:*&<>]+\s+)*[a-zA-Z_]\w*\s*=\s*(.+)$/);
  if (declMatch) {
    clean = declMatch[1].trim();
  }

  // Handle standard C++ integer suffixes (u, l, ll, ull)
  clean = clean.replace(/(\d+)ULL\b/gi, '$1n');
  clean = clean.replace(/(\d+)LL\b/gi, '$1n');
  clean = clean.replace(/(\d+)[UL]+\b/gi, '$1');

  // Handle C++ hex literals: 0x...
  // Handle binary literals: 0b...
  // Handle bitwise operators: <<, >>, |, &, ^, ~
  try {
    // Only allow safe mathematical and bitwise expressions (prevent arbitrary code execution)
    if (!/^[0-9a-fA-FxXbBn\s+\-*\/%()<>|&^~!]+$/.test(clean)) {
      return {
        success: false,
        error: 'Expression contains non-constant or unsupported tokens'
      };
    }

    // Evaluate using Function with strict math sandbox
    const evalFn = new Function(`return (${clean});`);
    const val = evalFn();

    if (typeof val === 'number' || typeof val === 'bigint') {
      return {
        success: true,
        value: val,
        type: typeof val === 'bigint' ? 'int64_t' : Number.isInteger(val) ? 'int' : 'double'
      };
    }

    return {
      success: false,
      error: 'Expression did not evaluate to a numeric constant'
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? 'Syntax error in constant expression'
    };
  }
}

/**
 * Controller for Macro Expansion and Constexpr Evaluation commands.
 */
export class MacroEvaluatorManager implements vscode.Disposable {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('NovaCpp: Macro & Constexpr');
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  public expandMacroAtCursor(editor?: vscode.TextEditor): MacroExpansionResult | null {
    const active = editor || vscode.window.activeTextEditor;
    if (!active) {
      vscode.window.showWarningMessage('NovaCpp: No active C/C++ editor.');
      return null;
    }

    const doc = active.document;
    const text = doc.getText();
    const sel = active.selection;
    let targetToken = doc.getText(sel).trim();

    if (!targetToken) {
      const range = doc.getWordRangeAtPosition(sel.active);
      if (range) {
        targetToken = doc.getText(range);
      }
    }

    if (!targetToken) {
      vscode.window.showInformationMessage('NovaCpp: Place cursor on a macro identifier to expand.');
      return null;
    }

    const macros = extractMacroDefinitions(text);
    const result = expandMacroRecursively(targetToken, macros);

    this.outputChannel.clear();
    this.outputChannel.appendLine(`=======================================================`);
    this.outputChannel.appendLine(`NovaCpp: Macro Expansion Inspector`);
    this.outputChannel.appendLine(`Target: ${result.original}`);
    this.outputChannel.appendLine(`=======================================================`);

    for (const step of result.steps) {
      this.outputChannel.appendLine(`\n[Step ${step.step}]: ${step.description}`);
      this.outputChannel.appendLine(`  --> ${step.result}`);
    }

    this.outputChannel.appendLine(`\nFinal Expanded C++ Code:`);
    this.outputChannel.appendLine(`  ${result.finalExpansion}`);
    this.outputChannel.show(true);

    return result;
  }

  public evaluateConstexprAtCursor(editor?: vscode.TextEditor): void {
    const active = editor || vscode.window.activeTextEditor;
    if (!active) return;

    const doc = active.document;
    const sel = active.selection;
    let target = doc.getText(sel).trim();

    if (!target) {
      const line = doc.lineAt(sel.active.line).text;
      target = line;
    }

    const result = evaluateConstexprExpression(target);
    if (result.success && result.value !== undefined) {
      const hex = typeof result.value === 'number' ? ` (0x${result.value.toString(16).toUpperCase()})` : '';
      vscode.window.showInformationMessage(
        `NovaCpp: constexpr value = ${result.value}${hex} [${result.type}]`
      );
    } else {
      vscode.window.showWarningMessage(`NovaCpp: Could not evaluate constexpr: ${result.error}`);
    }
  }
}
