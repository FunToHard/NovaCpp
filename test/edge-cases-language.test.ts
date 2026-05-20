import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractExpressionBeforeDot } from '../src/intelligence/postfix-provider';
import { DoxygenGenerator } from '../src/documentation/doxygen-generator';
import { DirectiveNavigator } from '../src/navigation/directive-navigator';
import { ClangTidyManager } from '../src/analysis/clang-tidy-manager';
import { InactiveRegionsManager } from '../src/bridge/inactive-regions';

describe('Language Services & Intelligence Edge Cases', () => {
  describe('Postfix Completion Edge Cases', () => {
    it('should correctly balance template angle brackets in expression', () => {
      const line = 'std::vector<std::string>.';
      const res = extractExpressionBeforeDot(line, line.length - 1);
      assert.ok(res);
      assert.strictEqual(res.expr, 'std::vector<std::string>');
    });

    it('should ignore float literal numbers before dot', () => {
      const line = 'double x = 3.14.';
      const res = extractExpressionBeforeDot(line, line.length - 1);
      assert.strictEqual(res, null);
    });

    it('should balance curly braces in uniform initialization / lambda', () => {
      const line = 'Point{10, 20}.';
      const res = extractExpressionBeforeDot(line, line.length - 1);
      assert.ok(res);
      assert.strictEqual(res.expr, 'Point{10, 20}');
    });
  });

  describe('Doxygen Generator Edge Cases', () => {
    it('should parse operator overloads: operator[] and operator()', () => {
      const decl = 'int& operator[](size_t index);';
      const parsed = DoxygenGenerator.parseDeclaration(decl);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'operator[]');
      assert.strictEqual(parsed.returnType, 'int&');
      assert.strictEqual(parsed.params.length, 1);
      assert.strictEqual(parsed.params[0].name, 'index');

      const callOp = 'double operator()(int a, double b) const;';
      const parsedCall = DoxygenGenerator.parseDeclaration(callOp);
      assert.ok(parsedCall);
      assert.strictEqual(parsedCall.name, 'operator()');
      assert.strictEqual(parsedCall.returnType, 'double');
      assert.strictEqual(parsedCall.params.length, 2);
    });

    it('should handle trailing return type functions (auto ... -> Type)', () => {
      const decl = 'auto calculate(int a, int b) -> double;';
      const parsed = DoxygenGenerator.parseDeclaration(decl);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'calculate');
      assert.strictEqual(parsed.returnType, 'double');
      assert.strictEqual(parsed.params.length, 2);
    });

    it('should preserve pointer and reference qualifiers in return types', () => {
      const decl = 'const char* getBuffer(int id);';
      const parsed = DoxygenGenerator.parseDeclaration(decl);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'getBuffer');
      assert.strictEqual(parsed.returnType, 'const char*');
      assert.strictEqual(parsed.params[0].name, 'id');
    });

    it('should handle multiline declarations correctly', () => {
      const decl = [
        'void performComplexOperation(',
        '    int x,',
        '    float y,',
        '    const std::string& name',
        ');'
      ].join('\n');
      const parsed = DoxygenGenerator.parseDeclaration(decl);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'performComplexOperation');
      assert.strictEqual(parsed.params.length, 3);
      assert.strictEqual(parsed.params[0].name, 'x');
      assert.strictEqual(parsed.params[1].name, 'y');
      assert.strictEqual(parsed.params[2].name, 'name');
    });
  });

  describe('Directive Navigator Edge Cases', () => {
    it('should ignore #if and #endif directives inside multiline block comments', () => {
      const content = [
        '/* Comment start',
        '#if DEBUG_OLD',
        'int dummy = 1;',
        '#endif',
        'Comment end */',
        '#if REAL_FEATURE',
        'void realCode();',
        '#endif'
      ].join('\n');

      const doc = {
        lineCount: 8,
        lineAt: (i: number) => ({ text: content.split('\n')[i] })
      } as any;

      const next = DirectiveNavigator.findNextDirective(doc, 5);
      assert.strictEqual(next, 7); // jumps to #endif on line 7
    });

    it('should navigate backward from #endif correctly', () => {
      const content = [
        '#if FEATURE_A',
        '#if SUB_FEATURE',
        'int x = 1;',
        '#endif',
        '#else',
        'int y = 2;',
        '#endif'
      ].join('\n');

      const doc = {
        lineCount: 7,
        lineAt: (i: number) => ({ text: content.split('\n')[i] })
      } as any;

      const prev = DirectiveNavigator.findPrevDirective(doc, 6);
      assert.strictEqual(prev, 4); // jumps to #else on line 4
    });
  });

  describe('Clang-Tidy Manager Edge Cases', () => {
    it('should extract check names with dots and underscores', () => {
      const diag1 = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 5),
        'Potential null dereference [clang-analyzer-core.NullDereference]',
        vscode.DiagnosticSeverity.Warning
      );
      assert.strictEqual(
        ClangTidyManager.extractCheckName(diag1),
        'clang-analyzer-core.NullDereference'
      );

      const diag2 = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 5),
        'Use override [modernize_use_override]',
        vscode.DiagnosticSeverity.Warning
      );
      assert.strictEqual(
        ClangTidyManager.extractCheckName(diag2),
        'modernize_use_override'
      );
    });

    it('should construct correct documentation URLs including clang-analyzer checks', () => {
      const analyzerUrl = ClangTidyManager.getDocUrl('clang-analyzer-core.NullDereference');
      assert.strictEqual(
        analyzerUrl,
        'https://clang.llvm.org/extra/clang-tidy/checks/clang-analyzer/core.NullDereference.html'
      );

      const modernizeUrl = ClangTidyManager.getDocUrl('modernize-use-override');
      assert.strictEqual(
        modernizeUrl,
        'https://clang.llvm.org/extra/clang-tidy/checks/modernize/use-override.html'
      );
    });
  });

  describe('Inactive Regions Edge Cases', () => {
    it('should normalize URIs and store regions consistently', () => {
      const mgr = new InactiveRegionsManager();
      mgr.handleInactiveRegions({
        textDocument: { uri: 'file:///c%3A/project/main.cpp' },
        regions: [new vscode.Range(new vscode.Position(10, 0), new vscode.Position(20, 0))]
      });

      const regions = mgr.getRegions('file:///c:/project/main.cpp');
      assert.ok(regions);
      assert.strictEqual(regions.length, 1);
      assert.strictEqual(regions[0].start.line, 10);
      assert.strictEqual(regions[0].end.line, 20);
      mgr.dispose();
    });
  });
});
