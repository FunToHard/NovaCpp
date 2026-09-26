import './vscode-mock';
import * as assert from 'assert';
import { DaemonManager, defaultClangdArguments } from '../src/substrate/daemon-manager';
import {
  createClangdMiddleware,
  debounce,
  enrichCompletionItemWithStl
} from '../src/substrate/protocol-filter';
import { mockVscode } from './vscode-mock';

describe('Language Server Substrate & Clangd Configuration', () => {
  describe('Clangd Startup Configuration', () => {
    it('should define all recommended performance and feature flags', () => {
      assert.ok(defaultClangdArguments.includes('--background-index'));
      assert.ok(defaultClangdArguments.includes('--clang-tidy'));
      assert.ok(defaultClangdArguments.includes('--header-insertion=iwyu'));
      assert.ok(defaultClangdArguments.includes('--completion-style=detailed'));
      assert.ok(defaultClangdArguments.includes('--function-arg-placeholders=true'));
      assert.ok(defaultClangdArguments.includes('--fallback-style=llvm'));
      assert.ok(defaultClangdArguments.includes('--header-insertion-decorators=true'));
      assert.ok(defaultClangdArguments.includes('-j=0'));
      assert.ok(defaultClangdArguments.includes('--offset-encoding=utf-16'));
    });
  });

  describe('Protocol Filter Middleware', () => {
    const middleware = createClangdMiddleware();

    it('should preserve completion filterText without corrupting fuzzy matching', async () => {
      const doc: any = {
        getText: (_range: any) => 'vec'
      };
      const pos = new mockVscode.Position(0, 3);
      const item = new mockVscode.CompletionItem('vector');
      item.range = new mockVscode.Range(new mockVscode.Position(0, 0), pos);

      const next = async () => [item];

      const result: any = await (middleware.provideCompletionItem as any)(
        doc,
        pos,
        {},
        {},
        next
      );

      const items = result.items ?? result;
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].filterText, 'vector');
      assert.deepStrictEqual(items[0].commitCharacters, []);
    });

    it('should attach parameter hints command when snippet contains placeholders', async () => {
      const doc: any = { getText: () => '' };
      const pos = new mockVscode.Position(0, 0);

      const itemWithSnippet = new mockVscode.CompletionItem('push_back');
      itemWithSnippet.insertText = new mockVscode.SnippetString('push_back(${0:val})');

      const itemWithoutSnippet = new mockVscode.CompletionItem('size');
      itemWithoutSnippet.insertText = new mockVscode.SnippetString('size()');

      const next = async () => [itemWithSnippet, itemWithoutSnippet];

      const result: any = await (middleware.provideCompletionItem as any)(
        doc,
        pos,
        {},
        {},
        next
      );

      const items = result.items ?? result;
      assert.ok(items[0].command);
      assert.strictEqual(items[0].command.command, 'editor.action.triggerParameterHints');
      assert.strictEqual(items[1].command, undefined);
    });

    it('should prepend containerName to symbol name when query contains namespace ::', async () => {
      const symbols = [
        new mockVscode.SymbolInformation('vector', 1, 'std', null),
        new mockVscode.SymbolInformation('find', 1, 'std::ranges', null)
      ];

      const next = async () => symbols;

      const result: any = await (middleware.provideWorkspaceSymbols as any)(
        'std::',
        {},
        next
      );

      assert.strictEqual(result[0].name, 'std::vector');
      assert.strictEqual(result[0].containerName, '');
      assert.strictEqual(result[1].name, 'std::ranges::find');
      assert.strictEqual(result[1].containerName, '');
    });

    it('should not alter symbol names if query does not contain ::', async () => {
      const symbols = [
        new mockVscode.SymbolInformation('vector', 1, 'std', null)
      ];

      const next = async () => symbols;

      const result: any = await (middleware.provideWorkspaceSymbols as any)(
        'vector',
        {},
        next
      );

      assert.strictEqual(result[0].name, 'vector');
      assert.strictEqual(result[0].containerName, 'std');
    });

    it('should enrich completion items with Rust-like STL documentation and complexity', async () => {
      const item = new mockVscode.CompletionItem('push_back');
      item.detail = 'void push_back(const _Ty& _Val)';
      // Mark as container method via detail or label
      enrichCompletionItemWithStl(item as any);

      assert.ok(item.documentation);
      const docStr = (item.documentation as any).value;
      assert.ok(docStr.includes('### `std::vector::push_back` *(Standard Library)*'));
      assert.ok(docStr.includes('`[<vector>]`'));
      assert.ok(docStr.includes('⏱️ **Complexity**:'));
      assert.ok(docStr.includes('#### Example'));
      assert.ok(item.detail?.includes('[<vector>]'));
    });

    it('should enrich completion items directly within provideCompletionItem', async () => {
      const item = new mockVscode.CompletionItem('std::make_unique');
      const next = async () => [item];

      const result: any = await (middleware.provideCompletionItem as any)(
        {} as any,
        new mockVscode.Position(0, 0),
        {},
        {},
        next
      );

      const items = result.items ?? result;
      assert.ok(items[0].documentation);
      const docStr = items[0].documentation.value;
      assert.ok(docStr.includes('std::make_unique'));
      assert.ok(docStr.includes('`[<memory>]`'));
      assert.ok(docStr.includes('`[C++14]`'));
      assert.ok(docStr.includes('Constructs an object of type `T` on the heap'));
    });
  });

  describe('Debouncer Utility', () => {
    it('should debounce rapid invocations', (done) => {
      let callCount = 0;
      let lastVal = '';

      const debounced = debounce((val: string) => {
        callCount++;
        lastVal = val;
      }, 50);

      debounced('a');
      debounced('b');
      debounced('c');

      assert.strictEqual(callCount, 0);

      setTimeout(() => {
        assert.strictEqual(callCount, 1);
        assert.strictEqual(lastVal, 'c');
        done();
      }, 80);
    });

    it('should allow cancelling pending debounced invocations', (done) => {
      let callCount = 0;
      const debounced = debounce(() => {
        callCount++;
      }, 50);

      debounced();
      debounced.cancel();

      setTimeout(() => {
        assert.strictEqual(callCount, 0);
        done();
      }, 70);
    });
  });

  describe('DaemonManager Lifecycle Serialization', () => {
    it('should single-flight concurrent start calls and not double-initialize', async () => {
      let resolveCallCount = 0;
      const fakeInstaller: any = {
        resolveClangdPath: async () => {
          resolveCallCount++;
          await new Promise((r) => setTimeout(r, 20));
          return null;
        }
      };

      const manager = new DaemonManager({} as any, fakeInstaller);
      await Promise.all([manager.start(), manager.start()]);

      assert.strictEqual(
        resolveCallCount,
        1,
        'resolveClangdPath must only be called once when start is called concurrently'
      );
      manager.dispose();
    });
  });
});

