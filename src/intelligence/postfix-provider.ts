import * as vscode from 'vscode';

/**
 * Interface representing a postfix completion template definition.
 */
export interface PostfixTemplate {
  trigger: string;
  label: string;
  description: string;
  detail: string;
  buildSnippet: (expr: string) => string;
}

/**
 * Built-in postfix templates for modern C++ (C++20 / C++23).
 */
export const POSTFIX_TEMPLATES: PostfixTemplate[] = [
  {
    trigger: 'if',
    label: '.if',
    description: 'if (expr) { ... }',
    detail: 'Postfix: Wrap expression in if condition',
    buildSnippet: (expr) => `if (${expr}) {\n\t$0\n}`
  },
  {
    trigger: 'ifn',
    label: '.ifn',
    description: 'if (!expr) { ... }',
    detail: 'Postfix: Wrap negated expression in if condition',
    buildSnippet: (expr) => `if (!(${expr})) {\n\t$0\n}`
  },
  {
    trigger: 'null',
    label: '.null',
    description: 'if (expr == nullptr) { ... }',
    detail: 'Postfix: Check expression for nullptr',
    buildSnippet: (expr) => `if (${expr} == nullptr) {\n\t$0\n}`
  },
  {
    trigger: 'notnull',
    label: '.notnull',
    description: 'if (expr != nullptr) { ... }',
    detail: 'Postfix: Check expression is not nullptr',
    buildSnippet: (expr) => `if (${expr} != nullptr) {\n\t$0\n}`
  },
  {
    trigger: 'for',
    label: '.for',
    description: 'for (const auto& item : expr) { ... }',
    detail: 'Postfix: Range-based for loop (const ref)',
    buildSnippet: (expr) => `for (const auto& \${1:item} : ${expr}) {\n\t$0\n}`
  },
  {
    trigger: 'iter',
    label: '.iter',
    description: 'for (const auto& item : expr) { ... }',
    detail: 'Postfix: Range-based for loop (const ref)',
    buildSnippet: (expr) => `for (const auto& \${1:item} : ${expr}) {\n\t$0\n}`
  },
  {
    trigger: 'forr',
    label: '.forr',
    description: 'for (auto& item : expr) { ... }',
    detail: 'Postfix: Range-based for loop (mutable ref)',
    buildSnippet: (expr) => `for (auto& \${1:item} : ${expr}) {\n\t$0\n}`
  },
  {
    trigger: 'mut',
    label: '.mut',
    description: 'for (auto& item : expr) { ... }',
    detail: 'Postfix: Range-based for loop (mutable ref)',
    buildSnippet: (expr) => `for (auto& \${1:item} : ${expr}) {\n\t$0\n}`
  },
  {
    trigger: 'fori',
    label: '.fori',
    description: 'for (std::size_t i = 0; i < expr.size(); ++i)',
    detail: 'Postfix: Indexed for loop',
    buildSnippet: (expr) =>
      `for (std::size_t \${1:i} = 0; \${1:i} < ${expr}.size(); ++\${1:i}) {\n\t$0\n}`
  },
  {
    trigger: 'var',
    label: '.var',
    description: 'auto val = expr;',
    detail: 'Postfix: Bind expression to auto variable',
    buildSnippet: (expr) => `auto \${1:val} = ${expr};`
  },
  {
    trigger: 'let',
    label: '.let',
    description: 'auto val = expr;',
    detail: 'Postfix: Bind expression to auto variable',
    buildSnippet: (expr) => `auto \${1:val} = ${expr};`
  },
  {
    trigger: 'return',
    label: '.return',
    description: 'return expr;',
    detail: 'Postfix: Return expression',
    buildSnippet: (expr) => `return ${expr};`
  },
  {
    trigger: 'move',
    label: '.move',
    description: 'std::move(expr)',
    detail: 'Postfix: Cast expression to rvalue reference',
    buildSnippet: (expr) => `std::move(${expr})`
  },
  {
    trigger: 'forward',
    label: '.forward',
    description: 'std::forward<decltype(expr)>(expr)',
    detail: 'Postfix: Perfectly forward expression',
    buildSnippet: (expr) => `std::forward<decltype(${expr})>(${expr})`
  },
  {
    trigger: 'unique',
    label: '.unique',
    description: 'std::make_unique<Type>(expr)',
    detail: 'Postfix: Construct std::unique_ptr',
    buildSnippet: (expr) => `std::make_unique<\${1:Type}>(${expr})`
  },
  {
    trigger: 'shared',
    label: '.shared',
    description: 'std::make_shared<Type>(expr)',
    detail: 'Postfix: Construct std::shared_ptr',
    buildSnippet: (expr) => `std::make_shared<\${1:Type}>(${expr})`
  },
  {
    trigger: 'span',
    label: '.span',
    description: 'std::span(expr)',
    detail: 'Postfix: Construct std::span view',
    buildSnippet: (expr) => `std::span(${expr})`
  },
  {
    trigger: 'log',
    label: '.log',
    description: 'std::cout << expr << std::endl;',
    detail: 'Postfix: Stream expression to std::cout',
    buildSnippet: (expr) => {
      const escaped = expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `std::cout << "${escaped}: " << ${expr} << std::endl;`;
    }
  },
  {
    trigger: 'dbg',
    label: '.dbg',
    description: 'std::cout << expr << std::endl;',
    detail: 'Postfix: Stream expression to std::cout',
    buildSnippet: (expr) => {
      const escaped = expr.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      return `std::cout << "${escaped}: " << ${expr} << std::endl;`;
    }
  },
  {
    trigger: 'format',
    label: '.format',
    description: 'std::format("{}", expr)',
    detail: 'Postfix: Format expression using C++20 std::format',
    buildSnippet: (expr) => `std::format("{}", ${expr})`
  },
  {
    trigger: 'cast',
    label: '.cast',
    description: 'static_cast<Type>(expr)',
    detail: 'Postfix: static_cast wrapper',
    buildSnippet: (expr) => `static_cast<\${1:Type}>(${expr})`
  }
];

