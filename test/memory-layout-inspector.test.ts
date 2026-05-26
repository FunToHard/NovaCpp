import './vscode-mock';
import * as assert from 'assert';
import {
  resolveTypeInfo,
  calculateStructLayout,
  generateLayoutAsciiDiagram,
  generateLayoutMarkdown,
  extractStructAtPosition
} from '../src/inspector/memory-layout-inspector';

describe('Type & Memory Layout Inspector', () => {
  describe('resolveTypeInfo', () => {
    it('should resolve standard primitive types', () => {
      assert.strictEqual(resolveTypeInfo('bool').size, 1);
      assert.strictEqual(resolveTypeInfo('int').size, 4);
      assert.strictEqual(resolveTypeInfo('double').size, 8);
      assert.strictEqual(resolveTypeInfo('double').alignment, 8);
      assert.strictEqual(resolveTypeInfo('uint64_t').size, 8);
    });

    it('should resolve pointer types to 8 bytes on 64-bit systems', () => {
      assert.strictEqual(resolveTypeInfo('char*').size, 8);
      assert.strictEqual(resolveTypeInfo('void*').size, 8);
      assert.strictEqual(resolveTypeInfo('MyClass*').size, 8);
      assert.strictEqual(resolveTypeInfo('const int&').size, 8);
    });

    it('should resolve fixed array types', () => {
      const arrInfo = resolveTypeInfo('int[4]');
      assert.strictEqual(arrInfo.size, 16);
      assert.strictEqual(arrInfo.alignment, 4);
    });
  });

  describe('calculateStructLayout', () => {
    it('should correctly calculate padding for unaligned fields', () => {
      // struct BadOrder { char a; double b; int c; };
      // a: 1 byte at 0
      // padding: 7 bytes at 1 -> offset 8
      // b: 8 bytes at 8 -> offset 16
      // c: 4 bytes at 16 -> offset 20
      // tail padding: 4 bytes -> offset 24
      const fields = [
        { type: 'char', name: 'a' },
        { type: 'double', name: 'b' },
        { type: 'int', name: 'c' }
      ];

      const layout = calculateStructLayout('BadOrder', fields);
      assert.strictEqual(layout.totalSize, 24);
      assert.strictEqual(layout.alignment, 8);
      assert.strictEqual(layout.paddingBytes, 11); // 7 pad + 4 tail pad
      assert.strictEqual(layout.cacheLines, 1);
      assert.ok(layout.recommendation, 'Should provide optimization recommendation');
      assert.strictEqual(layout.optimizedSize, 16); // Reordered: double (8) + int (4) + char (1) + 3 pad = 16
    });

    it('should handle packed structs with 0 padding', () => {
      const fields = [
        { type: 'char', name: 'a' },
        { type: 'double', name: 'b' },
        { type: 'int', name: 'c' }
      ];

      const layout = calculateStructLayout('PackedStruct', fields, { isPacked: true });
      assert.strictEqual(layout.totalSize, 13); // 1 + 8 + 4
      assert.strictEqual(layout.alignment, 1);
      assert.strictEqual(layout.paddingBytes, 0);
    });

    it('should calculate cache-lines for structures over 64 bytes', () => {
      const fields = [
        { type: 'double[10]', name: 'data' } // 80 bytes
      ];

      const layout = calculateStructLayout('LargeBuffer', fields);
      assert.strictEqual(layout.totalSize, 80);
      assert.strictEqual(layout.cacheLines, 2); // 80 bytes spans 2 64-byte cache lines
    });
  });

  describe('extractStructAtPosition', () => {
    it('should extract struct definition around cursor offset', () => {
      const code = `
#include <iostream>

struct Particle {
    float x;
    float y;
    float z;
    double mass;
};

int main() { return 0; }
`;
      const offset = code.indexOf('float y;');
      const extracted = extractStructAtPosition(code, offset);

      assert.ok(extracted);
      assert.strictEqual(extracted?.name, 'Particle');
      assert.strictEqual(extracted?.fields.length, 4);
      assert.strictEqual(extracted?.fields[0].name, 'x');
      assert.strictEqual(extracted?.fields[3].name, 'mass');
    });

    it('should return null when cursor is outside struct definition', () => {
      const code = `
struct Foo { int a; };
int x = 42;
`;
      const offset = code.indexOf('int x');
      const extracted = extractStructAtPosition(code, offset);
      assert.strictEqual(extracted, null);
    });
  });

  describe('generateLayoutAsciiDiagram and Markdown', () => {
    it('should render ascii diagram with field offsets and padding', () => {
      const fields = [
        { type: 'char', name: 'c' },
        { type: 'int', name: 'i' }
      ];
      const layout = calculateStructLayout('Simple', fields);
      const diagram = generateLayoutAsciiDiagram(layout);

      assert.ok(diagram.includes('Simple'));
      assert.ok(diagram.includes('░░ PAD (3 bytes)'));
      assert.ok(diagram.includes('■ c'));
      assert.ok(diagram.includes('■ i'));
    });

    it('should generate markdown card with cache line and warning indicators', () => {
      const fields = [
        { type: 'char', name: 'c' },
        { type: 'int', name: 'i' }
      ];
      const layout = calculateStructLayout('Simple', fields);
      const md = generateLayoutMarkdown(layout);

      assert.ok(md.value.includes('### 📐 Memory Layout: `Simple`'));
      assert.ok(md.value.includes('Offset'));
    });
  });
});
