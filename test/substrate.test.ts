import './vscode-mock';
import * as assert from 'assert';
import { defaultClangdArguments } from '../src/substrate/daemon-manager';
import { createClangdMiddleware, debounce } from '../src/substrate/protocol-filter';
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

    it('should preserve completion re-ranking by prefixing filterText', async () => {
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
      assert.strictEqual(items[0].filterText, 'vec_vector');
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
});
