import './vscode-mock';
import * as assert from 'assert';
import {
  extractMacroDefinitions,
  expandMacroRecursively,
  evaluateConstexprExpression,
  splitMacroArguments
} from '../src/intelligence/macro-evaluator';

describe('Macro Expansion & constexpr Evaluator', () => {
  describe('extractMacroDefinitions', () => {
    it('should extract object-like and function-like macros including multiline continuations', () => {
      const code = `
#define BUFFER_SIZE 1024
#define MAX(a, b) ((a) > (b) ? (a) : (b))
#define MULTILINE_MACRO(x) \\
    do { \\
        int val = (x); \\
    } while (0)
`;
      const defs = extractMacroDefinitions(code);
      assert.strictEqual(defs.size, 3);

      const buf = defs.get('BUFFER_SIZE');
      assert.ok(buf);
      assert.strictEqual(buf?.isFunctionLike, false);
      assert.strictEqual(buf?.body, '1024');

      const max = defs.get('MAX');
      assert.ok(max);
      assert.strictEqual(max?.isFunctionLike, true);
      assert.deepStrictEqual(max?.params, ['a', 'b']);

      const multi = defs.get('MULTILINE_MACRO');
      assert.ok(multi);
      assert.ok(multi?.body.includes('while (0)'));
    });

    it('should correctly classify parenthesized object macros and compact function macros', () => {
      const code = `
#define BUFFER_SIZE (1024 * 1024)
#define SQR(x)(x*x)
#define NOOP()
#define EMPTY_OBJECT
`;
      const defs = extractMacroDefinitions(code);
      assert.strictEqual(defs.size, 4);

      const buf = defs.get('BUFFER_SIZE');
      assert.ok(buf);
      assert.strictEqual(buf?.isFunctionLike, false);
      assert.strictEqual(buf?.body, '(1024 * 1024)');
      assert.strictEqual(buf?.params, undefined);

      const sqr = defs.get('SQR');
      assert.ok(sqr);
      assert.strictEqual(sqr?.isFunctionLike, true);
      assert.strictEqual(sqr?.body, '(x*x)');
      assert.deepStrictEqual(sqr?.params, ['x']);

      const noop = defs.get('NOOP');
      assert.ok(noop);
      assert.strictEqual(noop?.isFunctionLike, true);
      assert.strictEqual(noop?.body, '');
      assert.deepStrictEqual(noop?.params, []);

      const empty = defs.get('EMPTY_OBJECT');
      assert.ok(empty);
      assert.strictEqual(empty?.isFunctionLike, false);
      assert.strictEqual(empty?.body, '');
    });
  });

  describe('splitMacroArguments', () => {
    it('should split arguments respecting nested parentheses', () => {
      const args = splitMacroArguments('std::max(1, 2), "hello, world", (3 + 4)');
      assert.strictEqual(args.length, 3);
      assert.strictEqual(args[0], 'std::max(1, 2)');
      assert.strictEqual(args[1], '"hello, world"');
      assert.strictEqual(args[2], '(3 + 4)');
    });
  });

  describe('expandMacroRecursively', () => {
    it('should expand function-like macro with arguments', () => {
      const defs = extractMacroDefinitions(`
#define SQUARE(x) ((x) * (x))
`);
      const res = expandMacroRecursively('SQUARE(5 + 1)', defs);
      assert.strictEqual(res.isExpanded, true);
      assert.strictEqual(res.finalExpansion, '((5 + 1) * (5 + 1))');
    });

    it('should expand nested macros across multiple steps', () => {
      const defs = extractMacroDefinitions(`
#define BASE 10
#define MULT(x) ((x) * BASE)
#define CALC(a) MULT((a) + 1)
`);
      const res = expandMacroRecursively('CALC(5)', defs);
      assert.strictEqual(res.isExpanded, true);
      assert.ok(res.steps.length >= 3);
      assert.strictEqual(res.finalExpansion, '(((5) + 1) * 10)');
    });

    it('should support stringification and token pasting', () => {
      const defs = extractMacroDefinitions(`
#define TO_STR(x) #x
#define CONCAT(a, b) a ## b
`);
      const res1 = expandMacroRecursively('TO_STR(hello_world)', defs);
      assert.strictEqual(res1.finalExpansion, '"hello_world"');

      const res2 = expandMacroRecursively('CONCAT(foo, 42)', defs);
      assert.strictEqual(res2.finalExpansion, 'foo42');

      const res3 = expandMacroRecursively('CONCAT(cat, dog)', defs);
      assert.strictEqual(res3.finalExpansion, 'catdog');
    });
  });

  describe('evaluateConstexprExpression', () => {
    it('should evaluate constant arithmetic and bitwise math', () => {
      const e1 = evaluateConstexprExpression('(1 << 10) | (1 << 8)');
      assert.strictEqual(e1.success, true);
      assert.strictEqual(e1.value, 1280);

      const e2 = evaluateConstexprExpression('constexpr int pageSize = 4 * 1024;');
      assert.strictEqual(e2.success, true);
      assert.strictEqual(e2.value, 4096);
      assert.strictEqual(e2.type, 'int');

      const e3 = evaluateConstexprExpression('0xFF ^ 0x0F');
      assert.strictEqual(e3.success, true);
      assert.strictEqual(e3.value, 240);
    });

    it('should reject invalid or non-constant tokens for safety', () => {
      const res = evaluateConstexprExpression('process.exit(1)');
      assert.strictEqual(res.success, false);
      assert.ok(res.error);
    });

    it('should evaluate mixed BigInt and standard integer expressions with LL/ULL suffixes', () => {
      const e = evaluateConstexprExpression('1 + 2LL');
      assert.strictEqual(e.success, true);
      assert.strictEqual(e.value, 3n);
      assert.strictEqual(e.type, 'int64_t');

      const e2 = evaluateConstexprExpression('(1024ULL * 1024) + 0x10');
      assert.strictEqual(e2.success, true);
      assert.strictEqual(e2.value, 1048576n + 16n);
      assert.strictEqual(e2.type, 'int64_t');
    });
  });
});
