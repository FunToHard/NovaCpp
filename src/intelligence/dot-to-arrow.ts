import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Information extracted from line text prior to cursor regarding member access.
 */
export interface MemberAccessInfo {
  receiver: string;
  dotIndex: number;
  memberPrefix: string;
}

export interface ParsedMember {
  name: string;
  isMethod: boolean;
  signature: string;
  hasParams: boolean;
}

/**
 * Scans backwards from cursor on a line of code to extract the receiver expression and dot index.
 */
export function extractReceiverAndDot(
  lineText: string,
  cursorChar: number
): MemberAccessInfo | null {
  if (cursorChar <= 0 || cursorChar > lineText.length) {
    return null;
  }

  const textBefore = lineText.substring(0, cursorChar);

  // Match optional identifier prefix after dot: "receiver.prefix" or "receiver."
  const dotIndex = textBefore.lastIndexOf('.');
  if (dotIndex <= 0) {
    return null;
  }

  // Ensure dot is not part of ".." or "..." or "->"
  if (dotIndex > 0 && (textBefore[dotIndex - 1] === '.' || textBefore[dotIndex - 1] === '>')) {
    return null;
  }
  if (dotIndex + 1 < textBefore.length && textBefore[dotIndex + 1] === '.') {
    return null;
  }

  const memberPrefix = textBefore.substring(dotIndex + 1).trim();

  // Extract receiver expression prior to the dot
  let i = dotIndex - 1;
  while (i >= 0 && (textBefore[i] === ' ' || textBefore[i] === '\t')) {
    i--;
  }

  if (i < 0) {
    return null;
  }

  let parenDepth = 0;
  let bracketDepth = 0;
  const endIndex = i + 1;

  while (i >= 0) {
    const ch = textBefore[i];

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
        break;
      }
    }

    if (parenDepth === 0 && bracketDepth === 0) {
      if (
        ch === ';' ||
        ch === '{' ||
        ch === '}' ||
        ch === ',' ||
        ch === '=' ||
        ch === '+' ||
        ch === '*' ||
        ch === '/' ||
        ch === '!' ||
        ch === '&' ||
        ch === '|' ||
        ch === '?' ||
        ch === ':'
      ) {
        break;
      }
      if (ch === ' ' || ch === '\t') {
        break;
      }
    }

    i--;
  }

  const receiver = textBefore.substring(i + 1, endIndex).trim();
  if (!receiver) {
    return null;
  }

  return { receiver, dotIndex, memberPrefix };
}

/**
 * Extracts the underlying pointee type name from a C++ pointer or smart pointer type signature.
 */
export function extractPointeeType(typeSignature: string): string | null {
  if (!typeSignature) return null;

  const normalized = typeSignature.trim();

  // Smart pointers: unique_ptr<T>, shared_ptr<T>, weak_ptr<T>
  const smartMatch = normalized.match(/(?:unique_ptr|shared_ptr|weak_ptr)<\s*(?:class\s+|struct\s+)?([a-zA-Z0-9_:]+)/);
  if (smartMatch) {
    const raw = smartMatch[1].trim();
    const parts = raw.split('::');
    return parts[parts.length - 1];
  }

  // Raw pointers: "Entity *", "Entity*", "const Entity*"
  const rawPtrMatch = normalized.match(/([a-zA-Z0-9_]+)\s*\*(?![\w*])/);
  if (rawPtrMatch) {
    const raw = rawPtrMatch[1].trim();
    if (raw !== 'void') {
      return raw;
    }
  }

  return null;
}

/**
 * Scans document scope to discover the pointee type of a variable name (e.g. pdummy or player).
 */
