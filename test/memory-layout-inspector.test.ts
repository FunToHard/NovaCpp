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

      const multiInfo = resolveTypeInfo('int[10][20]');
      assert.strictEqual(multiInfo.size, 800);
      assert.strictEqual(multiInfo.alignment, 4);
    });

    it('should support LLP64 data model for Windows MSVC (long=4, long double=8)', () => {
      assert.strictEqual(resolveTypeInfo('long', 'LLP64').size, 4);
      assert.strictEqual(resolveTypeInfo('long', 'LLP64').alignment, 4);
      assert.strictEqual(resolveTypeInfo('unsigned long', 'LLP64').size, 4);
      assert.strictEqual(resolveTypeInfo('long double', 'LLP64').size, 8);
      assert.strictEqual(resolveTypeInfo('long double', 'LLP64').alignment, 8);

      // Verify LP64 defaults
      assert.strictEqual(resolveTypeInfo('long', 'LP64').size, 8);
      assert.strictEqual(resolveTypeInfo('long double', 'LP64').size, 16);
    });
  });

  describe('calculateStructLayout', () => {
    it('should calculate struct layout using LLP64 data model for Windows MSVC', () => {
      const fields = [
        { type: 'char', name: 'a' },
        { type: 'long', name: 'b' }
      ];

      // On LP64 (POSIX): char (1) + 7 pad + long (8) = 16 bytes
      const lp64Layout = calculateStructLayout('StructWithLong', fields, { dataModel: 'LP64' });
      assert.strictEqual(lp64Layout.totalSize, 16);
      assert.strictEqual(lp64Layout.alignment, 8);
      assert.strictEqual(lp64Layout.paddingBytes, 7);

      // On LLP64 (MSVC): char (1) + 3 pad + long (4) = 8 bytes
      const llp64Layout = calculateStructLayout('StructWithLong', fields, { dataModel: 'LLP64' });
      assert.strictEqual(llp64Layout.totalSize, 8);
      assert.strictEqual(llp64Layout.alignment, 4);
      assert.strictEqual(llp64Layout.paddingBytes, 3);
    });
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

    it('should capture array dimensions on struct fields and calculate correct size', () => {
      const code = `
struct Buffer {
    char header[16];
    int values[10];
    double matrix[2][4];
};
`;
      const extracted = extractStructAtPosition(code, 15);
      assert.ok(extracted);
      assert.strictEqual(extracted?.name, 'Buffer');
      assert.strictEqual(extracted?.fields.length, 3);
      assert.strictEqual(extracted?.fields[0].type, 'char[16]');
      assert.strictEqual(extracted?.fields[1].type, 'int[10]');
      assert.strictEqual(extracted?.fields[2].type, 'double[2][4]');

      const layout = calculateStructLayout('Buffer', extracted.fields);
      // header: 16B (offset 0)
      // values: 40B (offset 16, alignment 4)
      // matrix: 64B (offset 56, alignment 8)
      // totalSize: 120B
      assert.strictEqual(layout.totalSize, 120);
    });

    it('should correctly scope #pragma pack to wrapped struct and preserve natural alignment on following structs', () => {
      const code = `
#pragma pack(push, 1)
struct PackedHeader {
    char flag;
    int payloadSize;
};
#pragma pack(pop)

struct StandardHeader {
    char flag;
    int payloadSize;
};
`;
      const packedOffset = code.indexOf('PackedHeader') + 2;
      const packed = extractStructAtPosition(code, packedOffset);
      assert.ok(packed);
      assert.strictEqual(packed?.name, 'PackedHeader');
      assert.strictEqual(packed?.isPacked, true);
      assert.strictEqual(packed?.maxPackAlignment, 1);
      const packedLayout = calculateStructLayout(packed.name, packed.fields, {
        isPacked: packed.isPacked,
        maxPackAlignment: packed.maxPackAlignment
      });
      assert.strictEqual(packedLayout.totalSize, 5); // 1 + 4 (no padding)

      const normalOffset = code.indexOf('StandardHeader') + 2;
      const normal = extractStructAtPosition(code, normalOffset);
      assert.ok(normal);
      assert.strictEqual(normal?.name, 'StandardHeader');
      assert.strictEqual(normal?.isPacked, false);
      const normalLayout = calculateStructLayout(normal.name, normal.fields, {
        isPacked: normal.isPacked,
        maxPackAlignment: normal.maxPackAlignment
      });
      assert.strictEqual(normalLayout.totalSize, 8); // 1 + 3 pad + 4
      assert.strictEqual(normalLayout.paddingBytes, 3);
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
