import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { PreprocessorDirectiveCompletionProvider } from '../src/intelligence/directive-completion-provider';
import { mockVscode } from './vscode-mock';

describe('Preprocessor Directive Autocompletion Provider', () => {
  const provider = new PreprocessorDirectiveCompletionProvider();

  it('should define trigger characters including #', () => {
    assert.ok(PreprocessorDirectiveCompletionProvider.triggerCharacters.includes('#'));
  });

  it('should provide all preprocessor directives when typing # at the beginning of a line', () => {
    const document: any = {
      lineAt: (_line: number) => ({ text: '#' })
    };
    const position = new mockVscode.Position(0, 1);

    const items = provider.provideCompletionItems(document, position, {} as any, {} as any) as vscode.CompletionItem[];
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 10);

    const labels = items.map((i) => i.label);
    assert.ok(labels.includes('#include <...>'));
    assert.ok(labels.includes('#include "..."'));
    assert.ok(labels.includes('#if ... #endif'));
    assert.ok(labels.includes('#ifdef ... #endif'));
    assert.ok(labels.includes('#ifndef ... #endif'));
    assert.ok(labels.includes('#define (Constant)'));
    assert.ok(labels.includes('#define (Function Macro)'));
    assert.ok(labels.includes('#pragma once'));
    assert.ok(labels.includes('#error'));
    assert.ok(labels.includes('#warning'));
  });

  it('should filter to include directives when typing #inc or inc', () => {
    const document: any = {
      lineAt: (_line: number) => ({ text: '  #inc' })
    };
    const position = new mockVscode.Position(0, 6);

    const items = provider.provideCompletionItems(document, position, {} as any, {} as any) as vscode.CompletionItem[];
    assert.ok(Array.isArray(items));
    assert.ok(items.length >= 2);

    const labels = items.map((i) => i.label);
    assert.ok(labels.includes('#include <...>'));
    assert.ok(labels.includes('#include "..."'));
    assert.ok(!labels.includes('#define (Constant)'));

    const systemIncludeItem = items.find((i) => i.label === '#include <...>');
    assert.ok(systemIncludeItem);
    assert.strictEqual((systemIncludeItem.insertText as any).value, '#include <$0');
    assert.deepStrictEqual(systemIncludeItem.command, {
      command: 'editor.action.triggerSuggest',
      title: 'Trigger Suggestions'
    });

    const localIncludeItem = items.find((i) => i.label === '#include "..."');
    assert.ok(localIncludeItem);
    assert.strictEqual((localIncludeItem.insertText as any).value, '#include "$0');
    assert.deepStrictEqual(localIncludeItem.command, {
      command: 'editor.action.triggerSuggest',
      title: 'Trigger Suggestions'
    });
  });

  it('should filter to conditional directives when typing #if', () => {
    const document: any = {
      lineAt: (_line: number) => ({ text: '#if' })
    };
    const position = new mockVscode.Position(0, 3);

    const items = provider.provideCompletionItems(document, position, {} as any, {} as any) as vscode.CompletionItem[];
    assert.ok(Array.isArray(items));

    const labels = items.map((i) => i.label);
    assert.ok(labels.includes('#if ... #endif'));
    assert.ok(labels.includes('#if defined(...)'));
    assert.ok(labels.includes('#ifdef ... #endif'));
    assert.ok(labels.includes('#ifndef ... #endif'));
    assert.ok(!labels.includes('#pragma once'));
  });

  it('should filter to pragma directives when typing #pr', () => {
    const document: any = {
      lineAt: (_line: number) => ({ text: '#pr' })
    };
    const position = new mockVscode.Position(0, 3);

    const items = provider.provideCompletionItems(document, position, {} as any, {} as any) as vscode.CompletionItem[];
    assert.ok(Array.isArray(items));

    const labels = items.map((i) => i.label);
    assert.ok(labels.includes('#pragma once'));
    assert.ok(labels.includes('#pragma pack'));
  });

  it('should compute replacement range to replace the # token', () => {
    const document: any = {
      lineAt: (_line: number) => ({ text: '   #inc' })
    };
    const position = new mockVscode.Position(0, 7);

    const items = provider.provideCompletionItems(document, position, {} as any, {} as any) as vscode.CompletionItem[];
    assert.ok(Array.isArray(items));
    assert.ok(items.length > 0);

    const range = items[0].range as vscode.Range;
    assert.ok(range);
    assert.strictEqual(range.start.line, 0);
    assert.strictEqual(range.start.character, 3); // Starts at the #
    assert.strictEqual(range.end.character, 7);
  });

  it('should return empty list when # is preceded by non-whitespace code', () => {
    const document: any = {
      lineAt: (_line: number) => ({ text: 'int x = 10; #inc' })
    };
    const position = new mockVscode.Position(0, 16);

    const items = provider.provideCompletionItems(document, position, {} as any, {} as any) as vscode.CompletionItem[];
    assert.deepStrictEqual(items, []);
  });
});