export function findVariablePointeeType(
  documentText: string,
  receiver: string,
  currentLine?: number
): string | null {
  const lines = documentText.split('\n');
  const maxLine = currentLine !== undefined ? Math.min(currentLine, lines.length - 1) : lines.length - 1;

  // Scan backwards from current line
  for (let i = maxLine; i >= 0; i--) {
    const line = lines[i];
    if (!line.includes(receiver)) {
      continue;
    }

    // 1. auto receiver = std::make_unique<Type>(...) or make_shared<Type>(...)
    const makeMatch = line.match(
      new RegExp(`\\b(?:auto|const\\s+auto)\\s+${receiver}\\s*=\\s*(?:std::)?(?:make_unique|make_shared)<\\s*(?:class\\s+|struct\\s+)?([a-zA-Z0-9_:]+)`)
    );
    if (makeMatch) {
      return makeMatch[1].split('::').pop()!;
    }

    // 2. std::unique_ptr<Type> receiver or std::shared_ptr<Type> receiver
    const smartMatch = line.match(
      new RegExp(`\\b(?:unique_ptr|shared_ptr|weak_ptr)<\\s*(?:class\\s+|struct\\s+)?([a-zA-Z0-9_:]+)[^>]*>\\s+[*&]*\\s*${receiver}\\b`)
    );
    if (smartMatch) {
      return smartMatch[1].split('::').pop()!;
    }

    // 3. Type* receiver or Type *receiver
    const rawPtrMatch = line.match(
      new RegExp(`\\b([a-zA-Z0-9_]+)\\s*\\*\\s*(?:const\\s+)?${receiver}\\b`)
    );
    if (rawPtrMatch && rawPtrMatch[1] !== 'void') {
      return rawPtrMatch[1];
    }

    // 4. auto receiver = new Type
    const newMatch = line.match(
      new RegExp(`\\b(?:auto|const\\s+auto)\\s+${receiver}\\s*=\\s*new\\s+([a-zA-Z0-9_]+)`)
    );
    if (newMatch) {
      return newMatch[1];
    }
  }

  // Fallback: check function parameters in entire document
  const paramMatch = documentText.match(
    new RegExp(`(?:unique_ptr|shared_ptr)<(?:class\\s+|struct\\s+)?([a-zA-Z0-9_]+)[^>]*>[&\\s]+${receiver}\\b`)
  );
  if (paramMatch) {
    return paramMatch[1];
  }

  const rawParamMatch = documentText.match(
    new RegExp(`\\b([a-zA-Z0-9_]+)\\s*\\*\\s*${receiver}\\b`)
  );
  if (rawParamMatch && rawParamMatch[1] !== 'void') {
    return rawParamMatch[1];
  }

  return null;
}

/**
 * Parses all accessible member methods and fields from a class or struct declaration code string.
 */
export function parseMembersFromCode(code: string, typeName: string): ParsedMember[] {
  const members: ParsedMember[] = [];
  const typeRegex = new RegExp(`(?:class|struct)\\s+${typeName}\\b[^{]*\\{([\\s\\S]*?)\\};`, 'g');

  let match: RegExpExecArray | null;
  while ((match = typeRegex.exec(code)) !== null) {
    const body = match[1];
    const lines = body.split('\n');
    const isClass = code.includes(`class ${typeName}`);
    let isPublic = !isClass; // struct is public by default, class is private by default

    for (const rawLine of lines) {
      const trimmed = rawLine.trim();

      if (trimmed.startsWith('public:')) {
        isPublic = true;
        continue;
      }
      if (trimmed.startsWith('private:') || trimmed.startsWith('protected:')) {
        isPublic = false;
        continue;
      }
      if (!isPublic || trimmed.length === 0 || trimmed.startsWith('//') || trimmed.startsWith('/*')) {
        continue;
      }

      // 1. Member function: e.g. int getValue() const { return value; } or virtual void render() const;
      const funcMatch = trimmed.match(/^(?:\[\[[^\]]+\]\]\s+)?(?:virtual\s+|static\s+|inline\s+|explicit\s+)*([a-zA-Z0-9_:<>*& ]+?)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)/);
      if (funcMatch) {
        const retType = funcMatch[1].trim();
        const name = funcMatch[2].trim();
        const args = funcMatch[3].trim();

        // Exclude constructors and destructors
        if (name === typeName || name === `~${typeName}`) {
          continue;
        }

        members.push({
          name,
          isMethod: true,
          signature: `${retType} ${name}(${args})`,
          hasParams: args.length > 0 && args !== 'void'
        });
        continue;
      }

      // 2. Member variable: e.g. int value; or float factor = 1.0f;
      const varMatch = trimmed.match(/^([a-zA-Z0-9_:<>*& ]+?)\s+([a-zA-Z0-9_]+)\s*(?:=\s*[^;]+)?;/);
      if (varMatch) {
        const type = varMatch[1].trim();
        const name = varMatch[2].trim();
        if (!['return', 'typedef', 'using', 'friend'].includes(type)) {
          members.push({
            name,
            isMethod: false,
            signature: `${type} ${name}`,
            hasParams: false
          });
        }
      }
    }
  }

  return members;
}

/**
 * Discovers accessible members of a given type name by inspecting the document and local headers.
 */
export async function findMembersForType(
  document: vscode.TextDocument,
  typeName: string
): Promise<ParsedMember[]> {
  const docText = document.getText();

  // 1. Search in current document
  let members = parseMembersFromCode(docText, typeName);
  if (members.length > 0) {
    return members;
  }

  // 2. Search in included local headers (#include "...")
  const includeMatches = docText.matchAll(/#include\s+["<]([^">]+)[">]/g);
  const docDir = path.dirname(document.uri.fsPath);

  for (const m of includeMatches) {
    const incPath = m[1];
    const candidatePath = path.isAbsolute(incPath) ? incPath : path.join(docDir, incPath);
    if (fs.existsSync(candidatePath)) {
      try {
        const headerText = fs.readFileSync(candidatePath, 'utf8');
        members = parseMembersFromCode(headerText, typeName);
        if (members.length > 0) {
          return members;
        }
      } catch {
        // Skip read errors
      }
    }
  }

  // 3. Fallback: query document / workspace symbols if available
  try {
    const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
      'vscode.executeWorkspaceSymbolProvider',
      `${typeName}::`
    );
    if (symbols && symbols.length > 0) {
      for (const sym of symbols) {
        if (sym.name === typeName || sym.name === `~${typeName}`) continue;
        const isMethod = sym.kind === vscode.SymbolKind.Method || sym.kind === vscode.SymbolKind.Function;
        members.push({
          name: sym.name,
          isMethod,
          signature: sym.name,
          hasParams: false
        });
      }
    }
  } catch {
    // Ignore fallback failure
  }

  return members;
}

