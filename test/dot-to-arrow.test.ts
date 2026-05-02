import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  extractReceiverAndDot,
  extractPointeeType,
  createArrowFixTextEdit,
  DotToArrowController
} from '../src/intelligence/dot-to-arrow';

describe('Dot-to-Arrow Auto-Fix & Pointer Member Completion', () => {
  describe('extractReceiverAndDot', () => {
    it('should extract receiver and dot index when dot is typed directly', () => {
      const line = 'player.';
      const res = extractReceiverAndDot(line, 7);
      assert.ok(res);
      assert.strictEqual(res.receiver, 'player');
      assert.strictEqual(res.dotIndex, 6);
      assert.strictEqual(res.memberPrefix, '');
    });

    it('should extract receiver and prefix when typing member filter', () => {
      const line = 'auto x = player.ren';
      const res = extractReceiverAndDot(line, 19);
      assert.ok(res);
      assert.strictEqual(res.receiver, 'player');
      assert.strictEqual(res.dotIndex, 15);
      assert.strictEqual(res.memberPrefix, 'ren');
    });

    it('should handle indexed expressions as receiver', () => {
      const line = 'players[0].';
      const res = extractReceiverAndDot(line, 11);
      assert.ok(res);
      assert.strictEqual(res.receiver, 'players[0]');
      assert.strictEqual(res.dotIndex, 10);
    });

    it('should handle arrow chained receivers', () => {
      const line = 'game->current_player().';
      const res = extractReceiverAndDot(line, 23);
      assert.ok(res);
      assert.strictEqual(res.receiver, 'game->current_player()');
      assert.strictEqual(res.dotIndex, 22);
    });

    it('should ignore double dot .. and empty lines', () => {
      assert.strictEqual(extractReceiverAndDot('..', 2), null);
      assert.strictEqual(extractReceiverAndDot('.', 0), null);
    });
  });

  describe('extractPointeeType', () => {
    it('should extract pointee type from std::unique_ptr', () => {
      assert.strictEqual(extractPointeeType('std::unique_ptr<Entity>'), 'Entity');
      assert.strictEqual(extractPointeeType('unique_ptr<class Player>'), 'Player');
    });

    it('should extract pointee type from std::shared_ptr and weak_ptr', () => {
      assert.strictEqual(extractPointeeType('std::shared_ptr<Entity>'), 'Entity');
      assert.strictEqual(extractPointeeType('std::weak_ptr<Entity>'), 'Entity');
    });

    it('should extract pointee type from raw pointers', () => {
      assert.strictEqual(extractPointeeType('Entity*'), 'Entity');
      assert.strictEqual(extractPointeeType('const Entity *'), 'Entity');
      assert.strictEqual(extractPointeeType('PlayerState *'), 'PlayerState');
    });

    it('should return null for non-pointer types', () => {
      assert.strictEqual(extractPointeeType('std::vector<int>'), null);
      assert.strictEqual(extractPointeeType('int'), null);
      assert.strictEqual(extractPointeeType('void*'), null);
    });
  });

  describe('createArrowFixTextEdit', () => {
    it('should produce a TextEdit replacing the dot with ->', () => {
      const edit = createArrowFixTextEdit(10, 5);
      assert.ok(edit);
      assert.strictEqual(edit.newText, '->');
      assert.strictEqual(edit.range.start.line, 10);
      assert.strictEqual(edit.range.start.character, 5);
      assert.strictEqual(edit.range.end.character, 6);
    });
  });

  describe('DotToArrowController', () => {
    it('should attach arrow fix edit to items indicating pointer access', async () => {
      const doc = {
        uri: vscode.Uri.file('F:/project/main.cpp'),
        lineAt: () => ({ text: 'player.' })
      } as unknown as vscode.TextDocument;

      const position = new vscode.Position(0, 7);
      const rawItem = new vscode.CompletionItem('render', vscode.CompletionItemKind.Method);
      rawItem.detail = 'void render() (as pointer)';

      const items = await DotToArrowController.processCompletionItems(doc, position, [rawItem]);
      assert.ok(items.length > 0);
      assert.ok(items[0].additionalTextEdits);
      assert.strictEqual(items[0].additionalTextEdits[0].newText, '->');
      assert.strictEqual(items[0].additionalTextEdits[0].range.start.character, 6);
      assert.strictEqual(items[0].additionalTextEdits[0].range.end.character, 7);
    });

    it('should preserve items unmodified when no dot access is present', async () => {
      const doc = {
        uri: vscode.Uri.file('F:/project/main.cpp'),
        lineAt: () => ({ text: 'player' })
      } as unknown as vscode.TextDocument;

      const position = new vscode.Position(0, 6);
      const rawItem = new vscode.CompletionItem('player');

      const items = await DotToArrowController.processCompletionItems(doc, position, [rawItem]);
      assert.strictEqual(items.length, 1);
      assert.strictEqual(items[0].additionalTextEdits, undefined);
    });
  });
});
