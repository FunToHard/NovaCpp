import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { ClangTidyManager } from '../src/analysis/clang-tidy-manager';
import { NovaCppCodeActionProvider, extractMacros } from '../src/intelligence/code-actions';

describe('Clang-Tidy & Static Analysis Actions', () => {
  describe('ClangTidyManager.extractCheckName', () => {
    it('should extract check name from diagnostic code string', () => {
      const diag = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 5),
        'Annotate with override',
        vscode.DiagnosticSeverity.Warning
      );
      diag.code = 'modernize-use-override';
      assert.strictEqual(ClangTidyManager.extractCheckName(diag), 'modernize-use-override');
    });

    it('should extract check name from diagnostic code object', () => {
      const diag = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 5),
        'Naming convention violation',
        vscode.DiagnosticSeverity.Warning
      );
      diag.code = { value: 'readability-identifier-naming', target: vscode.Uri.parse('https://llvm.org') };
      assert.strictEqual(ClangTidyManager.extractCheckName(diag), 'readability-identifier-naming');
    });

    it('should extract check name from diagnostic message bracket', () => {
      const diag = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 5),
        'narrowing conversion from int to char [bugprone-narrowing-conversions]',
        vscode.DiagnosticSeverity.Warning
      );
      assert.strictEqual(ClangTidyManager.extractCheckName(diag), 'bugprone-narrowing-conversions');
    });

    it('should return null for diagnostics without Clang-Tidy checks', () => {
      const diag = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 5),
        'syntax error: unexpected token',
        vscode.DiagnosticSeverity.Error
      );
      assert.strictEqual(ClangTidyManager.extractCheckName(diag), null);
    });
  });

  describe('ClangTidyManager.getDocUrl', () => {
    it('should generate official LLVM check documentation URL', () => {
      const url1 = ClangTidyManager.getDocUrl('modernize-use-override');
      assert.strictEqual(url1, 'https://clang.llvm.org/extra/clang-tidy/checks/modernize/use-override.html');

      const url2 = ClangTidyManager.getDocUrl('bugprone-argument-comment');
      assert.strictEqual(url2, 'https://clang.llvm.org/extra/clang-tidy/checks/bugprone/argument-comment.html');
    });
  });

  describe('ClangTidyManager.provideCodeActions', () => {
    it('should generate doc link, NOLINTNEXTLINE, and NOLINT actions', () => {
      const manager = ClangTidyManager.getInstance();
      const mockDoc = {
        uri: vscode.Uri.file('F:/DEV/projects/NovaCpp/src/sample.cpp'),
        lineAt: () => ({ text: '    virtual void run();' })
      } as any;

      const diag = new vscode.Diagnostic(
        new vscode.Range(10, 4, 10, 20),
        'prefer override [modernize-use-override]',
        vscode.DiagnosticSeverity.Warning
      );
      diag.code = 'modernize-use-override';

      const actions = manager.provideCodeActions(
        mockDoc,
        new vscode.Range(10, 4, 10, 20),
        { diagnostics: [diag] } as any,
        {} as any
      ) as vscode.CodeAction[];

      assert.strictEqual(actions.length, 3);

      const docAction = actions.find((a) => a.title.includes('Open Clang-Tidy Documentation'));
      assert.ok(docAction);
      assert.ok(docAction.command);

      const noLintNext = actions.find((a) => a.title.includes('// NOLINTNEXTLINE'));
      assert.ok(noLintNext);
      assert.ok(noLintNext.edit);

      const noLint = actions.find((a) => a.title.includes('// NOLINT') && !a.title.includes('NEXTLINE'));
      assert.ok(noLint);
      assert.ok(noLint.edit);
    });
  });

  describe('Macro Inlining Refactor', () => {
    it('should extract macros from document text', () => {
      const docText = `
#define BUFFER_SZ 4096
#define MAX(a, b) (((a) > (b)) ? (a) : (b))
int x = 10;
      `;
      const macros = extractMacros(docText);
      assert.strictEqual(macros.size, 2);
      assert.strictEqual(macros.get('BUFFER_SZ')?.body, '4096');
      assert.deepStrictEqual(macros.get('MAX')?.params, ['a', 'b']);
    });

    it('should provide inline macro Code Action for function-like macros', () => {
      const docText = '#define SQUARE(x) ((x) * (x))\nint val = SQUARE(5);';
      const mockDoc = {
        uri: vscode.Uri.file('F:/DEV/projects/NovaCpp/src/math.cpp'),
        getText: () => docText,
        lineCount: 2,
        lineAt: (line: number) => ({
          text: line === 1 ? 'int val = SQUARE(5);' : '#define SQUARE(x) ((x) * (x))',
          range: new vscode.Range(line, 0, line, 20)
        })
      } as any;

      const provider = new NovaCppCodeActionProvider();
      const actions = provider.provideCodeActions(
        mockDoc,
        new vscode.Range(1, 10, 1, 16),
        { diagnostics: [] } as any,
        {} as any
      ) as vscode.CodeAction[];

      const inlineAction = actions.find((a) => a.title.includes("Inline Macro 'SQUARE'"));
      assert.ok(inlineAction, "Should provide Inline Macro 'SQUARE' Code Action");
      assert.ok(inlineAction.edit);
    });
  });
});
