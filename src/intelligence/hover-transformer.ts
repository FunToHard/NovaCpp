import * as vscode from 'vscode';

export interface ParameterInfo {
  name: string;
  type: string;
  semantics: string;
  description?: string;
}

export interface ParsedFunctionSignature {
  isFunction: boolean;
  name: string;
  returnType: string;
  templateClause?: string;
  requiresClause?: string;
  parameters: ParameterInfo[];
  badges: string[];
}

/**
 * Analyzes C++ type strings to deduce memory and value transfer semantics.
 */
export function inferParameterSemantics(paramType: string): string {
  const trimmed = paramType.trim();

  if (trimmed.includes('unique_ptr')) {
    return 'Exclusive Ownership (Heap)';
  }
  if (trimmed.includes('shared_ptr')) {
    return 'Shared Ownership (Refcounted)';
  }
  if (trimmed.includes('string_view') || trimmed.includes('span')) {
    return 'Non-Owning View (Zero-Copy)';
  }
  if (trimmed.startsWith('const ') && trimmed.endsWith('&')) {
    return 'Read-Only (Const Ref)';
  }
  if (trimmed.endsWith('&&')) {
    return 'Move / Sink (Rvalue Ref)';
  }
  if (trimmed.endsWith('&')) {
    return 'Mutable (In-Out Ref)';
  }
  if (trimmed.startsWith('const ') && trimmed.endsWith('*')) {
    return 'Read-Only (Const Ptr)';
  }
  if (trimmed.endsWith('*')) {
    return 'Pointer (Nullable / In-Out)';
  }

  const primitives = [
    'int',
    'float',
    'double',
    'char',
    'bool',
    'size_t',
    'uint32_t',
    'int32_t',
    'uint64_t',
    'int64_t',
    'short',
    'long'
  ];
  if (primitives.includes(trimmed)) {
    return 'By-Value (Primitive Copy)';
  }

  return 'By-Value (Copy)';
}

/**
 * Parses raw C++ function signatures extracted from Clangd hover blocks.
 */
