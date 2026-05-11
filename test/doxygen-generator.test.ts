import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { DoxygenGenerator } from '../src/documentation/doxygen-generator';
import { NovaCppCodeActionProvider } from '../src/intelligence/code-actions';

describe('Doxygen Documentation Authoring', () => {
  describe('DoxygenGenerator.extractTemplateParams', () => {
    it('should extract template parameter names correctly', () => {
      const t1 = 'template <typename T, typename Container = std::vector<T>, int N = 0>';
      assert.deepStrictEqual(DoxygenGenerator.extractTemplateParams(t1), ['T', 'Container', 'N']);

      const t2 = 'template <class Key, class Value>';
      assert.deepStrictEqual(DoxygenGenerator.extractTemplateParams(t2), ['Key', 'Value']);

      const t3 = 'int calculate(int x);';
      assert.deepStrictEqual(DoxygenGenerator.extractTemplateParams(t3), []);
    });
  });

  describe('DoxygenGenerator.extractParamName', () => {
    it('should extract parameter names from various C++ parameter declarations', () => {
      assert.strictEqual(DoxygenGenerator.extractParamName('int count'), 'count');
      assert.strictEqual(DoxygenGenerator.extractParamName('const std::string& key'), 'key');
      assert.strictEqual(DoxygenGenerator.extractParamName('std::vector<int>* items = nullptr'), 'items');
      assert.strictEqual(DoxygenGenerator.extractParamName('void (*callback)(int)'), 'callback');
      assert.strictEqual(DoxygenGenerator.extractParamName('void'), null);
      assert.strictEqual(DoxygenGenerator.extractParamName(''), null);
    });
  });

  describe('DoxygenGenerator.parseDeclaration', () => {
    it('should parse standard function declarations with return type and params', () => {
      const decl = 'bool validateUser(const std::string& username, int timeout = 30);';
      const parsed = DoxygenGenerator.parseDeclaration(decl);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'validateUser');
      assert.strictEqual(parsed.returnType, 'bool');
      assert.strictEqual(parsed.isFunction, true);
      assert.strictEqual(parsed.params.length, 2);
      assert.strictEqual(parsed.params[0].name, 'username');
      assert.strictEqual(parsed.params[1].name, 'timeout');
    });

    it('should parse templated functions', () => {
      const decl = 'template <typename T>\nT maxElement(const std::vector<T>& list);';
      const parsed = DoxygenGenerator.parseDeclaration(decl);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'maxElement');
      assert.strictEqual(parsed.returnType, 'T');
      assert.deepStrictEqual(parsed.templateParams, ['T']);
      assert.strictEqual(parsed.params.length, 1);
      assert.strictEqual(parsed.params[0].name, 'list');
    });

    it('should parse class and struct declarations', () => {
      const parsedClass = DoxygenGenerator.parseDeclaration('class NetworkEngine {');
      assert.ok(parsedClass);
      assert.strictEqual(parsedClass.name, 'NetworkEngine');
      assert.strictEqual(parsedClass.isClassOrStruct, true);
      assert.strictEqual(parsedClass.isFunction, false);

      const parsedStruct = DoxygenGenerator.parseDeclaration('struct Vec3;');
      assert.ok(parsedStruct);
      assert.strictEqual(parsedStruct.name, 'Vec3');
      assert.strictEqual(parsedStruct.isClassOrStruct, true);
    });

    it('should omit return tag for void functions', () => {
      const decl = 'void reset(int code);';
      const parsed = DoxygenGenerator.parseDeclaration(decl);
      assert.ok(parsed);
      assert.strictEqual(parsed.returnType, undefined);
    });
  });

  describe('DoxygenGenerator.generateComment', () => {
    it('should generate structured Javadoc/Doxygen /** comment', () => {
      const item = {
        name: 'computeHash',
        brief: 'Executes computeHash.',
        templateParams: ['T'],
        params: [{ name: 'data', type: 'const T&' }],
        returnType: 'uint64_t',
        isFunction: true,
        isClassOrStruct: false
      };

      const comment = DoxygenGenerator.generateComment(item, { style: '/**' });
      assert.ok(comment.includes('/**'));
      assert.ok(comment.includes('* @brief Executes computeHash.'));
      assert.ok(comment.includes('* @tparam T'));
      assert.ok(comment.includes('* @param data'));
      assert.ok(comment.includes('* @return uint64_t'));
      assert.ok(comment.includes('*/'));
    });

    it('should generate triple slash /// comment style', () => {
      const item = {
        name: 'init',
        brief: 'Initializes engine.',
        templateParams: [],
        params: [{ name: 'port', type: 'int' }],
        isFunction: true,
        isClassOrStruct: false
      };

      const comment = DoxygenGenerator.generateComment(item, { style: '///' });
      assert.ok(comment.includes('/// @brief Initializes engine.'));
      assert.ok(comment.includes('/// @param port'));
      assert.strictEqual(comment.includes('/**'), false);
    });
  });

  describe('Doxygen Code Action Integration', () => {
    it('should offer Doxygen Code Action above function declarations', () => {
      const code = 'int add(int a, int b);\n';
      const mockDoc = {
        uri: vscode.Uri.file('F:/DEV/projects/NovaCpp/src/math.h'),
        getText: () => code,
        lineCount: 2,
        lineAt: (line: number) => ({
          text: line === 0 ? 'int add(int a, int b);' : '',
          range: new vscode.Range(line, 0, line, 22)
        })
      } as any;

      const provider = new NovaCppCodeActionProvider();
      const actions = provider.provideCodeActions(
        mockDoc,
        new vscode.Range(0, 0, 0, 0),
        { diagnostics: [] } as any,
        {} as any
      ) as vscode.CodeAction[];

      const doxygenAction = actions.find((a) => a.title.includes('Generate Doxygen Documentation'));
      assert.ok(doxygenAction, 'Should offer Generate Doxygen Documentation Code Action');
      assert.ok(doxygenAction.title.includes("'add'"));
    });
  });
});
