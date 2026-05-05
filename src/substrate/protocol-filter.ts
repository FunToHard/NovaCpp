import * as vscode from 'vscode';
import { Middleware } from 'vscode-languageclient';
import { HoverTransformer } from '../intelligence/hover-transformer';
import { prioritizeDefinitionLocations } from '../intelligence/smart-definition';
import { DotToArrowController } from '../intelligence/dot-to-arrow';
import { StlRankingTable } from '../telemetry/ranking-table';
import { extractStlSymbolKey } from '../telemetry/allowlist';

/**
 * Creates a debounced function that delays invoking func until after wait milliseconds
 * have elapsed since the last time the debounced function was invoked.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) & { cancel: () => void } {
  let timeout: NodeJS.Timeout | null = null;

  const debounced = (...args: Parameters<T>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => {
      timeout = null;
      func(...args);
    }, wait);
  };

  debounced.cancel = () => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

/**
 * Applies protocol filters and LSP client middleware to preserve Clangd's
 * semantic precision, trigger parameter hints, format qualified symbols,
 * and debounce rapid editor UI events.
 */
export function createClangdMiddleware(
  rankingTable: StlRankingTable = new StlRankingTable()
): Middleware {
  return {
    provideCompletionItem: async (
      document: vscode.TextDocument,
      position: vscode.Position,
      context: vscode.CompletionContext,
      token: vscode.CancellationToken,
      next: (
        document: vscode.TextDocument,
        position: vscode.Position,
        context: vscode.CompletionContext,
        token: vscode.CancellationToken
      ) => vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList>
    ): Promise<vscode.CompletionList | vscode.CompletionItem[]> => {
      const list = await next(document, position, context, token);
      if (!list) {
        return list ?? [];
      }

      const rawItems = Array.isArray(list) ? list : list.items;
      const isIncomplete = Array.isArray(list) ? false : list.isIncomplete;

      const items = await DotToArrowController.processCompletionItems(
        document,
        position,
        rawItems
      );

      for (const item of items) {
        // A. Apply Adaptive Empirical STL Re-Ranking
        rankingTable.applyStlRanking(item);

        // B. Completion Re-Ranking Preservation
        let prefix = '';
        if (item.range) {
          const start =
            item.range instanceof vscode.Range
              ? item.range.start
              : (item.range as { inserting: vscode.Range; replacing: vscode.Range }).inserting.start;
          prefix = document.getText(new vscode.Range(start, position));
          if (prefix.includes('.')) {
            prefix = prefix.substring(prefix.lastIndexOf('.') + 1);
          } else if (prefix.includes('->')) {
            prefix = prefix.substring(prefix.lastIndexOf('->') + 2);
          }
        }

        const labelText = typeof item.label === 'string' ? item.label : item.label.label;
        if (prefix && !item.sortText?.startsWith('!00_')) {
          item.filterText = prefix + '_' + (item.filterText ?? labelText);
        }

        // Avoid accidental commits on punctuation
        item.commitCharacters = [];

        // C. Parameter Hints & Usage Telemetry Hook on Insertion
        const symbolKey = extractStlSymbolKey(item);
        let baseCommand: vscode.Command | undefined = item.command;

        if (!baseCommand && item.insertText instanceof vscode.SnippetString) {
          if (item.insertText.value.match(/[([{<,] ?\$\{?[01]\D/)) {
            baseCommand = {
              title: 'Trigger Parameter Hints',
              command: 'editor.action.triggerParameterHints'
            };
          }
        }

        if (symbolKey) {
          item.command = {
            title: 'Record STL Usage',
            command: 'novacpp.onStlItemAccepted',
            arguments: [symbolKey, baseCommand]
          };
        } else if (baseCommand) {
          item.command = baseCommand;
        }
      }

      return new vscode.CompletionList(items, isIncomplete);
    },

    provideWorkspaceSymbols: async (
      query: string,
      token: vscode.CancellationToken,
      next: (
        query: string,
        token: vscode.CancellationToken
      ) => vscode.ProviderResult<vscode.SymbolInformation[]>
    ): Promise<vscode.SymbolInformation[] | null | undefined> => {
      const symbols = await next(query, token);
      if (!query.includes('::') || !symbols) {
        return symbols;
      }

      return symbols.map((symbol) => {
        if (symbol.containerName) {
          symbol.name = `${symbol.containerName}::${symbol.name}`;
          symbol.containerName = '';
        }
        return symbol;
      });
    },

    provideHover: async (
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      next: (
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
      ) => vscode.ProviderResult<vscode.Hover>
    ): Promise<vscode.Hover | null | undefined> => {
      const hover = await next(document, position, token);
      if (!hover) {
        return hover;
      }
      return HoverTransformer.transform(hover);
    },

    provideDefinition: async (
      document: vscode.TextDocument,
      position: vscode.Position,
      token: vscode.CancellationToken,
      next: (
        document: vscode.TextDocument,
        position: vscode.Position,
        token: vscode.CancellationToken
      ) => vscode.ProviderResult<vscode.Definition | vscode.LocationLink[]>
    ): Promise<vscode.Definition | vscode.LocationLink[] | null | undefined> => {
      const defs = await next(document, position, token);
      if (!defs) {
        return defs;
      }
      return prioritizeDefinitionLocations(defs as any);
    }
  };
}

/**
 * Event debouncer controller for editor viewport and cursor selection events.
 * Viewport / visible range events debounced by 150 ms.
 * Cursor selection events debounced by 75 ms.
 */
export class EditorEventDebouncer implements vscode.Disposable {
  private disposables: vscode.Disposable[] = [];

  private debouncedVisibleRanges = debounce(
    (editor: vscode.TextEditor, ranges: readonly vscode.Range[]) => {
      this.onVisibleRangesDebouncedEmitter.fire({ editor, ranges });
    },
    150
  );

  private debouncedSelection = debounce(
    (editor: vscode.TextEditor, selections: readonly vscode.Selection[]) => {
      this.onSelectionDebouncedEmitter.fire({ editor, selections });
    },
    75
  );

  private onVisibleRangesDebouncedEmitter = new vscode.EventEmitter<{
    editor: vscode.TextEditor;
    ranges: readonly vscode.Range[];
  }>();
  public readonly onVisibleRangesDebounced = this.onVisibleRangesDebouncedEmitter.event;

  private onSelectionDebouncedEmitter = new vscode.EventEmitter<{
    editor: vscode.TextEditor;
    selections: readonly vscode.Selection[];
  }>();
  public readonly onSelectionDebounced = this.onSelectionDebouncedEmitter.event;

  constructor() {
    this.disposables.push(
      vscode.window.onDidChangeTextEditorVisibleRanges((e) => {
        this.debouncedVisibleRanges(e.textEditor, e.visibleRanges);
      })
    );

    this.disposables.push(
      vscode.window.onDidChangeTextEditorSelection((e) => {
        this.debouncedSelection(e.textEditor, e.selections);
      })
    );
  }

  dispose(): void {
    this.debouncedVisibleRanges.cancel();
    this.debouncedSelection.cancel();
    this.onVisibleRangesDebouncedEmitter.dispose();
    this.onSelectionDebouncedEmitter.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }
}