/**
 * Scans backwards from a dot index on a single line of code to extract
 * the target expression, properly balancing parentheses, brackets, and string literals.
 */
export function extractExpressionBeforeDot(
  lineText: string,
  dotIndex: number
): { expr: string; startIndex: number } | null {
  if (dotIndex <= 0 || dotIndex > lineText.length) {
    return null;
  }

  let i = dotIndex - 1;

  // Skip any immediate whitespace between expression and dot (if any)
  while (i >= 0 && (lineText[i] === ' ' || lineText[i] === '\t')) {
    i--;
  }

  if (i < 0) {
    return null;
  }

  let parenDepth = 0;
  let bracketDepth = 0;
  let braceDepth = 0;
  let angleDepth = 0;
  let inString = false;
  let inChar = false;
  const endIndex = i + 1;

  while (i >= 0) {
    const ch = lineText[i];

    if (inString) {
      if (ch === '"' && (i === 0 || lineText[i - 1] !== '\\')) {
        inString = false;
      }
      i--;
      continue;
    }

    if (inChar) {
      if (ch === '\'' && (i === 0 || lineText[i - 1] !== '\\')) {
        inChar = false;
      }
      i--;
      continue;
    }

    if (ch === '"') {
      inString = true;
      i--;
      continue;
    }

    if (ch === '\'') {
      inChar = true;
      i--;
      continue;
    }

    if (ch === ')') {
      parenDepth++;
      i--;
      continue;
    }

    if (ch === '(') {
      if (parenDepth > 0) {
        parenDepth--;
        i--;
        continue;
      } else {
        // Enclosing paren boundary reached
        break;
      }
    }

    if (ch === ']') {
      bracketDepth++;
      i--;
      continue;
    }

    if (ch === '[') {
      if (bracketDepth > 0) {
        bracketDepth--;
        i--;
        continue;
      } else {
        // Enclosing bracket boundary reached
        break;
      }
    }

    if (ch === '}') {
      braceDepth++;
      i--;
      continue;
    }

    if (ch === '{') {
      if (braceDepth > 0) {
        braceDepth--;
        i--;
        continue;
      } else {
        // Enclosing brace boundary reached
        break;
      }
    }

    // Handle template angle brackets, distinguishing '->'
    if (ch === '>') {
      if (i > 0 && lineText[i - 1] === '-') {
        // Part of '->'
        i--;
        continue;
      }
      angleDepth++;
      i--;
      continue;
    }

    if (ch === '<') {
      if (angleDepth > 0) {
        angleDepth--;
        i--;
        continue;
      } else {
        // Enclosing angle bracket boundary reached
        break;
      }
    }

    // When outside any parentheses, brackets, braces, or angle brackets, statement boundaries terminate
    if (parenDepth === 0 && bracketDepth === 0 && braceDepth === 0 && angleDepth === 0) {
      // Allow member arrow '->'
      if (ch === '-' && i + 1 < lineText.length && lineText[i + 1] === '>') {
        i--;
        continue;
      }
      if (ch === '>' && i > 0 && lineText[i - 1] === '-') {
        i--;
        continue;
      }

      // Allow scope resolution '::'
      if (
        ch === ':' &&
        ((i + 1 < lineText.length && lineText[i + 1] === ':') ||
          (i > 0 && lineText[i - 1] === ':'))
      ) {
        i--;
        continue;
      }

      // Allow chained member access '.'
      if (ch === '.') {
        i--;
        continue;
      }

      if (
        ch === ';' ||
        ch === '{' ||
        ch === '}' ||
        ch === ',' ||
        ch === '=' ||
        ch === '+' ||
        ch === '-' ||
        ch === '*' ||
        ch === '/' ||
        ch === '%' ||
        ch === '&' ||
        ch === '|' ||
        ch === '^' ||
        ch === '!' ||
        ch === '?' ||
        ch === ':' ||
        ch === '<' ||
        ch === '>'
      ) {
        // Stop before operator boundary
        break;
      }

      if (ch === ' ' || ch === '\t') {
        // Stop before whitespace
        break;
      }
    }

    i--;
  }

  const startIndex = i + 1;
  const expr = lineText.substring(startIndex, endIndex).trim();

  if (!expr || expr.length === 0 || /^\d/.test(expr)) {
    return null;
  }

  return { expr, startIndex };
}

