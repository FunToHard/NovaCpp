import * as vscode from 'vscode';
import { DaemonManager } from '../substrate/daemon-manager';
import { debounce } from '../substrate/protocol-filter';

export interface ReferenceCodeLensData {
  uri: vscode.Uri;
  position: vscode.Position;
  symbolName: string;
  version: number;
}

export interface DiscoveredFunctionSymbol {
  name: string;
  range: vscode.Range;
  selectionRange: vscode.Range;
}

export const MAX_FUNCTIONS_PER_FILE = 200;

export function isFunctionSymbol(kind: number): boolean {
  return (
    kind === vscode.SymbolKind.Function ||
    kind === vscode.SymbolKind.Method ||
    kind === vscode.SymbolKind.Constructor ||
    kind === vscode.SymbolKind.Operator
  );
}

/**
 * Maps LSP SymbolKind (1-indexed, File=1 .. TypeParameter=26) to VS Code SymbolKind (0-indexed, File=0 .. TypeParameter=25).
 */
export function lspToVsCodeSymbolKind(lspKind: number): vscode.SymbolKind {
  if (lspKind >= 1 && lspKind <= 26) {
    return (lspKind - 1) as vscode.SymbolKind;
  }
  return lspKind as vscode.SymbolKind;
}

/**
 * Recursively normalizes raw LSP protocol symbols to VS Code DocumentSymbols with 0-indexed SymbolKinds.
 */
export function normalizeLspSymbols(symbols: any[], protocol2Code?: any): any[] {
  return symbols.map((sym) => {
    const rawKind = typeof sym.kind === 'number' ? sym.kind : Number(sym.kind);
    const convertedKind = protocol2Code?.asSymbolKind
      ? protocol2Code.asSymbolKind(rawKind)
      : lspToVsCodeSymbolKind(rawKind);

    const children =
      Array.isArray(sym.children) && sym.children.length > 0
        ? normalizeLspSymbols(sym.children, protocol2Code)
        : sym.children;

    return {
      ...sym,
      kind: convertedKind,
      children
    };
  });
}

export function toVsCodeRange(r: any): vscode.Range | null {
  if (!r) return null;
  if (r instanceof vscode.Range) return r;
  const startLine = typeof r.start?.line === 'number' ? r.start.line : 0;
  const startChar = typeof r.start?.character === 'number' ? r.start.character : 0;
  const endLine = typeof r.end?.line === 'number' ? r.end.line : startLine;
  const endChar = typeof r.end?.character === 'number' ? r.end.character : startChar;
  return new vscode.Range(startLine, startChar, endLine, endChar);
}

export function collectFunctionSymbols(
  symbols: any[],
  result: DiscoveredFunctionSymbol[],
  maxLimit: number = MAX_FUNCTIONS_PER_FILE
): void {
  for (const sym of symbols) {
    if (result.length >= maxLimit) {
      return;
    }
    const kind = typeof sym.kind === 'number' ? sym.kind : Number(sym.kind);
    if (isFunctionSymbol(kind)) {
      const rawRange = sym.range ?? sym.location?.range;
      const rawSelRange = sym.selectionRange ?? rawRange;
      const range = toVsCodeRange(rawRange);
      const selectionRange = toVsCodeRange(rawSelRange);
      if (range && selectionRange) {
        result.push({
          name: sym.name ?? '',
          range,
          selectionRange
        });
      }
    }
    if (Array.isArray(sym.children) && sym.children.length > 0) {
      collectFunctionSymbols(sym.children, result, maxLimit);
    }
  }
}

export interface ILspClientLike {
  sendRequest(method: string, params?: any, token?: vscode.CancellationToken): Promise<any>;
}

export class ReferenceCountCodeLensProvider implements vscode.CodeLensProvider, vscode.Disposable {
  private onDidChangeEmitter = new vscode.EventEmitter<void>();
  public readonly onDidChangeCodeLenses: vscode.Event<void> = this.onDidChangeEmitter.event;

  private lensCache = new Map<string, { version: number; lenses: vscode.CodeLens[] }>();
  private countCache = new Map<string, { locations: vscode.Location[] }>();
  private disposables: vscode.Disposable[] = [];

  private debouncedRefresh = debounce(() => {
    this.onDidChangeEmitter.fire();
  }, 500);