/**
 * Creates a TextEdit that replaces a dot with an arrow operator (->).
 */
export function createArrowFixTextEdit(line: number, dotIndex: number): vscode.TextEdit {
  const range = new vscode.Range(new vscode.Position(line, dotIndex), new vscode.Position(line, dotIndex + 1));
  return vscode.TextEdit.replace(range, '->');
}

/**
 * Enriches completion items with dot-to-arrow auto-replacement.
 */
export class DotToArrowController {
  /**
   * Processes completion items when dot is typed on a pointer or smart pointer,
   * injecting pointee members and attaching dot-to-arrow replacements.
   */
  public static async processCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    existingItems: vscode.CompletionItem[]
  ): Promise<vscode.CompletionItem[]> {
    if (!document || typeof document.lineAt !== 'function') {
      return existingItems;
    }

    const lineText = document.lineAt(position.line).text;
    const access = extractReceiverAndDot(lineText, position.character);
    if (!access) {
      return existingItems;
    }

    const { receiver, dotIndex } = access;
    const arrowEdit = createArrowFixTextEdit(position.line, dotIndex);

    // 1. If Clangd already returned items with arrow replacements, ensure edit is present
    for (const item of existingItems) {
      const hasArrowEdit = item.additionalTextEdits?.some((e) => e.newText === '->');
      if (hasArrowEdit) {
        continue;
      }

      const detail = typeof item.detail === 'string' ? item.detail : '';
      if (detail.includes('->') || detail.includes('(as pointer)')) {
        item.additionalTextEdits = item.additionalTextEdits || [];
        item.additionalTextEdits.push(arrowEdit);
      }
    }

    // 2. Discover pointee type via static scope scan or hover
    const docText = typeof document.getText === 'function' ? document.getText() : '';
    let pointeeType = findVariablePointeeType(docText, receiver, position.line);

    if (!pointeeType) {
      try {
        const receiverPos = new vscode.Position(position.line, Math.max(0, dotIndex - 1));
        const hovers = await vscode.commands.executeCommand<vscode.Hover[]>(
          'vscode.executeHoverProvider',
          document.uri,
          receiverPos
        );

        if (hovers && hovers.length > 0) {
          for (const hover of hovers) {
            for (const content of hover.contents) {
              const text = typeof content === 'string' ? content : content.value;
              const extracted = extractPointeeType(text);
              if (extracted) {
                pointeeType = extracted;
                break;
              }
            }
            if (pointeeType) break;
          }
        }
      } catch {
        // Fallback
      }
    }

    if (!pointeeType) {
      return existingItems;
    }

    // 3. Find accessible members of the pointee type
    const members = await findMembersForType(document, pointeeType);
    if (members.length === 0) {
      return existingItems;
    }

    const existingLabels = new Set(
      existingItems.map((i) => (typeof i.label === 'string' ? i.label : i.label.label))
    );

    for (const m of members) {
      if (!existingLabels.has(m.name)) {
        const item = new vscode.CompletionItem(
          m.name,
          m.isMethod ? vscode.CompletionItemKind.Method : vscode.CompletionItemKind.Field
        );

        item.detail = `${pointeeType}::${m.signature} (replaces . with ->)`;
        item.sortText = `!00_${m.name}`;
        item.filterText = m.name;
        item.additionalTextEdits = [arrowEdit];

        if (m.isMethod) {
          item.insertText = m.hasParams
            ? new vscode.SnippetString(`${m.name}($0)`)
            : `${m.name}()`;
          if (m.hasParams) {
            item.command = {
              title: 'Trigger Parameter Hints',
              command: 'editor.action.triggerParameterHints'
            };
          }
        } else {
          item.insertText = m.name;
        }

        existingItems.push(item);
        existingLabels.add(m.name);
      } else {
        // Member exists: attach arrow replacement to it
        const matched = existingItems.find(
          (i) => (typeof i.label === 'string' ? i.label : i.label.label) === m.name
        );
        if (matched) {
          matched.additionalTextEdits = matched.additionalTextEdits || [];
          if (!matched.additionalTextEdits.some((e) => e.newText === '->')) {
            matched.additionalTextEdits.push(arrowEdit);
            matched.detail = (matched.detail ? matched.detail + ' ' : '') + '(replaces . with ->)';
          }
        }
      }
    }

    return existingItems;
  }
}
