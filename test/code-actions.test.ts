import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  findEnclosingClassName,
  buildDefinitionStub,
  NovaCppCodeActionProvider
} from '../src/intelligence/code-actions';

describe('Code Actions & Refactoring Assists', () => {
  describe('findEnclosingClassName', () => {
    it('should find enclosing class name from header document lines', () => {
      const doc = {
        lineAt: (idx: number) => {
          const lines = [
            '#pragma once',
            'class Entity {',
            'public:',
            '    virtual void render() const = 0;',
            '};'
          ];
          return { text: lines[idx] };
        }
      } as unknown as vscode.TextDocument;

      const className = findEnclosingClassName(doc, 3);
      assert.strictEqual(className, 'Entity');
    });

    it('should return null when not enclosed by any class or struct', () => {
      const doc = {
        lineAt: (idx: number) => {
          const lines = [
            '#pragma once',
            'void global_function();'
          ];
          return { text: lines[idx] };
        }
      } as unknown as vscode.TextDocument;

      const className = findEnclosingClassName(doc, 1);
      assert.strictEqual(className, null);
    });
  });

  describe('buildDefinitionStub', () => {
    it('should generate qualified method definition stub and strip virtual/override/= 0', () => {
      const decl = 'virtual void render() const override = 0;';
      const stub = buildDefinitionStub(decl, 'Entity');
      assert.ok(stub);
      assert.ok(stub.includes('void Entity::render() const {'));
      assert.ok(!stub.includes('virtual'));
      assert.ok(!stub.includes('override'));
      assert.ok(!stub.includes('= 0'));
      assert.ok(stub.includes('// TODO: Implement render'));
    });

    it('should generate free function definition stub without class qualifier', () => {
      const decl = 'int calculate_sum(int a, int b) noexcept;';
      const stub = buildDefinitionStub(decl, null);
      assert.ok(stub);
      assert.ok(stub.includes('int calculate_sum(int a, int b) noexcept {'));
      assert.ok(stub.includes('// TODO: Implementation'));
    });
  });

  describe('NovaCppCodeActionProvider', () => {
    it('should provide Generate Definition code action when in header file', () => {
      const provider = new NovaCppCodeActionProvider();
      const mockDoc = {
        uri: vscode.Uri.file('F:/project/Entity.hpp'),
        lineAt: (idx: number) => {
          const lines = [
            'class Entity {',
            '    void update();',
            '};'
          ];
          return { text: lines[idx] };
        },
        getText: () => 'class Entity { void update(); };'
      } as unknown as vscode.TextDocument;

      const range = new vscode.Range(new vscode.Position(1, 4), new vscode.Position(1, 10));
      const actions = provider.provideCodeActions(
        mockDoc,
        range,
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      ) as vscode.CodeAction[];

      assert.ok(Array.isArray(actions));
      const genDef = actions.find((a) => a.title.includes('Generate Definition'));
      assert.ok(genDef);
      assert.strictEqual(genDef.kind, vscode.CodeActionKind.Refactor);
    });

    it('should provide Add Missing Include quick-fix for standard types', () => {
      const provider = new NovaCppCodeActionProvider();
      const mockDoc = {
        uri: vscode.Uri.file('F:/project/main.cpp'),
        lineCount: 3,
        lineAt: (idx: number) => {
          const lines = [
            '#include <iostream>',
            'std::vector<int> numbers = {1, 2, 3};',
            'int main() {}'
          ];
          return { text: lines[idx] };
        },
        getText: () => '#include <iostream>\nstd::vector<int> numbers = {1, 2, 3};\nint main() {}'
      } as unknown as vscode.TextDocument;

      const range = new vscode.Range(new vscode.Position(1, 0), new vscode.Position(1, 15));
      const actions = provider.provideCodeActions(
        mockDoc,
        range,
        {} as vscode.CodeActionContext,
        {} as vscode.CancellationToken
      ) as vscode.CodeAction[];

      assert.ok(Array.isArray(actions));
      const includeVector = actions.find((a) => a.title === 'NovaCpp: Add #include <vector>');
      assert.ok(includeVector);
      assert.strictEqual(includeVector.kind, vscode.CodeActionKind.QuickFix);
    });
  });
});