  constructor(
    private readonly getDaemonManager: () => DaemonManager | null,
    private readonly clientOverride?: ILspClientLike
  ) {
    this.disposables.push(
      this.onDidChangeEmitter,
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('c-cpp-pro.referencesCodeLens.enabled')) {
          this.clearCache();
          this.onDidChangeEmitter.fire();
        }
      }),
      vscode.workspace.onDidChangeTextDocument((e) => {
        const uriStr = e.document.uri.toString();
        this.lensCache.delete(uriStr);
        for (const key of this.countCache.keys()) {
          if (key.startsWith(uriStr)) {
            this.countCache.delete(key);
          }
        }
        this.debouncedRefresh();
      }),
      vscode.workspace.onDidCloseTextDocument((doc) => {
        const uriStr = doc.uri.toString();
        this.lensCache.delete(uriStr);
        for (const key of this.countCache.keys()) {
          if (key.startsWith(uriStr)) {
            this.countCache.delete(key);
          }
        }
      })
    );
  }

  public clearCache(): void {
    this.lensCache.clear();
    this.countCache.clear();
  }

  public refresh(): void {
    this.clearCache();
    this.onDidChangeEmitter.fire();
  }

  public async provideCodeLenses(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens[]> {
    const config = vscode.workspace.getConfiguration('c-cpp-pro');
    if (!config.get<boolean>('referencesCodeLens.enabled', true)) {
      return [];
    }

    if (token.isCancellationRequested) {
      return [];
    }

    const uriKey = document.uri.toString();
    const cached = this.lensCache.get(uriKey);
    if (cached && cached.version === document.version) {
      return cached.lenses;
    }

    const rawSymbols = await this.fetchDocumentSymbols(document, token);
    if (token.isCancellationRequested) {
      return [];
    }

    const functionSymbols: DiscoveredFunctionSymbol[] = [];
    collectFunctionSymbols(rawSymbols, functionSymbols, MAX_FUNCTIONS_PER_FILE);

    const lenses: vscode.CodeLens[] = [];
    for (const sym of functionSymbols) {
      const lensRange = new vscode.Range(sym.range.start.line, 0, sym.range.start.line, 0);
      const lens = new vscode.CodeLens(lensRange);
      (lens as any).data = {
        uri: document.uri,
        position: sym.selectionRange.start,
        symbolName: sym.name,
        version: document.version
      } as ReferenceCodeLensData;
      lenses.push(lens);
    }

    this.lensCache.set(uriKey, {
      version: document.version,
      lenses
    });

    return lenses;
  }

  public async resolveCodeLens(
    codeLens: vscode.CodeLens,
    token: vscode.CancellationToken
  ): Promise<vscode.CodeLens> {
    if (codeLens.command) {
      return codeLens;
    }

    const data = (codeLens as any).data as ReferenceCodeLensData | undefined;
    if (!data) {
      return codeLens;
    }

    if (token.isCancellationRequested) {
      return codeLens;
    }

    const countKey = `${data.uri.toString()}:${data.symbolName}:${data.position.line}:${data.position.character}:${data.version}`;
    const cachedCount = this.countCache.get(countKey);
    if (cachedCount) {
      return this.applyCommand(codeLens, data, cachedCount.locations);
    }

    const locations = await this.fetchReferences(data.uri, data.position, token);
    if (token.isCancellationRequested) {
      return codeLens;
    }

    this.countCache.set(countKey, { locations });
    return this.applyCommand(codeLens, data, locations);
  }

  private applyCommand(
    codeLens: vscode.CodeLens,
    data: ReferenceCodeLensData,
    locations: vscode.Location[]
  ): vscode.CodeLens {
    const count = locations.length;
    const title = count === 1 ? '1 reference' : `${count} references`;

    codeLens.command = {
      title,
      command: count > 0 ? 'editor.action.showReferences' : '',
      arguments: count > 0 ? [data.uri, data.position, locations] : undefined,
      tooltip: count === 1 ? '1 reference across project' : `${count} references across project`
    };

    return codeLens;
  }

  private getClient(): ILspClientLike | null {
    if (this.clientOverride) {
      return this.clientOverride;
    }
    const dm = this.getDaemonManager();
    return (dm?.getClient() as unknown as ILspClientLike) ?? null;
  }

  private async fetchDocumentSymbols(
    document: vscode.TextDocument,
    token: vscode.CancellationToken
  ): Promise<any[]> {
    const client = this.getClient();
    if (client) {
      try {
        const result = await client.sendRequest(
          'textDocument/documentSymbol',
          {
            textDocument: { uri: document.uri.toString() }
          },
          token
        );
        if (Array.isArray(result) && result.length > 0) {
          const p2c = (client as any).protocol2CodeConverter;
          return normalizeLspSymbols(result, p2c);
        }
      } catch {
        // Fallback to executeDocumentSymbolProvider below
      }
    }

    try {
      const result = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        document.uri
      );
      if (Array.isArray(result)) {
        return result;
      }
    } catch {
      // Ignored
    }

    return [];
  }

  private async fetchReferences(
    uri: vscode.Uri,
    position: vscode.Position,
    token: vscode.CancellationToken
  ): Promise<vscode.Location[]> {
    const client = this.getClient();
    if (client) {
      try {
        const rawLocations = await client.sendRequest(
          'textDocument/references',
          {
            textDocument: { uri: uri.toString() },
            position: { line: position.line, character: position.character },
            context: { includeDeclaration: false }
          },
          token
        );
        if (Array.isArray(rawLocations)) {
          return rawLocations
            .map((loc) => {
              const range = toVsCodeRange(loc.range);
              if (!range) return null;
              const locUri = loc.uri
                ? (typeof loc.uri === 'string' ? vscode.Uri.parse(loc.uri) : loc.uri)
                : uri;
              return new vscode.Location(locUri, range);
            })
            .filter((l): l is vscode.Location => l !== null);
        }
      } catch {
        // Fallback to executeReferenceProvider below
      }
    }

    try {
      const locations = await vscode.commands.executeCommand<vscode.Location[]>(
        'vscode.executeReferenceProvider',
        uri,
        position
      );
      if (Array.isArray(locations)) {
        return locations.filter((loc) => {
          const isSameFile = loc.uri.toString() === uri.toString();
          const isSamePos =
            loc.range.start.line === position.line &&
            loc.range.start.character === position.character;
          return !(isSameFile && isSamePos);
        });
      }
    } catch {
      // Ignored
    }

    return [];
  }

  public dispose(): void {
    this.debouncedRefresh.cancel();
    this.clearCache();
    for (const d of this.disposables) {
      try {
        d.dispose();
      } catch {
        // Ignored
      }
    }
    this.disposables = [];
  }
}
