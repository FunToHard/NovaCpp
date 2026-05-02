import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  extractExpressionBeforeDot,
  POSTFIX_TEMPLATES,
  PostfixCompletionProvider
} from '../src/intelligence/postfix-provider';

describe('Postfix Completion Engine', () => {
  describe('extractExpressionBeforeDot', () => {
    it('should extract simple identifier before dot', () => {
      const line = 'numbers.';
      const res = extractExpressionBeforeDot(line, 7);
      assert.ok(res);
      assert.strictEqual(res.expr, 'numbers');
      assert.strictEqual(res.startIndex, 0);
    });

    it('should extract method call before dot', () => {
      const line = 'player->get_name().';
      const res = extractExpressionBeforeDot(line, 18);
      assert.ok(res);
      assert.strictEqual(res.expr, 'player->get_name()');
      assert.strictEqual(res.startIndex, 0);
    });

    it('should extract indexed expression before dot', () => {
      const line = 'matrix[i][j].';
      const res = extractExpressionBeforeDot(line, 12);
      assert.ok(res);
      assert.strictEqual(res.expr, 'matrix[i][j]');
      assert.strictEqual(res.startIndex, 0);
    });

    it('should extract function call with arguments before dot', () => {
      const line = 'auto res = compute(a, b + 2).';
      const dotIndex = line.indexOf('.');
      const res = extractExpressionBeforeDot(line, dotIndex);
      assert.ok(res);
      assert.strictEqual(res.expr, 'compute(a, b + 2)');
      assert.strictEqual(res.startIndex, 11);
    });

    it('should isolate argument inside parameter list', () => {
      const line = 'process(item.';
      const dotIndex = line.indexOf('.');
      const res = extractExpressionBeforeDot(line, dotIndex);
      assert.ok(res);
      assert.strictEqual(res.expr, 'item');
      assert.strictEqual(res.startIndex, 8);
    });

    it('should return null when dot is preceded only by whitespace or boundary', () => {
      assert.strictEqual(extractExpressionBeforeDot('.', 0), null);
      assert.strictEqual(extractExpressionBeforeDot('  .', 2), null);
      assert.strictEqual(extractExpressionBeforeDot(';', 0), null);
    });
  });

  describe('POSTFIX_TEMPLATES', () => {
    it('should contain all essential C++ postfix templates', () => {
      const triggers = POSTFIX_TEMPLATES.map((t) => t.trigger);
      assert.ok(triggers.includes('if'));
      assert.ok(triggers.includes('ifn'));
      assert.ok(triggers.includes('null'));
      assert.ok(triggers.includes('notnull'));
      assert.ok(triggers.includes('for'));
      assert.ok(triggers.includes('iter'));
      assert.ok(triggers.includes('var'));
      assert.ok(triggers.includes('return'));
      assert.ok(triggers.includes('move'));
      assert.ok(triggers.includes('forward'));
      assert.ok(triggers.includes('unique'));
      assert.ok(triggers.includes('shared'));
      assert.ok(triggers.includes('log'));
      assert.ok(triggers.includes('format'));
    });

    it('should generate valid C++ snippet strings from expressions', () => {
      const ifTemplate = POSTFIX_TEMPLATES.find((t) => t.trigger === 'if')!;
      assert.strictEqual(ifTemplate.buildSnippet('active'), 'if (active) {\n\t$0\n}');

      const forTemplate = POSTFIX_TEMPLATES.find((t) => t.trigger === 'for')!;
      assert.strictEqual(
        forTemplate.buildSnippet('data'),
        'for (const auto& ${1:item} : data) {\n\t$0\n}'
      );

      const moveTemplate = POSTFIX_TEMPLATES.find((t) => t.trigger === 'move')!;
      assert.strictEqual(moveTemplate.buildSnippet('res'), 'std::move(res)');

      const formatTemplate = POSTFIX_TEMPLATES.find((t) => t.trigger === 'format')!;
      assert.strictEqual(formatTemplate.buildSnippet('val'), 'std::format("{}", val)');
    });
  });

  describe('PostfixCompletionProvider', () => {
    it('should provide postfix completion items when dot is typed after expression', () => {
      const provider = new PostfixCompletionProvider();
      const mockDoc = {
        lineAt: () => ({ text: 'numbers.' })
      } as unknown as vscode.TextDocument;

      const position = new vscode.Position(0, 8);
      const token = {} as vscode.CancellationToken;
      const context = {} as vscode.CompletionContext;

      const items = provider.provideCompletionItems(
        mockDoc,
        position,
        token,
        context
      ) as vscode.CompletionItem[];

      assert.ok(Array.isArray(items));
      assert.strictEqual(items.length, POSTFIX_TEMPLATES.length);

      const ifItem = items.find((i) => i.label === '.if');
      assert.ok(ifItem);
      assert.strictEqual(ifItem.kind, vscode.CompletionItemKind.Snippet);
      assert.strictEqual(ifItem.filterText, '.if');
      assert.ok(ifItem.range instanceof vscode.Range);
      assert.strictEqual(ifItem.range.start.character, 0);
      assert.strictEqual(ifItem.range.end.character, 8);
    });

    it('should return empty list when no dot exists on line', () => {
      const provider = new PostfixCompletionProvider();
      const mockDoc = {
        lineAt: () => ({ text: 'numbers' })
      } as unknown as vscode.TextDocument;

      const position = new vscode.Position(0, 7);
      const items = provider.provideCompletionItems(
        mockDoc,
        position,
        {} as vscode.CancellationToken,
        {} as vscode.CompletionContext
      ) as vscode.CompletionItem[];

      assert.deepStrictEqual(items, []);
    });
  });
});
