import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { findCounterpartFile, HEADER_EXTENSIONS, isSystemHeader } from './smart-definition';
import { DoxygenGenerator, DoxygenStyle } from '../documentation/doxygen-generator';
import { splitParameters } from './hover-transformer';

export const STD_HEADERS_CATALOG: Record<string, string> = {
  vector: '<vector>',
  string: '<string>',
  string_view: '<string_view>',
  unique_ptr: '<memory>',
  shared_ptr: '<memory>',
  make_unique: '<memory>',
  make_shared: '<memory>',
  span: '<span>',
  ranges: '<ranges>',
  views: '<ranges>',
  format: '<format>',
  cout: '<iostream>',
  cin: '<iostream>',
  endl: '<iostream>',
  ostream: '<iostream>',
  optional: '<optional>',
  variant: '<variant>',
  array: '<array>',
  sort: '<algorithm>',
  find: '<algorithm>',
  same_as: '<concepts>',
  integral: '<concepts>'
};

/**
 * Extracts enclosing class or struct name for a given line index in a C++ document.
 */
export function findEnclosingClassName(document: vscode.TextDocument, lineIndex: number): string | null {
  for (let i = lineIndex - 1; i >= 0; i--) {
    const text = document.lineAt(i).text.trim();
    const classMatch = text.match(/^(?:class|struct)\s+([a-zA-Z0-9_]+)/);
    if (classMatch) {
      return classMatch[1];
    }
  }
  return null;
}

/**
 * Cleans a function declaration line to generate its qualified definition signature.
 */
export function buildDefinitionStub(
  declLine: string,
  className: string | null
): string | null {
  let cleaned = declLine.trim();

  // Strip trailing semicolon or whitespace
  if (cleaned.endsWith(';')) {
    cleaned = cleaned.substring(0, cleaned.length - 1).trim();
  }

  // Remove specifiers that are not allowed in definitions
  cleaned = cleaned.replace(/\bvirtual\s+/g, '');
  cleaned = cleaned.replace(/\boverride\b/g, '');
  cleaned = cleaned.replace(/\bexplicit\s+/g, '');
  cleaned = cleaned.replace(/\bstatic\s+/g, '');
  cleaned = cleaned.replace(/=\s*0\b/g, '');
  cleaned = cleaned.replace(/=\s*default\b/g, '');
  cleaned = cleaned.replace(/=\s*delete\b/g, '');
  cleaned = cleaned.trim();

  const parenIdx = cleaned.indexOf('(');
  if (parenIdx === -1) {
    return null;
  }

  const beforeParen = cleaned.substring(0, parenIdx).trim();
  const fromParen = cleaned.substring(parenIdx).trim();

  if (className) {
    const tokens = beforeParen.split(/\s+/);
    const funcName = tokens[tokens.length - 1];
    const prefix = tokens.slice(0, tokens.length - 1).join(' ');

    const qualifiedName = `${className}::${funcName}`;
    const qualifiedSignature = prefix ? `${prefix} ${qualifiedName}` : qualifiedName;

    return `\n${qualifiedSignature}${fromParen} {\n    // TODO: Implement ${funcName}\n}\n`;
  }

  return `\n${beforeParen}${fromParen} {\n    // TODO: Implementation\n}\n`;
}

export interface MacroDef {
  name: string;
  params?: string[];
  body: string;
}

export function extractMacros(documentText: string): Map<string, MacroDef> {
  const macros = new Map<string, MacroDef>();
  const lines = documentText.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^#\s*define\s+([a-zA-Z0-9_]+)(?:\(([^)]*)\))?\s+([\s\S]+)$/);
    if (match) {
      const name = match[1];
      const params = match[2] !== undefined ? match[2].split(',').map((p) => p.trim()) : undefined;
      const body = match[3].trim();
      macros.set(name, { name, params, body });
    }
  }
  return macros;
}

/**
 * NovaCpp Code Action and Refactoring Assist Provider.
 */
