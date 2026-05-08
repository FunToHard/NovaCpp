import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  inferParameterSemantics,
  deuglifyIdentifier,
  cleanInstantiationArgs,
  tokenizeTopLevel,
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

  describe('deuglifyIdentifier', () => {
    it('should strip MSVC and GCC ugly identifier prefixes', () => {
      assert.strictEqual(deuglifyIdentifier('_Args'), 'args');
      assert.strictEqual(deuglifyIdentifier('_Ty'), 'T');
      assert.strictEqual(deuglifyIdentifier('_Type'), 'T');
      assert.strictEqual(deuglifyIdentifier('_Val'), 'value');
      assert.strictEqual(deuglifyIdentifier('__first'), 'first');
      assert.strictEqual(deuglifyIdentifier('_Pred'), 'pred');
      assert.strictEqual(deuglifyIdentifier('customParam'), 'customParam');
    });
  });

  describe('cleanInstantiationArgs', () => {
    it('should clean nested template packs and remove internal SFINAE constants', () => {
      const cleaned = cleanInstantiationArgs('geometry::Cube, <double>, 0');
      assert.deepStrictEqual(cleaned, ['geometry::Cube', 'double']);
    });
  });

  describe('tokenizeTopLevel', () => {
    it('should respect nested angle brackets and commas', () => {
      const tokens = tokenizeTopLevel('inline unique_ptr<geometry::Cube> make_unique<geometry::Cube, <double>, 0>');
      assert.strictEqual(tokens.length, 3);
      assert.strictEqual(tokens[0], 'inline');
      assert.strictEqual(tokens[1], 'unique_ptr<geometry::Cube>');
      assert.strictEqual(tokens[2], 'make_unique<geometry::Cube, <double>, 0>');
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

    it('should correctly parse Clangd STL template specialization without producing 0>', () => {
      const sigCode = `// In namespace std
template <>
inline unique_ptr<geometry::Cube>
make_unique<geometry::Cube, <double>, 0>(double &&_Args)`;

      const parsed = parseSignature(sigCode);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'make_unique');
      assert.notStrictEqual(parsed.name, '0>');
      assert.strictEqual(parsed.scope, 'std');
      assert.strictEqual(parsed.returnType, 'unique_ptr<geometry::Cube>');
      assert.strictEqual(parsed.isSpecialization, true);
      assert.deepStrictEqual(parsed.instantiationArgs, ['geometry::Cube', 'double']);
      assert.strictEqual(parsed.parameters.length, 1);
      assert.strictEqual(parsed.parameters[0].name, 'args');
      assert.strictEqual(parsed.parameters[0].type, 'double &&');
      assert.strictEqual(parsed.parameters[0].semantics, 'Move / Sink (Rvalue Ref)');
      assert.ok(parsed.badges.includes('inline'));
      assert.ok(parsed.badges.includes('Standard Library'));
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

    it('should enrich std::make_unique with curated STL knowledge, canonical signature, and instantiation info', () => {
      const rawCode = `\`\`\`cpp\n// In namespace std\ntemplate <>\ninline unique_ptr<geometry::Cube>\nmake_unique<geometry::Cube, <double>, 0>(double &&_Args)\n\`\`\``;

      const inputHover = new vscode.Hover([rawCode], new vscode.Range(0, 0, 0, 10));
      const transformed = HoverTransformer.transform(inputHover);

      assert.ok(transformed);
      assert.ok(transformed.contents.length > 0);

      const content = (transformed.contents[0] as vscode.MarkdownString).value;
      // Must not contain the broken 0>
      assert.ok(!content.includes('### `0>`'));
      // Must contain curated std::make_unique
      assert.ok(content.includes('### `std::make_unique` *(Standard Library)*'));
      assert.ok(content.includes('`[<memory>]`'));
      assert.ok(content.includes('`[C++14]`'));
      assert.ok(content.includes('`[Standard Library]`'));
      assert.ok(content.includes('> **Instantiated for**: `T = geometry::Cube, Args = [double]`'));
      assert.ok(content.includes('Constructs an object of type `T` on the heap'));
      assert.ok(content.includes('`args`'));
      assert.ok(content.includes('Move / Sink (Rvalue Ref)'));
      assert.ok(content.includes('Arguments forwarded to the constructor of `T`'));
      assert.ok(content.includes('**Returns**: `unique_ptr<geometry::Cube>`'));
      assert.ok(content.includes('https://en.cppreference.com/w/cpp/memory/unique_ptr/make_unique'));
    });

    it('should enrich container member functions using class scope hint', () => {
      const rawCode = `\`\`\`cpp\n// In class std::vector<int>\nvoid push_back(const int &_Val)\n\`\`\``;

      const inputHover = new vscode.Hover([rawCode], new vscode.Range(0, 0, 0, 10));
      const transformed = HoverTransformer.transform(inputHover);

      assert.ok(transformed);
      const content = (transformed.contents[0] as vscode.MarkdownString).value;
      assert.ok(content.includes('### `std::vector::push_back` *(Standard Library)*'));
      assert.ok(content.includes('`[<vector>]`'));
      assert.ok(content.includes('Appends the given element'));
      assert.ok(content.includes('`value`'));
    });
  });
});
