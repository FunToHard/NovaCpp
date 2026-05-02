import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  inferParameterSemantics,
  parseSignature,
  parseDoxygen,
  HoverTransformer
} from '../src/intelligence/hover-transformer';

describe('Rich AST Hover Transformer', () => {
  describe('inferParameterSemantics', () => {
    it('should identify read-only const references', () => {
      assert.strictEqual(inferParameterSemantics('const std::vector<int>&'), 'Read-Only (Const Ref)');
      assert.strictEqual(inferParameterSemantics('const R&'), 'Read-Only (Const Ref)');
    });

    it('should identify rvalue move sinks', () => {
      assert.strictEqual(inferParameterSemantics('std::string&&'), 'Move / Sink (Rvalue Ref)');
    });

    it('should identify mutable references and pointers', () => {
      assert.strictEqual(inferParameterSemantics('int&'), 'Mutable (In-Out Ref)');
      assert.strictEqual(inferParameterSemantics('Entity*'), 'Pointer (Nullable / In-Out)');
    });

    it('should identify smart pointer ownership semantics', () => {
      assert.strictEqual(
        inferParameterSemantics('std::unique_ptr<Entity>'),
        'Exclusive Ownership (Heap)'
      );
      assert.strictEqual(
        inferParameterSemantics('std::shared_ptr<Entity>'),
        'Shared Ownership (Refcounted)'
      );
    });

    it('should identify zero-copy views', () => {
      assert.strictEqual(inferParameterSemantics('std::string_view'), 'Non-Owning View (Zero-Copy)');
      assert.strictEqual(inferParameterSemantics('std::span<int>'), 'Non-Owning View (Zero-Copy)');
    });

    it('should identify primitive copies', () => {
      assert.strictEqual(inferParameterSemantics('double'), 'By-Value (Primitive Copy)');
      assert.strictEqual(inferParameterSemantics('int'), 'By-Value (Primitive Copy)');
      assert.strictEqual(inferParameterSemantics('bool'), 'By-Value (Primitive Copy)');
    });
  });

  describe('parseSignature', () => {
    it('should parse modern C++20 templated function with concepts and trailing return type', () => {
      const sigCode = `template <std::ranges::input_range R>
requires Numeric<std::ranges::range_value_t<R>>
auto scaled_sum(const R& data, double multiplier) noexcept -> double`;

      const parsed = parseSignature(sigCode);
      assert.ok(parsed);
      assert.strictEqual(parsed.isFunction, true);
      assert.strictEqual(parsed.name, 'scaled_sum');
      assert.strictEqual(parsed.returnType, 'double');
      assert.ok(parsed.badges.includes('noexcept'));
      assert.strictEqual(parsed.parameters.length, 2);
      assert.strictEqual(parsed.parameters[0].name, 'data');
      assert.strictEqual(parsed.parameters[0].type, 'const R&');
      assert.strictEqual(parsed.parameters[0].semantics, 'Read-Only (Const Ref)');
      assert.strictEqual(parsed.parameters[1].name, 'multiplier');
      assert.strictEqual(parsed.parameters[1].type, 'double');
      assert.strictEqual(parsed.parameters[1].semantics, 'By-Value (Primitive Copy)');
    });

    it('should parse virtual member functions with override and specifiers', () => {
      const sigCode = `virtual void render() const override`;
      const parsed = parseSignature(sigCode);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'render');
      assert.strictEqual(parsed.returnType, 'void');
      assert.ok(parsed.badges.includes('virtual'));
      assert.ok(parsed.badges.includes('override'));
      assert.strictEqual(parsed.parameters.length, 0);
    });

    it('should return null for non-callable constructs', () => {
      assert.strictEqual(parseSignature('int counter = 0;'), null);
    });
  });

  describe('parseDoxygen', () => {
    it('should extract brief, params, and returns from doxygen comment blocks', () => {
      const doc = `/**
 * @brief Computes the transformed sum of a range of numbers.
 * @param data Input range.
 * @param multiplier Scale factor applied to each element.
 * @return Scaled sum of all elements.
 */`;

      const parsed = parseDoxygen(doc);
      assert.strictEqual(parsed.brief, 'Computes the transformed sum of a range of numbers.');
      assert.strictEqual(parsed.params.get('data'), 'Input range.');
      assert.strictEqual(parsed.params.get('multiplier'), 'Scale factor applied to each element.');
      assert.strictEqual(parsed.returns, 'Scaled sum of all elements.');
    });
  });

  describe('HoverTransformer', () => {
    it('should enrich a raw function hover into a structured markdown card', () => {
      const rawCode = `\`\`\`cpp\ntemplate <typename T>\nauto process(const T& item, int mode) noexcept -> bool\n\`\`\``;
      const rawDoc = `@brief Executes operation.\n@param item The element to process.\n@return Success flag.`;

      const inputHover = new vscode.Hover([rawCode, rawDoc], new vscode.Range(0, 0, 0, 10));
      const transformed = HoverTransformer.transform(inputHover);

      assert.ok(transformed);
      assert.ok(transformed.contents.length > 0);

      const content = (transformed.contents[0] as vscode.MarkdownString).value;
      assert.ok(content.includes('### `process` *(function)*'));
      assert.ok(content.includes('`[noexcept]`'));
      assert.ok(content.includes('| Parameter | Type | Semantics | Description |'));
      assert.ok(content.includes('`item`'));
      assert.ok(content.includes('Read-Only (Const Ref)'));
      assert.ok(content.includes('The element to process.'));
      assert.ok(content.includes('**Returns**: `bool` - Success flag.'));
    });
  });
});