/**
 * NovaCpp Postfix Completion Provider.
 * Detects dot completions and produces snippets that transform expressions into control structures.
 */
export class PostfixCompletionProvider implements vscode.CompletionItemProvider {
  public static readonly triggerCharacters = ['.'];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Find position of dot before cursor
    const dotIndex = textBeforeCursor.lastIndexOf('.');
    if (dotIndex === -1) {
      return [];
    }

    // Validate that suffix between dot and cursor is strictly a valid identifier prefix
    const suffix = textBeforeCursor.substring(dotIndex + 1);
    if (!/^[a-zA-Z0-9_]*$/.test(suffix)) {
      return [];
    }

    // Guard against floating point numeric literals e.g. "3.14"
    if (dotIndex > 0 && /\d/.test(lineText[dotIndex - 1])) {
      // Check if preceding token is purely a number
      const beforeDot = lineText.substring(0, dotIndex).trim();
      if (/^\d+(\.\d+)?$/.test(beforeDot) || /(?:^|[\s+\-*/%=;,({[])\d+$/.test(beforeDot)) {
        return [];
      }
    }

    // Extract expression prior to the dot
    const extracted = extractExpressionBeforeDot(lineText, dotIndex);
    if (!extracted) {
      return [];
    }

    const { expr, startIndex } = extracted;
    const replacementRange = new vscode.Range(
      new vscode.Position(position.line, startIndex),
      position
    );

    const items: vscode.CompletionItem[] = [];

    for (const template of POSTFIX_TEMPLATES) {
      const item = new vscode.CompletionItem(template.label, vscode.CompletionItemKind.Snippet);
      item.detail = template.detail;
      item.documentation = new vscode.MarkdownString(
        `**NovaCpp Postfix Completion**\n\nTransforms \`${expr}\` into:\n\`\`\`cpp\n${template.description}\n\`\`\``
      );
      item.range = replacementRange;
      item.insertText = new vscode.SnippetString(template.buildSnippet(expr));
      item.filterText = '.' + template.trigger;
      // Use sort prefix to ensure postfix items appear neatly organized
      item.sortText = `zz_postfix_${template.trigger}`;

      items.push(item);
    }

    return items;
  }
}
