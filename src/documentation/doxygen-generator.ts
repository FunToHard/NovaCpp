import * as vscode from 'vscode';
import { splitParameters } from '../intelligence/hover-transformer';

export interface DoxygenItem {
  brief?: string;
  templateParams: string[];
  params: { name: string; type?: string }[];
  returnType?: string;
  isFunction: boolean;
  isClassOrStruct: boolean;
  name: string;
}

export type DoxygenStyle = '/**' | '/*!' | '///' | '//!';

export class DoxygenGenerator {
  /**
   * Extracts template parameter names from a template clause, e.g.
   * `template <typename T, class Container = std::vector<T>, int N = 0>` -> `['T', 'Container', 'N']`
   */
  public static extractTemplateParams(text: string): string[] {
    const templateIdx = text.indexOf('template');
    if (templateIdx === -1) return [];

    const openAngle = text.indexOf('<', templateIdx);
    if (openAngle === -1) return [];

    let depth = 0;
    let closeAngle = -1;
    for (let i = openAngle; i < text.length; i++) {
      if (text[i] === '<') {
        depth++;
      } else if (text[i] === '>') {
        depth--;
        if (depth === 0) {
          closeAngle = i;
          break;
        }
      }
    }

    if (closeAngle === -1) return [];

    const inside = text.substring(openAngle + 1, closeAngle);
    const parts = splitParameters(inside);
    const result: string[] = [];

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Extract parameter name before optional default value (e.g. typename T = int -> T)
      const withoutDefault = trimmed.split('=')[0].trim();
      const tokens = withoutDefault.split(/\s+/);
      let name = tokens[tokens.length - 1];

      // Strip variadic ellipsis, pointer/reference
      name = name.replace(/^[\*&.]+/, '').replace(/[\*&.]+$/, '').trim();
      if (name && !['typename', 'class', 'auto', 'int', 'size_t', 'bool'].includes(name)) {
        result.push(name);
      }
    }

