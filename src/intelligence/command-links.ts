import * as vscode from 'vscode';

/**
 * Builds a markdown command link for triggering reference search for a symbol.
 * If document URI and position are provided, encodes them into the command URI
 * so that the editor moves the caret to the exact symbol location before searching references.
 */
export function makeFindReferencesLink(docUri?: vscode.Uri, pos?: vscode.Position): string {
  if (docUri && pos) {
    const args = encodeURIComponent(JSON.stringify([docUri.toString(), pos.line, pos.character]));
    return `[Find References](command:c-cpp-pro.findReferences?${args})`;
  }
  return '[Find References](command:c-cpp-pro.findReferences)';
}
