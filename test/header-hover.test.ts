import './vscode-mock';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import {
  HeaderHoverProvider,
  parseIncludeLine,
  extractPathFromClangdHover,
  parseLocalHeaderFile,
  resolveLocalHeaderPath,
  formatStandardHeaderHover,
  formatLocalHeaderHover
} from '../src/intelligence/header-hover-provider';
import { createClangdMiddleware } from '../src/substrate/protocol-filter';
import { mockVscode } from './vscode-mock';

describe('Header Include Rich Hover Provider', () => {
  describe('parseIncludeLine', () => {
    it('should parse standard header include directives', () => {
      const parsed = parseIncludeLine('#include <vector>', 0, 5);
      assert.ok(parsed);
      assert.strictEqual(parsed.isStandard, true);
      assert.strictEqual(parsed.headerName, 'vector');
      assert.strictEqual(parsed.headerText, '<vector>');
      assert.strictEqual(parsed.range.start.line, 0);
      assert.strictEqual(parsed.range.start.character, 0);
      assert.strictEqual(parsed.range.end.character, 17);
    });

    it('should parse include directives with arbitrary whitespace', () => {
      const parsed = parseIncludeLine('   #   include   <cmath>   ', 2);
      assert.ok(parsed);
      assert.strictEqual(parsed.isStandard, true);
      assert.strictEqual(parsed.headerName, 'cmath');
      assert.strictEqual(parsed.headerText, '<cmath>');
      assert.strictEqual(parsed.range.start.line, 2);
    });

    it('should parse local project header include directives with quotes', () => {
      const parsed = parseIncludeLine('#include "engine/mesh.h"', 1, 10);
      assert.ok(parsed);
      assert.strictEqual(parsed.isStandard, false);
      assert.strictEqual(parsed.headerName, 'engine/mesh.h');
      assert.strictEqual(parsed.headerText, '"engine/mesh.h"');
    });

    it('should return null for non-include lines', () => {
      assert.strictEqual(parseIncludeLine('int x = 42;'), null);
      assert.strictEqual(parseIncludeLine('// #include <vector>'), null);
      assert.strictEqual(parseIncludeLine('/* #include <string> */'), null);
      assert.strictEqual(parseIncludeLine('#define FOO 1'), null);
    });

    it('should return null if hover cursor position is outside the include directive', () => {
      const line = '#include <vector>';
      const parsed = parseIncludeLine(line, 0, 50);
      assert.strictEqual(parsed, null);
    });
  });

  describe('extractPathFromClangdHover', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-header-hover-'));
    const dummyHeader = path.join(tempDir, 'dummy.h');

    before(() => {
      fs.writeFileSync(dummyHeader, 'int foo();\n');
    });

    after(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Cleanup
      }
    });

    it('should extract resolved file path from Clangd hover content', () => {
      const hover: any = {
        contents: [
          new mockVscode.MarkdownString(`dummy.h\n\n${dummyHeader}`)
        ]
      };
      const extracted = extractPathFromClangdHover(hover);
      assert.ok(extracted);
      assert.strictEqual(path.normalize(extracted), path.normalize(dummyHeader));
    });

    it('should return undefined if hover contents contain no valid file path', () => {
      const hover: any = {
        contents: [
          new mockVscode.MarkdownString('dummy.h\n\nNo such file exists anywhere')
        ]
      };
      assert.strictEqual(extractPathFromClangdHover(hover), undefined);
    });

    it('should handle empty or null hovers safely', () => {
      assert.strictEqual(extractPathFromClangdHover(null as any), undefined);
      assert.strictEqual(extractPathFromClangdHover({ contents: [] } as any), undefined);
    });
  });

  describe('parseLocalHeaderFile & resolveLocalHeaderPath', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-local-header-'));
    const headerPath = path.join(tempDir, 'geometry.h');

    before(() => {
      const headerCode = `
#pragma once

// Forward declarations and classes
class Shape3D {
public:
    virtual double volume() const = 0;
};

struct Point3D {
    double x;
    double y;
    double z;
};

concept Transformable = requires(T a) {
    a.transform();
};

enum class ColorMode {
    RGB,
    RGBA
};

// Functions
double calculateBoundingBox(const Point3D& min, const Point3D& max);
void renderMesh(const Shape3D& shape, ColorMode mode);
`;
      fs.writeFileSync(headerPath, headerCode);
    });

    after(() => {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {
        // Cleanup
      }
    });

    it('should statically parse classes, structs, concepts, enums, and functions from local header', () => {
      const symbols = parseLocalHeaderFile(headerPath);
      assert.ok(symbols.length >= 5);

      const names = symbols.map((s) => s.name);
      assert.ok(names.includes('Shape3D'), 'Missing Shape3D class');
      assert.ok(names.includes('Point3D'), 'Missing Point3D struct');
      assert.ok(names.includes('Transformable'), 'Missing Transformable concept');
      assert.ok(names.includes('ColorMode'), 'Missing ColorMode enum');
      assert.ok(names.includes('calculateBoundingBox'), 'Missing calculateBoundingBox function');
      assert.ok(names.includes('renderMesh'), 'Missing renderMesh function');
    });

    it('should resolve local header relative to document directory', () => {
      const docUri = vscode.Uri.file(path.join(tempDir, 'main.cpp'));
      const resolved = resolveLocalHeaderPath('geometry.h', docUri);
      assert.ok(resolved);
      assert.strictEqual(path.normalize(resolved), path.normalize(headerPath));
    });

    it('should return undefined when local header cannot be located', () => {
      const docUri = vscode.Uri.file(path.join(tempDir, 'main.cpp'));
      const resolved = resolveLocalHeaderPath('non_existent_file_xyz.h', docUri);
      assert.strictEqual(resolved, undefined);
    });
  });

  describe('formatStandardHeaderHover', () => {
    it('should generate hover card for <vector> listing functions and primary types', () => {
      const hover = HeaderHoverProvider.provideHeaderHover(
        { uri: vscode.Uri.file('/src/main.cpp') } as any,
        new mockVscode.Position(0, 0),
        {
          headerName: 'vector',
          headerText: '<vector>',
          isStandard: true,
          range: new mockVscode.Range(0, 0, 0, 17)
        }
      );

      return hover.then((result) => {
        assert.ok(result);
        const md = (result.contents as any).value || (result.contents[0] as any).value;
        assert.ok(md.includes('### Header `<vector>` *(C++ Standard Library)*'));
        assert.ok(md.includes('Sequence container that encapsulates dynamic size contiguous arrays'));
        assert.ok(md.includes('#### Primary Types'));
        assert.ok(md.includes('`std::vector`'));
        assert.ok(md.includes('#### Available Functions'));
        assert.ok(md.includes('`push_back`'));
        assert.ok(md.includes('`emplace_back`'));
        assert.ok(md.includes('https://en.cppreference.com/w/cpp/container/vector'));
      });
    });

    it('should generate hover card for <cmath> listing math functions', () => {
      const hover = HeaderHoverProvider.provideHeaderHover(
        { uri: vscode.Uri.file('/src/main.cpp') } as any,
        new mockVscode.Position(0, 0),
        {
          headerName: 'cmath',
          headerText: '<cmath>',
          isStandard: true,
          range: new mockVscode.Range(0, 0, 0, 16)
        }
      );

      return hover.then((result) => {
        assert.ok(result);
        const md = (result.contents as any).value || (result.contents[0] as any).value;
        assert.ok(md.includes('### Header `<cmath>` *(C++ Standard Library)*'));
        assert.ok(md.includes('Common mathematical operations'));
        assert.ok(md.includes('#### Available Functions'));
        assert.ok(md.includes('`sqrt`'));
        assert.ok(md.includes('`pow`'));
        assert.ok(md.includes('`abs`'));
      });
    });

    it('should generate hover card for <algorithm> listing algorithms', () => {
      const hover = HeaderHoverProvider.provideHeaderHover(
        { uri: vscode.Uri.file('/src/main.cpp') } as any,
        new mockVscode.Position(0, 0),
        {
          headerName: 'algorithm',
          headerText: '<algorithm>',
          isStandard: true,
          range: new mockVscode.Range(0, 0, 0, 20)
        }
      );

      return hover.then((result) => {
        assert.ok(result);
        const md = (result.contents as any).value || (result.contents[0] as any).value;
        assert.ok(md.includes('### Header `<algorithm>` *(C++ Standard Library)*'));
        assert.ok(md.includes('#### Available Functions'));
        assert.ok(md.includes('`sort`'));
        assert.ok(md.includes('`find`'));
        assert.ok(md.includes('`transform`'));
      });
    });

    it('should generate hover card for <iostream> listing I/O objects and functions', () => {
      const hover = HeaderHoverProvider.provideHeaderHover(
        { uri: vscode.Uri.file('/src/main.cpp') } as any,
        new mockVscode.Position(0, 0),
        {
          headerName: 'iostream',
          headerText: '<iostream>',
          isStandard: true,
          range: new mockVscode.Range(0, 0, 0, 19)
        }
      );

      return hover.then((result) => {
        assert.ok(result);
        const md = (result.contents as any).value || (result.contents[0] as any).value;
        assert.ok(md.includes('### Header `<iostream>` *(C++ Standard Library)*'));
        assert.ok(md.includes('`cout`'));
        assert.ok(md.includes('`cin`'));
      });
    });

    it('should display resolved file path when provided', () => {
      const hover = formatStandardHeaderHover(
        'vector',
        [],
        'C:/MSVC/include/vector'
      );
      const md = (hover.contents as any).value || (hover.contents[0] as any).value;
      assert.ok(md.includes('**Resolved Path**: `C:/MSVC/include/vector`'));
    });
  });

  describe('formatLocalHeaderHover', () => {
    it('should format project header hover card with declared symbols', () => {
      const symbols = [
        { name: 'Matrix4', kind: 'class' as const },
        { name: 'Vector3', kind: 'struct' as const },
        { name: 'multiply', kind: 'function' as const, signature: 'Matrix4 multiply(const Matrix4& a, const Matrix4& b);' }
      ];
      const hover = formatLocalHeaderHover('math/matrix.h', symbols, '/workspace/math/matrix.h');
      const md = (hover.contents as any).value || (hover.contents[0] as any).value;

      assert.ok(md.includes('### Header `"math/matrix.h"` *(Project Header)*'));
      assert.ok(md.includes('**Path**: `/workspace/math/matrix.h`'));
      assert.ok(md.includes('`Matrix4`'));
      assert.ok(md.includes('`Vector3`'));
      assert.ok(md.includes('`multiply`'));
      assert.ok(md.includes('[Switch Header/Source]'));
    });
  });

  describe('Language Server Protocol Filter Integration', () => {
    it('should intercept hover on #include <vector> line and return rich functions list', async () => {
      const middleware = createClangdMiddleware();
      assert.ok(middleware.provideHover);

      const mockDoc: any = {
        lineAt: (_line: number) => ({ text: '#include <vector>' }),
        uri: vscode.Uri.file('/workspace/src/app.cpp')
      };
      const mockPos = new mockVscode.Position(0, 10);
      const mockToken = {} as any;

      // Mock Clangd language server returning default bare hover
      const mockNext = async () => {
        return new mockVscode.Hover([
          new mockVscode.MarkdownString('vector\n\nC:/MSVC/include/vector')
        ]);
      };

      const result = await middleware.provideHover!(mockDoc, mockPos, mockToken, mockNext);
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### Header `<vector>` *(C++ Standard Library)*'));
      assert.ok(md.includes('Available Functions'));
      assert.ok(md.includes('`push_back`'));
      assert.ok(md.includes('`emplace_back`'));
    });

    it('should bypass include hover on non-include lines and fall through to standard hover transformer', async () => {
      const middleware = createClangdMiddleware();
      const mockDoc: any = {
        lineAt: (_line: number) => ({ text: 'int computeAnswer() {' }),
        uri: vscode.Uri.file('/workspace/src/app.cpp')
      };
      const mockPos = new mockVscode.Position(0, 4);
      const mockToken = {} as any;

      const mockNext = async () => {
        return new mockVscode.Hover([
          new mockVscode.MarkdownString('```cpp\nint computeAnswer();\n```')
        ]);
      };

      const result = await middleware.provideHover!(mockDoc, mockPos, mockToken, mockNext);
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;
      assert.ok(md.includes('computeAnswer'));
      assert.ok(!md.includes('C++ Standard Library'));
    });
  });
});
