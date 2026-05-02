import * as vscode from 'vscode';

/**
 * Information extracted from line text prior to cursor regarding member access.
 */
export interface MemberAccessInfo {
  receiver: string;
  dotIndex: number;
  memberPrefix: string;
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
 * e.g.:
 * - "std::unique_ptr<Entity>" -> "Entity"
 * - "std::shared_ptr<class Player>" -> "Player"
 * - "Entity*" -> "Entity"
 * - "const Entity *" -> "Entity"
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
      const hasArrowEdit = item.additionalTextEdits?.some(
        (e) => e.newText === '->'
      );
      if (hasArrowEdit) {
        // Already marked by Clangd
        continue;
      }

      // If Clangd marked it as pointer member in detail or documentation
      const detail = typeof item.detail === 'string' ? item.detail : '';
      if (detail.includes('->') || detail.includes('(as pointer)')) {
        item.additionalTextEdits = item.additionalTextEdits || [];
        item.additionalTextEdits.push(arrowEdit);
      }
    }

    // 2. Query symbol hover for receiver to inspect if it is a pointer or smart pointer
    let pointeeType: string | null = null;
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
      // Hover execution not available in test or offline
    }

    if (!pointeeType) {
      return existingItems;
    }

    // 3. For smart pointers or raw pointers, query accessible members of pointee type
    try {
      const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
        'vscode.executeWorkspaceSymbolProvider',
        `${pointeeType}::`
      );

      if (symbols && symbols.length > 0) {
        const existingLabels = new Set(
          existingItems.map((i) => (typeof i.label === 'string' ? i.label : i.label.label))
        );

        for (const sym of symbols) {
          // Exclude constructors and destructors
          if (sym.name === pointeeType || sym.name === `~${pointeeType}`) {
            continue;
          }

          if (!existingLabels.has(sym.name)) {
            const isMethod = sym.kind === vscode.SymbolKind.Method || sym.kind === vscode.SymbolKind.Function;
            const item = new vscode.CompletionItem(
              sym.name,
              isMethod ? vscode.CompletionItemKind.Method : vscode.CompletionItemKind.Field
            );

            item.detail = `${pointeeType}::${sym.name} (replaces . with ->)`;
            item.sortText = `!00_${sym.name}`;
            item.additionalTextEdits = [arrowEdit];

            if (isMethod) {
              item.insertText = new vscode.SnippetString(`${sym.name}($0)`);
              item.command = {
                title: 'Trigger Parameter Hints',
                command: 'editor.action.triggerParameterHints'
              };
            } else {
              item.insertText = sym.name;
            }

            existingItems.push(item);
            existingLabels.add(sym.name);
          } else {
            // Member exists: attach arrow replacement to it
            const matched = existingItems.find(
              (i) => (typeof i.label === 'string' ? i.label : i.label.label) === sym.name
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
      }
    } catch {
      // Symbol query fallback
    }

    return existingItems;
  }
}