export class NovaCppCodeActionProvider implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.Refactor,
    vscode.CodeActionKind.QuickFix
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
    const actions: vscode.CodeAction[] = [];
    if (isSystemHeader(document.uri.fsPath)) {
      return actions;
    }
    const lineIndex = range.start.line;
    const lineText = document.lineAt(lineIndex).text;
    const ext = path.extname(document.uri.fsPath).toLowerCase();

    // 1. Assist: Create Definition in Source File (when in header)
    if (HEADER_EXTENSIONS.includes(ext) && lineText.includes('(') && lineText.includes(')')) {
      const className = findEnclosingClassName(document, lineIndex);
      const stub = buildDefinitionStub(lineText, className);

      if (stub) {
        const counterpart = findCounterpartFile(document.uri.fsPath);
        const targetPath = counterpart || document.uri.fsPath.replace(/\.(h|hpp|hxx)$/, '.cpp');
        const targetUri = vscode.Uri.file(targetPath);

        const action = new vscode.CodeAction(
          `NovaCpp: Generate Definition in ${path.basename(targetPath)}`,
          vscode.CodeActionKind.Refactor
        );

        const edit = new vscode.WorkspaceEdit();
        // Insert stub at end of target source file
        const insertPosition = new vscode.Position(100000, 0);
        edit.insert(targetUri, insertPosition, stub);

        action.edit = edit;
        actions.push(action);
      }
    }

    // 2. QuickFix: Add Missing Standard Library Header
    for (const [symbol, header] of Object.entries(STD_HEADERS_CATALOG)) {
      const pattern = new RegExp(`\\bstd::${symbol}\\b`);
      if (pattern.test(lineText)) {
        const fullDocText = document.getText();
        if (!fullDocText.includes(`#include ${header}`)) {
          const action = new vscode.CodeAction(
            `NovaCpp: Add #include ${header}`,
            vscode.CodeActionKind.QuickFix
          );

          const edit = new vscode.WorkspaceEdit();
          // Find first line or last include line to insert new include
          let insertLine = 0;
          for (let i = 0; i < Math.min(document.lineCount, 50); i++) {
            if (document.lineAt(i).text.startsWith('#include')) {
              insertLine = i + 1;
            }
          }

          edit.insert(document.uri, new vscode.Position(insertLine, 0), `#include ${header}\n`);
          action.edit = edit;
          actions.push(action);
        }
      }
    }

    // 3. Assist: Exhaustive Switch Case Generator
    if (lineText.trim().startsWith('switch') && lineText.includes('(')) {
      const switchAction = new vscode.CodeAction(
        'NovaCpp: Generate Exhaustive Enum Switch Cases',
        vscode.CodeActionKind.Refactor
      );
      const snippet = `    case \${1:Value}: {\n        break;\n    }\n    default:\n        break;\n`;
      const edit = new vscode.WorkspaceEdit();
      edit.insert(document.uri, new vscode.Position(lineIndex + 1, 0), snippet);
      switchAction.edit = edit;
      actions.push(switchAction);
    }

    // 4. Assist: Generate Doxygen Documentation
    const doxygenEnabled = vscode.workspace.getConfiguration('novacpp').get<boolean>('doxygen.generateOnCodeAction', true);
    if (doxygenEnabled) {
      const target = DoxygenGenerator.findTargetDeclaration(document, lineIndex, 5);
      if (target) {
        const item = DoxygenGenerator.parseDeclaration(target.text);
        if (item) {
          const prevLineText = target.lineIndex > 0 ? document.lineAt(target.lineIndex - 1).text.trim() : '';
          if (!prevLineText.endsWith('*/') && !prevLineText.startsWith('///') && !prevLineText.startsWith('//!')) {
            const style = vscode.workspace.getConfiguration('novacpp').get<DoxygenStyle>('doxygen.generatedStyle', '/**');
            const comment = DoxygenGenerator.generateComment(item, {
              style,
              asSnippet: false,
              indent: target.indent
            });
            const action = new vscode.CodeAction(
              `NovaCpp: Generate Doxygen Documentation for '${item.name}'`,
              vscode.CodeActionKind.Refactor
            );
            const edit = new vscode.WorkspaceEdit();
            edit.insert(document.uri, new vscode.Position(target.lineIndex, 0), comment + '\n');
            action.edit = edit;
            actions.push(action);
          }
        }
      }
    }

    // 5. Refactor: Inline Macro
    const macros = extractMacros(document.getText());
    for (const [macroName, def] of macros.entries()) {
      if (lineText.includes(macroName) && !lineText.trim().startsWith('#')) {
        let expanded: string | null = null;
        let matchRange: vscode.Range | null = null;

        if (def.params) {
          const regex = new RegExp(`\\b${macroName}\\s*\\(([^)]*)\\)`);
          const match = lineText.match(regex);
          if (match && match.index !== undefined) {
            const rawArgs = splitParameters(match[1]);
            let replacedBody = def.body;
            for (let i = 0; i < def.params.length; i++) {
              const pName = def.params[i];
              const argVal = rawArgs[i] ?? '';
              replacedBody = replacedBody.replace(new RegExp(`\\b${pName}\\b`, 'g'), argVal);
            }
            expanded = replacedBody;
            matchRange = new vscode.Range(
              lineIndex,
              match.index,
              lineIndex,
              match.index + match[0].length
            );
          }
        } else {
          const regex = new RegExp(`\\b${macroName}\\b`);
          const match = lineText.match(regex);
          if (match && match.index !== undefined) {
            expanded = def.body;
            matchRange = new vscode.Range(
              lineIndex,
              match.index,
              lineIndex,
              match.index + match[0].length
            );
          }
        }

        if (expanded && matchRange) {
          const action = new vscode.CodeAction(
            `NovaCpp: Inline Macro '${macroName}'`,
            vscode.CodeActionKind.Refactor
          );
          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, matchRange, expanded);
          action.edit = edit;
          actions.push(action);
        }
      }
    }

    return actions;
  }
}