    return result;
  }

  /**
   * Extracts parameter name from a parameter declaration like:
   * `const std::string& key` -> `key`
   * `int flags = 0` -> `flags`
   * `std::vector<int>* items` -> `items`
   */
  public static extractParamName(paramDecl: string): string | null {
    let cleaned = paramDecl.trim();
    if (!cleaned || cleaned === 'void') return null;

    // Strip default value
    const eqIdx = cleaned.indexOf('=');
    if (eqIdx !== -1) {
      cleaned = cleaned.substring(0, eqIdx).trim();
    }

    // Handle function pointer, e.g. void (*callback)(int)
    const fnPtrMatch = cleaned.match(/\(\s*\*\s*([a-zA-Z0-9_]+)\s*\)/);
    if (fnPtrMatch) {
      return fnPtrMatch[1];
    }

    // Split on whitespace or pointer/ref tokens
    const match = cleaned.match(/([a-zA-Z0-9_]+)\s*$/);
    if (match) {
      return match[1];
    }

    return null;
  }

  /**
   * Parses declaration code lines into structured Doxygen metadata.
   */
  public static parseDeclaration(text: string): DoxygenItem | null {
    const trimmed = text.trim();
    if (!trimmed) return null;

    const templateParams = this.extractTemplateParams(trimmed);

    // Check class or struct declaration
    const classMatch = trimmed.match(/\b(class|struct|enum\s+class|enum)\s+([a-zA-Z0-9_]+)/);
    const isClassOrStruct = Boolean(classMatch && !trimmed.includes('('));

    if (isClassOrStruct && classMatch) {
      return {
        brief: `${classMatch[2]} definition.`,
        templateParams,
        params: [],
        isFunction: false,
        isClassOrStruct: true,
        name: classMatch[2]
      };
    }

    // Check function or method declaration
    const openParen = trimmed.indexOf('(');
    const closeParen = trimmed.lastIndexOf(')');

    if (openParen !== -1 && closeParen > openParen) {
      const beforeParen = trimmed.substring(0, openParen).trim();
      const paramsContent = trimmed.substring(openParen + 1, closeParen).trim();

      // Find function name: last word token before '('
      const fnTokens = beforeParen.replace(/template\s*<[\s\S]*?>/g, '').trim().split(/\s+/);
      const fnName = fnTokens[fnTokens.length - 1]?.replace(/^[*&]+/, '') ?? 'function';

      // Determine return type (tokens before fnName, minus keywords)
      const rawRet = fnTokens.slice(0, fnTokens.length - 1).join(' ');
      const cleanRet = rawRet
        .replace(/\b(virtual|static|inline|constexpr|consteval|explicit|friend)\b/g, '')
        .trim();

      const returnType = cleanRet.length > 0 && cleanRet !== 'void' ? cleanRet : undefined;

      // Extract parameter names
      const rawParams = splitParameters(paramsContent);
      const params: { name: string; type?: string }[] = [];

      for (const p of rawParams) {
        const pName = this.extractParamName(p);
        if (pName) {
          params.push({ name: pName, type: p.trim() });
        }
      }

      return {
        brief: `Executes ${fnName}.`,
        templateParams,
        params,
        returnType,
        isFunction: true,
        isClassOrStruct: false,
        name: fnName
      };
    }

    return null;
  }

  /**
   * Generates a formatted Doxygen comment string or VS Code SnippetString.
   */
  public static generateComment(
    item: DoxygenItem,
    options: {
      style?: DoxygenStyle;
      asSnippet?: boolean;
      indent?: string;
    } = {}
  ): string {
    const style = options.style ?? '/**';
    const asSnippet = options.asSnippet ?? false;
    const indent = options.indent ?? '';
    const tagPrefix = (style === '/*!' || style === '//!') ? '\\' : '@';

    const lines: string[] = [];
    let tabStop = 1;

    const briefText = asSnippet ? `\${${tabStop++}:${item.brief ?? 'Description'}}` : (item.brief ?? '');

    if (style === '/**' || style === '/*!') {
      lines.push(`${indent}${style}`);
      lines.push(`${indent} * ${tagPrefix}brief ${briefText}`);
      lines.push(`${indent} *`);

      for (const tp of item.templateParams) {
        const desc = asSnippet ? `\${${tabStop++}:Template parameter}` : '';
        lines.push(`${indent} * ${tagPrefix}tparam ${tp} ${desc}`.trimEnd());
      }

      for (const p of item.params) {
        const desc = asSnippet ? `\${${tabStop++}:Parameter description}` : '';
        lines.push(`${indent} * ${tagPrefix}param ${p.name} ${desc}`.trimEnd());
      }

      if (item.returnType) {
        const desc = asSnippet ? `\${${tabStop++}:Description of return value}` : item.returnType;
        lines.push(`${indent} * ${tagPrefix}return ${desc}`.trimEnd());
      }

      lines.push(`${indent} */`);
    } else {
      // Single-line comment format (/// or //!)
      const prefix = style === '///' ? '///' : '//!';
      lines.push(`${indent}${prefix} ${tagPrefix}brief ${briefText}`);

      for (const tp of item.templateParams) {
        const desc = asSnippet ? `\${${tabStop++}:Template parameter}` : '';
        lines.push(`${indent}${prefix} ${tagPrefix}tparam ${tp} ${desc}`.trimEnd());
      }

      for (const p of item.params) {
        const desc = asSnippet ? `\${${tabStop++}:Parameter description}` : '';
        lines.push(`${indent}${prefix} ${tagPrefix}param ${p.name} ${desc}`.trimEnd());
      }

      if (item.returnType) {
        const desc = asSnippet ? `\${${tabStop++}:Description of return value}` : item.returnType;
        lines.push(`${indent}${prefix} ${tagPrefix}return ${desc}`.trimEnd());
      }
    }

    return lines.join('\n');
  }

  /**
   * Scans ahead in document from starting line to find the next C++ declaration.
   */
  public static findTargetDeclaration(
    document: vscode.TextDocument,
    startLine: number,
    maxLines: number = 8
  ): { lineIndex: number; text: string; indent: string } | null {
    let accumulated = '';
    let startIdx = -1;
    let indent = '';

    for (let i = startLine; i < Math.min(document.lineCount, startLine + maxLines); i++) {
      const rawLine = document.lineAt(i).text;
      const trimmed = rawLine.trim();

      if (!trimmed || trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        continue;
      }

      if (startIdx === -1) {
        startIdx = i;
        const matchIndent = rawLine.match(/^(\s*)/);
        indent = matchIndent ? matchIndent[1] : '';
      }

      accumulated += (accumulated ? ' ' : '') + trimmed;

      // If line ends with ';' or '{', or is a complete statement
      if (trimmed.endsWith(';') || trimmed.endsWith('{') || (trimmed.includes('(') && trimmed.includes(')'))) {
        return {
          lineIndex: startIdx,
          text: accumulated,
          indent
        };
      }
    }

    if (startIdx !== -1 && accumulated) {
      return { lineIndex: startIdx, text: accumulated, indent };
    }

    return null;
  }

  /**
   * Generates and inserts Doxygen comment into active text editor above the target declaration.
   */
  public static async generateForActiveEditor(): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return false;

    const document = editor.document;
    const lineIndex = editor.selection.active.line;
    const target = this.findTargetDeclaration(document, lineIndex, 6);
    if (!target) {
      vscode.window.showWarningMessage('NovaCpp: No declaration found near cursor to document.');
      return false;
    }

    const item = this.parseDeclaration(target.text);
    if (!item) {
      vscode.window.showWarningMessage('NovaCpp: Could not parse declaration for Doxygen comment.');
      return false;
    }

    const config = vscode.workspace.getConfiguration('novacpp');
    const style = config.get<DoxygenStyle>('doxygen.generatedStyle', '/**');
    const comment = this.generateComment(item, {
      style,
      asSnippet: false,
      indent: target.indent
    });

    await editor.edit((editBuilder) => {
      editBuilder.insert(new vscode.Position(target.lineIndex, 0), comment + '\n');
    });

    return true;
  }
}

