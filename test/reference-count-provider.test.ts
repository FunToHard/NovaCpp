import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  ReferenceCountCodeLensProvider,
  isFunctionSymbol,
  collectFunctionSymbols,
  toVsCodeRange,
  lspToVsCodeSymbolKind,
  normalizeLspSymbols,
  MAX_FUNCTIONS_PER_FILE,
  ILspClientLike,
  DiscoveredFunctionSymbol
} from '../src/intelligence/reference-count-provider';

describe('Function Reference Count CodeLens Provider', () => {
  let provider: ReferenceCountCodeLensProvider;

  beforeEach(() => {
    (vscode.workspace as any)._config = {};
  });

  afterEach(() => {
    if (provider) {
      provider.dispose();
    }
    (vscode.workspace as any)._config = {};
  });

  describe('Symbol Kind Helpers & Extraction', () => {
    it('should correctly identify function-like symbol kinds and reject classes and fields', () => {
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Function), true);
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Method), true);
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Constructor), true);
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Operator), true);
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Class), false);
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Variable), false);
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Namespace), false);
      assert.strictEqual(isFunctionSymbol(vscode.SymbolKind.Field), false);
    });

    it('should correctly map 1-indexed LSP SymbolKinds to 0-indexed VS Code SymbolKinds', () => {
      // Clangd LSP JSON-RPC kinds:
      assert.strictEqual(lspToVsCodeSymbolKind(5), vscode.SymbolKind.Class);
      assert.strictEqual(lspToVsCodeSymbolKind(6), vscode.SymbolKind.Method);
      assert.strictEqual(lspToVsCodeSymbolKind(7), vscode.SymbolKind.Property);
      assert.strictEqual(lspToVsCodeSymbolKind(8), vscode.SymbolKind.Field);
      assert.strictEqual(lspToVsCodeSymbolKind(9), vscode.SymbolKind.Constructor);
      assert.strictEqual(lspToVsCodeSymbolKind(12), vscode.SymbolKind.Function);
      assert.strictEqual(lspToVsCodeSymbolKind(25), vscode.SymbolKind.Operator);
    });

    it('should normalize raw LSP symbol trees recursively', () => {
      const rawLspSymbols = [
        {
          name: 'MyClass',
          kind: 5, // LSP Class
          children: [
            { name: 'm_member', kind: 8 }, // LSP Field
            { name: 'MyClass', kind: 9 },   // LSP Constructor
            { name: 'doWork', kind: 6 }     // LSP Method
          ]
        },
        {
          name: 'globalFunc',
          kind: 12 // LSP Function
        }
      ];

      const normalized = normalizeLspSymbols(rawLspSymbols);
      assert.strictEqual(normalized[0].kind, vscode.SymbolKind.Class);
      assert.strictEqual(normalized[0].children[0].kind, vscode.SymbolKind.Field);
      assert.strictEqual(normalized[0].children[1].kind, vscode.SymbolKind.Constructor);
      assert.strictEqual(normalized[0].children[2].kind, vscode.SymbolKind.Method);
      assert.strictEqual(normalized[1].kind, vscode.SymbolKind.Function);
    });

    it('should convert raw and vscode ranges safely', () => {
      const vsRange = new vscode.Range(1, 2, 3, 4);
      assert.strictEqual(toVsCodeRange(vsRange), vsRange);

      const raw = { start: { line: 10, character: 5 }, end: { line: 12, character: 20 } };
      const converted = toVsCodeRange(raw);
      assert.ok(converted);
      assert.strictEqual(converted.start.line, 10);
      assert.strictEqual(converted.start.character, 5);
      assert.strictEqual(converted.end.line, 12);
      assert.strictEqual(converted.end.character, 20);

      assert.strictEqual(toVsCodeRange(null), null);
      assert.strictEqual(toVsCodeRange(undefined), null);
    });

    it('should recursively extract functions from nested symbols', () => {
      const symbols = [
        {
          name: 'GlobalNamespace',
          kind: vscode.SymbolKind.Namespace,
          range: new vscode.Range(0, 0, 50, 0),
          children: [
            {
              name: 'MyClass',
              kind: vscode.SymbolKind.Class,
              range: new vscode.Range(5, 0, 30, 0),
              children: [
                {
                  name: 'MyClass',
                  kind: vscode.SymbolKind.Constructor,
                  range: new vscode.Range(6, 4, 8, 5),
                  selectionRange: new vscode.Range(6, 4, 6, 11)
                },
                {
                  name: 'doWork',
                  kind: vscode.SymbolKind.Method,
                  range: new vscode.Range(10, 4, 15, 5),
                  selectionRange: new vscode.Range(10, 9, 10, 15)
                },
                {
                  name: 'memberVar',
                  kind: vscode.SymbolKind.Field,
                  range: new vscode.Range(16, 4, 16, 20)
                }
              ]
            },
            {
              name: 'helperFunc',
              kind: vscode.SymbolKind.Function,
              range: new vscode.Range(35, 0, 45, 1),
              selectionRange: new vscode.Range(35, 5, 35, 15)
            }
          ]
        },
        {
          name: 'standaloneFunc',
          kind: vscode.SymbolKind.Function,
          range: new vscode.Range(55, 0, 60, 1),
          selectionRange: new vscode.Range(55, 5, 55, 19)
        }
      ];

      const discovered: DiscoveredFunctionSymbol[] = [];
      collectFunctionSymbols(symbols, discovered, MAX_FUNCTIONS_PER_FILE);

      assert.strictEqual(discovered.length, 4);
      assert.strictEqual(discovered[0].name, 'MyClass');
      assert.strictEqual(discovered[1].name, 'doWork');
      assert.strictEqual(discovered[2].name, 'helperFunc');
      assert.strictEqual(discovered[3].name, 'standaloneFunc');
    });

    it('should respect the maxLimit cap on extracted symbols', () => {
      const symbols: any[] = [];
      for (let i = 0; i < 50; i++) {
        symbols.push({
          name: `func_${i}`,
          kind: vscode.SymbolKind.Function,
          range: new vscode.Range(i * 5, 0, i * 5 + 4, 0),
          selectionRange: new vscode.Range(i * 5, 5, i * 5 + 10, 0)
        });
      }

      const discovered: DiscoveredFunctionSymbol[] = [];
      collectFunctionSymbols(symbols, discovered, 10);
      assert.strictEqual(discovered.length, 10);
    });
  });

  describe('provideCodeLenses', () => {
    it('should return empty array if feature is disabled via configuration', async () => {
      (vscode.workspace as any)._config = {
        'c-cpp-pro.referencesCodeLens.enabled': false
      };

      provider = new ReferenceCountCodeLensProvider(() => null);
      const doc = {
        uri: vscode.Uri.file('/project/src/main.cpp'),
        version: 1
      } as unknown as vscode.TextDocument;
      const token = { isCancellationRequested: false } as vscode.CancellationToken;

      const lenses = await provider.provideCodeLenses(doc, token);
      assert.deepStrictEqual(lenses, []);
    });

    it('should return empty array if cancellation is requested early', async () => {
      provider = new ReferenceCountCodeLensProvider(() => null);
      const doc = {
        uri: vscode.Uri.file('/project/src/main.cpp'),
        version: 1
      } as unknown as vscode.TextDocument;
      const token = { isCancellationRequested: true } as vscode.CancellationToken;

      const lenses = await provider.provideCodeLenses(doc, token);
      assert.deepStrictEqual(lenses, []);
    });

    it('should return CodeLens for functions/methods/constructors and exclude classes/fields from LSP symbols', async () => {
      const mockClient: ILspClientLike = {
        sendRequest: async (method: string) => {
          if (method === 'textDocument/documentSymbol') {
            return [
              {
                name: 'calculateTotal',
                kind: 12, // LSP Function (12)
                range: { start: { line: 15, character: 0 }, end: { line: 25, character: 1 } },
                selectionRange: { start: { line: 15, character: 4 }, end: { line: 15, character: 18 } }
              },
              {
                name: 'DataModel',
                kind: 5, // LSP Class (5) -> must NOT produce a CodeLens
                range: { start: { line: 30, character: 0 }, end: { line: 70, character: 1 } },
                children: [
                  {
                    name: 'm_counter',
                    kind: 8, // LSP Field / member variable (8) -> must NOT produce a CodeLens
                    range: { start: { line: 32, character: 4 }, end: { line: 32, character: 18 } },
                    selectionRange: { start: { line: 32, character: 8 }, end: { line: 32, character: 17 } }
                  },
                  {
                    name: 'DataModel',
                    kind: 9, // LSP Constructor (9) -> MUST produce a CodeLens
                    range: { start: { line: 35, character: 4 }, end: { line: 37, character: 5 } },
                    selectionRange: { start: { line: 35, character: 4 }, end: { line: 35, character: 13 } }
                  },
                  {
                    name: 'process',
                    kind: 6, // LSP Method (6) -> MUST produce a CodeLens
                    range: { start: { line: 40, character: 4 }, end: { line: 45, character: 5 } },
                    selectionRange: { start: { line: 40, character: 9 }, end: { line: 40, character: 16 } }
                  },
                  {
                    name: 'operator==',
                    kind: 25, // LSP Operator (25) -> MUST produce a CodeLens
                    range: { start: { line: 50, character: 4 }, end: { line: 55, character: 5 } },
                    selectionRange: { start: { line: 50, character: 9 }, end: { line: 50, character: 19 } }
                  }
                ]
              }
            ];
          }
          return null;
        }
      };

      provider = new ReferenceCountCodeLensProvider(() => null, mockClient);
      const doc = {
        uri: vscode.Uri.file('/project/src/data.cpp'),
        version: 1
      } as unknown as vscode.TextDocument;
      const token = { isCancellationRequested: false } as vscode.CancellationToken;

      const lenses = await provider.provideCodeLenses(doc, token);
      // Only 4 functions: calculateTotal, DataModel constructor, process method, operator==
      // Class 'DataModel' and field 'm_counter' must be completely excluded!
      assert.strictEqual(lenses.length, 4);

      // Check lens 0: free function
      assert.strictEqual(lenses[0].range.start.line, 15);
      const data0 = (lenses[0] as any).data;
      assert.strictEqual(data0.symbolName, 'calculateTotal');
      assert.strictEqual(data0.position.line, 15);
      assert.strictEqual(data0.position.character, 4);

      // Check lens 1: constructor
      assert.strictEqual(lenses[1].range.start.line, 35);
      const data1 = (lenses[1] as any).data;
      assert.strictEqual(data1.symbolName, 'DataModel');
      assert.strictEqual(data1.position.line, 35);
      assert.strictEqual(data1.position.character, 4);

      // Check lens 2: member method
      assert.strictEqual(lenses[2].range.start.line, 40);
      const data2 = (lenses[2] as any).data;
      assert.strictEqual(data2.symbolName, 'process');
      assert.strictEqual(data2.position.line, 40);
      assert.strictEqual(data2.position.character, 9);

      // Check lens 3: operator overload
      assert.strictEqual(lenses[3].range.start.line, 50);
      const data3 = (lenses[3] as any).data;
      assert.strictEqual(data3.symbolName, 'operator==');
      assert.strictEqual(data3.position.line, 50);
      assert.strictEqual(data3.position.character, 9);
    });

    it('should reuse cached lenses when document version does not change', async () => {
      let callCount = 0;
      const mockClient: ILspClientLike = {
        sendRequest: async () => {
          callCount++;
          return [
            {
              name: 'foo',
              kind: 12, // LSP Function
              range: { start: { line: 5, character: 0 }, end: { line: 8, character: 1 } },
              selectionRange: { start: { line: 5, character: 4 }, end: { line: 5, character: 7 } }
            }
          ];
        }
      };

      provider = new ReferenceCountCodeLensProvider(() => null, mockClient);
      const doc = {
        uri: vscode.Uri.file('/project/src/cached.cpp'),
        version: 10
      } as unknown as vscode.TextDocument;
      const token = { isCancellationRequested: false } as vscode.CancellationToken;

      const firstResult = await provider.provideCodeLenses(doc, token);
      assert.strictEqual(firstResult.length, 1);
      assert.strictEqual(callCount, 1);

      // Second call with same version should return cached result without calling client again
      const secondResult = await provider.provideCodeLenses(doc, token);
      assert.strictEqual(secondResult.length, 1);
      assert.strictEqual(callCount, 1);
    });
  });

  describe('resolveCodeLens', () => {
    it('should resolve CodeLens with multiple references and attach command', async () => {
      const mockClient: ILspClientLike = {
        sendRequest: async (method: string) => {
          if (method === 'textDocument/references') {
            return [
              {
                uri: 'file:///project/src/caller1.cpp',
                range: { start: { line: 12, character: 4 }, end: { line: 12, character: 10 } }
              },
              {
                uri: 'file:///project/src/caller2.cpp',
                range: { start: { line: 44, character: 8 }, end: { line: 44, character: 14 } }
              },
              {
                uri: 'file:///project/src/caller3.cpp',
                range: { start: { line: 90, character: 2 }, end: { line: 90, character: 8 } }
              }
            ];
          }
          return null;
        }
      };

      provider = new ReferenceCountCodeLensProvider(() => null, mockClient);
      const lens = new vscode.CodeLens(new vscode.Range(10, 0, 10, 0));
      (lens as any).data = {
        uri: vscode.Uri.file('/project/src/math.cpp'),
        position: new vscode.Position(10, 5),
        symbolName: 'add',
        version: 1
      };

      const resolved = await provider.resolveCodeLens(
        lens,
        { isCancellationRequested: false } as vscode.CancellationToken
      );

      assert.ok(resolved.command);
      assert.strictEqual(resolved.command.title, '3 references');
      assert.strictEqual(resolved.command.command, 'editor.action.showReferences');
      assert.strictEqual(resolved.command.tooltip, '3 references across project');
      assert.ok(Array.isArray(resolved.command.arguments));
      assert.strictEqual((resolved.command.arguments as any[])[2].length, 3);
    });

    it('should resolve CodeLens with 1 reference using singular noun', async () => {
      const mockClient: ILspClientLike = {
        sendRequest: async () => [
          {
            uri: 'file:///project/src/single_caller.cpp',
            range: { start: { line: 10, character: 0 }, end: { line: 10, character: 5 } }
          }
        ]
      };

      provider = new ReferenceCountCodeLensProvider(() => null, mockClient);
      const lens = new vscode.CodeLens(new vscode.Range(2, 0, 2, 0));
      (lens as any).data = {
        uri: vscode.Uri.file('/project/src/util.cpp'),
        position: new vscode.Position(2, 4),
        symbolName: 'singleUse',
        version: 1
      };

      const resolved = await provider.resolveCodeLens(
        lens,
        { isCancellationRequested: false } as vscode.CancellationToken
      );

      assert.ok(resolved.command);
      assert.strictEqual(resolved.command.title, '1 reference');
      assert.strictEqual(resolved.command.command, 'editor.action.showReferences');
      assert.strictEqual(resolved.command.tooltip, '1 reference across project');
    });

    it('should resolve CodeLens with 0 references without clickable command', async () => {
      const mockClient: ILspClientLike = {
        sendRequest: async () => []
      };

      provider = new ReferenceCountCodeLensProvider(() => null, mockClient);
      const lens = new vscode.CodeLens(new vscode.Range(4, 0, 4, 0));
      (lens as any).data = {
        uri: vscode.Uri.file('/project/src/unused.cpp'),
        position: new vscode.Position(4, 4),
        symbolName: 'unusedFunc',
        version: 1
      };

      const resolved = await provider.resolveCodeLens(
        lens,
        { isCancellationRequested: false } as vscode.CancellationToken
      );

      assert.ok(resolved.command);
      assert.strictEqual(resolved.command.title, '0 references');
      assert.strictEqual(resolved.command.command, '');
      assert.strictEqual(resolved.command.arguments, undefined);
      assert.strictEqual(resolved.command.tooltip, '0 references across project');
    });

    it('should not mutate CodeLens if cancellation is requested', async () => {
      const mockClient: ILspClientLike = {
        sendRequest: async () => [
          {
            uri: 'file:///project/src/foo.cpp',
            range: { start: { line: 1, character: 0 }, end: { line: 1, character: 5 } }
          }
        ]
      };

      provider = new ReferenceCountCodeLensProvider(() => null, mockClient);
      const lens = new vscode.CodeLens(new vscode.Range(5, 0, 5, 0));
      (lens as any).data = {
        uri: vscode.Uri.file('/project/src/foo.cpp'),
        position: new vscode.Position(5, 4),
        symbolName: 'cancelled',
        version: 1
      };

      const resolved = await provider.resolveCodeLens(
        lens,
        { isCancellationRequested: true } as vscode.CancellationToken
      );

      assert.strictEqual(resolved.command, undefined);
    });

    it('should return already-resolved CodeLens without re-querying', async () => {
      provider = new ReferenceCountCodeLensProvider(() => null);
      const existingCommand = {
        title: 'Already resolved',
        command: 'test.cmd'
      };
      const lens = new vscode.CodeLens(new vscode.Range(1, 0, 1, 0), existingCommand);

      const resolved = await provider.resolveCodeLens(
        lens,
        { isCancellationRequested: false } as vscode.CancellationToken
      );

      assert.strictEqual(resolved.command, existingCommand);
    });
  });

  describe('Lifecycle & Cache Clearing', () => {
    it('should clear caches when refresh or clearCache is invoked', () => {
      provider = new ReferenceCountCodeLensProvider(() => null);
      assert.doesNotThrow(() => {
        provider.clearCache();
        provider.refresh();
      });
    });

    it('should dispose without throwing', () => {
      provider = new ReferenceCountCodeLensProvider(() => null);
      assert.doesNotThrow(() => {
        provider.dispose();
      });
    });
  });
});