export function parseSignature(code: string): ParsedFunctionSignature | null {
  const normalized = code.replace(/\r\n/g, '\n').trim();

  // Check if it represents a function or method
  if (!normalized.includes('(') || !normalized.includes(')')) {
    return null;
  }

  const badges: string[] = [];

  if (normalized.includes('noexcept')) {
    badges.push('noexcept');
  }
  if (normalized.includes('[[nodiscard]]')) {
    badges.push('[[nodiscard]]');
  }
  if (normalized.includes('constexpr')) {
    badges.push('constexpr');
  }
  if (normalized.includes('consteval')) {
    badges.push('consteval');
  }
  if (normalized.includes('explicit')) {
    badges.push('explicit');
  }
  if (normalized.includes('override')) {
    badges.push('override');
  }
  if (normalized.includes('= 0')) {
    badges.push('pure virtual');
  } else if (normalized.includes('virtual')) {
    badges.push('virtual');
  }
  if (
    normalized.includes('std::') ||
    normalized.includes('__gnu_cxx') ||
    /\b(printf|malloc|free|memcpy|memset|fopen|fclose)\b/.test(normalized)
  ) {
    badges.push('Standard Library');
  }

  // Extract template clause
  let templateClause: string | undefined;
  const templateMatch = normalized.match(/template\s*<([^>]+)>/);
  if (templateMatch) {
    templateClause = templateMatch[1].trim();
  }

  // Extract requires clause
  let requiresClause: string | undefined;
  const requiresMatch = normalized.match(/requires\s+([^\n(]+)(?:\n|\()/);
  if (requiresMatch) {
    requiresClause = requiresMatch[1].trim();
  }

  // Extract parameter block between outermost matching parentheses
  const firstParen = normalized.indexOf('(');
  const lastParen = normalized.lastIndexOf(')');
  if (firstParen === -1 || lastParen === -1 || lastParen <= firstParen) {
    return null;
  }

  const beforeParen = normalized.substring(0, firstParen).trim();
  const parenContent = normalized.substring(firstParen + 1, lastParen).trim();
  const afterParen = normalized.substring(lastParen + 1).trim();

  // Parse function name and return type
  // Check for trailing return type (auto func() -> Type)
  let returnType = 'void';
  let funcName = beforeParen;

  const trailingArrowMatch = afterParen.match(/->\s*([a-zA-Z0-9_:<>*& ]+)/);
  if (trailingArrowMatch) {
    returnType = trailingArrowMatch[1].trim();
  }

  const nameParts = beforeParen.split(/\s+/);
  if (nameParts.length > 0) {
    funcName = nameParts[nameParts.length - 1];
    if (funcName.startsWith('*') || funcName.startsWith('&')) {
      funcName = funcName.substring(1);
    }
    if (!trailingArrowMatch && nameParts.length > 1) {
      // Return type precedes function name
      const retTokens = nameParts.slice(0, nameParts.length - 1);
      returnType = retTokens
        .filter((t) => !['virtual', 'explicit', 'inline', 'constexpr', 'consteval'].includes(t))
        .join(' ');
    }
  }

  // Clean template annotations from funcName if any
  funcName = funcName.replace(/<.*>$/, '');

  // Parse parameter list
  const parameters: ParameterInfo[] = [];
  if (parenContent.length > 0) {
    const rawParams = splitParameters(parenContent);
    for (const raw of rawParams) {
      const trimmedParam = raw.trim();
      if (!trimmedParam || trimmedParam === 'void') continue;

      // Extract parameter name (last word or default assignment)
      let paramName = '';
      let paramType = trimmedParam;

      // Handle default values: int x = 10
      const eqIdx = trimmedParam.indexOf('=');
      if (eqIdx !== -1) {
        paramType = trimmedParam.substring(0, eqIdx).trim();
      }

      const pTokens = paramType.split(/\s+/);
      if (pTokens.length > 1) {
        paramName = pTokens[pTokens.length - 1];
        if (paramName.startsWith('*') || paramName.startsWith('&')) {
          paramName = paramName.replace(/^[*&]+/, '');
        }
        paramType = paramType.substring(0, paramType.lastIndexOf(paramName)).trim();
      } else {
        paramName = `arg${parameters.length + 1}`;
      }

      parameters.push({
        name: paramName,
        type: paramType,
        semantics: inferParameterSemantics(paramType)
      });
    }
  }

  return {
    isFunction: true,
    name: funcName,
    returnType: returnType || 'auto',
    templateClause,
    requiresClause,
    parameters,
    badges
  };
}

/**
 * Splits parameter string by comma, respecting template angle brackets.
 */
function splitParameters(content: string): string[] {
  const result: string[] = [];
  let depth = 0;
  let current = '';

  for (let i = 0; i < content.length; i++) {
    const ch = content[i];
    if (ch === '<' || ch === '(' || ch === '{') {
      depth++;
    } else if (ch === '>' || ch === ')' || ch === '}') {
      depth--;
    } else if (ch === ',' && depth === 0) {
      result.push(current.trim());
      current = '';
      continue;
    }
    current += ch;
  }
  if (current.trim().length > 0) {
    result.push(current.trim());
  }
  return result;
}

/**
 * Parses Doxygen documentation comments into structured metadata.
 */
export function parseDoxygen(text: string): {
  brief: string;
  params: Map<string, string>;
  returns?: string;
} {
  const params = new Map<string, string>();
  let brief = '';
  let returns: string | undefined;

  const lines = text.split('\n');
  for (const rawLine of lines) {
    const line = rawLine.replace(/^[/ *#]+/, '').trim();
    if (!line) continue;

    const paramMatch = line.match(/^@param(?:\s*\[[^\]]+\])?\s+([a-zA-Z0-9_]+)\s+(.+)/);
    if (paramMatch) {
      params.set(paramMatch[1], paramMatch[2].trim());
      continue;
    }

    const returnMatch = line.match(/^@return\s+(.+)/);
    if (returnMatch) {
      returns = returnMatch[1].trim();
      continue;
    }

    const briefMatch = line.match(/^@brief\s+(.+)/);
    if (briefMatch) {
      brief = briefMatch[1].trim();
      continue;
    }

    if (!brief && !line.startsWith('@')) {
      brief = line;
    }
  }

  return { brief, params, returns };
}

/**
 * Transforms standard Clangd hovers into rich, rust-analyzer style developer cards.
 */
export class HoverTransformer {
  /**
   * Transforms an incoming vscode.Hover from clangd into an enriched hover.
   */
  public static transform(hover: vscode.Hover): vscode.Hover {
    if (!hover || !hover.contents || hover.contents.length === 0) {
      return hover;
    }

    let codeBlock = '';
    let docText = '';

    for (const part of hover.contents) {
      const str = typeof part === 'string' ? part : (part as vscode.MarkdownString).value;
      if (str.includes('```cpp') || str.includes('```c')) {
        const match = str.match(/```(?:cpp|c)\n([\s\S]*?)\n```/);
        if (match) {
          codeBlock = match[1];
        } else {
          codeBlock = str;
        }
      } else if (str.trim().length > 0) {
        docText += (docText ? '\n\n' : '') + str.trim();
      }
    }

    if (!codeBlock) {
      return hover;
    }

    const sig = parseSignature(codeBlock);
    if (!sig) {
      // If not a function signature (e.g. struct/class definition or variable), format cleanly
      const isStructOrClass =
        codeBlock.includes('class ') || codeBlock.includes('struct ') || codeBlock.includes('union ');
      if (isStructOrClass) {
        const md = new vscode.MarkdownString();
        md.isTrusted = true;
        md.appendMarkdown(`### \`${codeBlock.split('{')[0].trim()}\` *(Type Definition)*\n\n`);
        md.appendCodeblock(codeBlock, 'cpp');
        if (docText) {
          md.appendMarkdown(`\n${docText}\n`);
        }
        md.appendMarkdown('\n---\n');
        md.appendMarkdown(
          '[Find References](command:editor.action.findReferences) | [Switch Header/Source](command:novacpp.switchSourceHeader)'
        );
        return new vscode.Hover(md, hover.range);
      }
      return hover;
    }

    const doxygen = parseDoxygen(docText);

    // Attach descriptions to parameters
    for (const param of sig.parameters) {
      if (doxygen.params.has(param.name)) {
        param.description = doxygen.params.get(param.name);
      }
    }

    // Build rich Markdown card
    const md = new vscode.MarkdownString();
    md.isTrusted = true;

    md.appendMarkdown(`### \`${sig.name}\` *(function)*\n\n`);
    md.appendCodeblock(codeBlock, 'cpp');

    // Badges line
    if (sig.badges.length > 0) {
      const badgeList = sig.badges.map((b) => `\`[${b}]\``).join(' ');
      md.appendMarkdown(`**Specifiers**: ${badgeList}\n\n`);
    }

    // Brief description
    if (doxygen.brief) {
      md.appendMarkdown(`${doxygen.brief}\n\n`);
    }

    // Constraints and concepts
    if (sig.requiresClause || sig.templateClause) {
      md.appendMarkdown('#### Constraints & Concepts\n');
      if (sig.templateClause) {
        md.appendMarkdown(`- Template: \`<${sig.templateClause}>\`\n`);
      }
      if (sig.requiresClause) {
        md.appendMarkdown(`- Requires: \`${sig.requiresClause}\`\n`);
      }
      md.appendMarkdown('\n');
    }

    // Parameters table
    if (sig.parameters.length > 0) {
      md.appendMarkdown('#### Parameters\n\n');
      md.appendMarkdown('| Parameter | Type | Semantics | Description |\n');
      md.appendMarkdown('| :--- | :--- | :--- | :--- |\n');
      for (const p of sig.parameters) {
        const desc = p.description ? p.description : '-';
        md.appendMarkdown(`| \`${p.name}\` | \`${p.type}\` | ${p.semantics} | ${desc} |\n`);
      }
      md.appendMarkdown('\n');
    }

    // Returns section
    const retDoc = doxygen.returns ? ` - ${doxygen.returns}` : '';
    md.appendMarkdown(`**Returns**: \`${sig.returnType}\`${retDoc}\n\n`);

    // Interactive Action Links
    md.appendMarkdown('---\n');
    md.appendMarkdown(
      '[Switch Header/Source](command:novacpp.switchSourceHeader) | [Find References](command:editor.action.findReferences) | [Open Docs (cppreference)](command:novacpp.openDocs)'
    );

    return new vscode.Hover([md], hover.range);
  }
}