/**
 * On-type Doxygen Completion Provider for `/**` or `///`.
 */
export class DoxygenCompletionProvider implements vscode.CompletionItemProvider {
  public static readonly triggerCharacters = ['*'];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const config = vscode.workspace.getConfiguration('novacpp');
    if (!config.get<boolean>('doxygen.generateOnType', true)) {
      return [];
    }

    const lineText = document.lineAt(position.line).text.substring(0, position.character);
    if (!lineText.trim().endsWith('/**')) {
      return [];
    }

    const target = DoxygenGenerator.findTargetDeclaration(document, position.line + 1);
    if (!target) return [];

    const item = DoxygenGenerator.parseDeclaration(target.text);
    if (!item) return [];

    const style = config.get<DoxygenStyle>('doxygen.generatedStyle', '/**');
    const indent = target.indent;
    const commentBody = DoxygenGenerator.generateComment(item, {
      style,
      asSnippet: true,
      indent
    });

    // Strip leading `/**` because the user already typed it
    const trimmedSnippet = commentBody.replace(new RegExp(`^${indent}/\\*\\*\\r?\\n`), '');

    const completion = new vscode.CompletionItem(
      '/** NovaCpp: Generate Doxygen Documentation */',
      vscode.CompletionItemKind.Snippet
    );
    completion.insertText = new vscode.SnippetString(`\n${trimmedSnippet}`);
    completion.detail = `Generate Doxygen for ${item.name}`;
    completion.documentation = new vscode.MarkdownString(
      `Generates structured Doxygen template for \`${item.name}\` with parameter stubs.`
    );

    return [completion];
  }
}
