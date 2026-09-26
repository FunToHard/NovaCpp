import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import {
  TypedefProvider,
  parseTypedefCodeBlock,
  lookupTypedef,
  formatTypedefHover,
  formatUserTypedefHover,
  TYPEDEF_KNOWLEDGE_BASE
} from '../src/intelligence/typedef-provider';
import { HoverTransformer } from '../src/intelligence/hover-transformer';
import { createClangdMiddleware } from '../src/substrate/protocol-filter';
import { mockVscode } from './vscode-mock';

describe('Typedef & Type Alias Intelligence Hover Provider', () => {
  describe('parseTypedefCodeBlock', () => {
    it('should parse standard C typedef statements', () => {
      const parsed = parseTypedefCodeBlock('typedef unsigned long long uint64_t;');
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'uint64_t');
      assert.strictEqual(parsed.underlyingType, 'unsigned long long');
      assert.strictEqual(parsed.isTypedef, true);
    });

    it('should parse Windows struct pointer handles (HWND, HDC)', () => {
      const parsed = parseTypedefCodeBlock('typedef struct HWND__ *HWND;');
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'HWND');
      assert.strictEqual(parsed.underlyingType, 'struct HWND__*');
    });

    it('should parse generic pointer typedefs (HANDLE)', () => {
      const parsed = parseTypedefCodeBlock('typedef void *HANDLE;');
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'HANDLE');
      assert.strictEqual(parsed.underlyingType, 'void*');
    });

    it('should parse C++11 using type aliases', () => {
      const parsed = parseTypedefCodeBlock('using uint64_t = unsigned long long;');
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'uint64_t');
      assert.strictEqual(parsed.underlyingType, 'unsigned long long');
    });

    it('should parse using aliases with scoped namespace qualifiers', () => {
      const parsed = parseTypedefCodeBlock('using std::size_t = unsigned __int64;');
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'size_t');
      assert.strictEqual(parsed.underlyingType, 'unsigned __int64');
    });

    it('should parse function pointer typedefs', () => {
      const parsed = parseTypedefCodeBlock('typedef void (*SignalHandler)(int, void*);');
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'SignalHandler');
      assert.strictEqual(parsed.underlyingType, 'void (*)(int, void*)');
    });

    it('should ignore preceding comments from Clangd code blocks', () => {
      const code = '// In namespace std\ntypedef unsigned long long uint64_t;';
      const parsed = parseTypedefCodeBlock(code);
      assert.ok(parsed);
      assert.strictEqual(parsed.name, 'uint64_t');
      assert.strictEqual(parsed.underlyingType, 'unsigned long long');
    });

    it('should return null for non-typedef code blocks', () => {
      assert.strictEqual(parseTypedefCodeBlock('void calculate(int x);'), null);
      assert.strictEqual(parseTypedefCodeBlock('class Window {};'), null);
      assert.strictEqual(parseTypedefCodeBlock('int count = 10;'), null);
    });
  });

  describe('lookupTypedef', () => {
    it('should retrieve Windows HWND with window handle description and headers', () => {
      const hwnd = lookupTypedef('HWND');
      assert.ok(hwnd);
      assert.strictEqual(hwnd.name, 'HWND');
      assert.strictEqual(hwnd.category, 'win32');
      assert.strictEqual(hwnd.categoryLabel, 'Win32 Window Handle');
      assert.ok(hwnd.header.includes('<windows.h>'));
      assert.ok(hwnd.summary.toLowerCase().includes('window'));
      assert.ok(hwnd.summary.includes('CreateWindowEx'));
      assert.strictEqual(hwnd.invalidValue, 'NULL / nullptr');
    });

    it('should retrieve Windows HANDLE with kernel object handle details', () => {
      const handle = lookupTypedef('HANDLE');
      assert.ok(handle);
      assert.strictEqual(handle.name, 'HANDLE');
      assert.strictEqual(handle.underlyingType, 'void*');
      assert.ok(handle.summary.includes('kernel object'));
      assert.ok(handle.summary.includes('CloseHandle'));
    });

    it('should retrieve uint64_t with 64-bit width and exact value range', () => {
      const u64 = lookupTypedef('uint64_t');
      assert.ok(u64);
      assert.strictEqual(u64.name, 'uint64_t');
      assert.strictEqual(u64.category, 'cstdint');
      assert.strictEqual(u64.bitWidth, 64);
      assert.strictEqual(u64.byteSize, '8 bytes');
      assert.ok(u64.valueRange?.includes('18,446,744,073,709,551,615'));
      assert.ok(u64.formatSpecifier?.includes('PRIu64'));
    });

    it('should retrieve signed integers int32_t and int64_t with two\'s complement ranges', () => {
      const i32 = lookupTypedef('int32_t');
      assert.ok(i32);
      assert.strictEqual(i32.bitWidth, 32);
      assert.ok(i32.valueRange?.includes('-2,147,483,648'));

      const i64 = lookupTypedef('int64_t');
      assert.ok(i64);
      assert.strictEqual(i64.bitWidth, 64);
      assert.ok(i64.valueRange?.includes('-9,223,372,036,854,775,808'));
    });

    it('should retrieve standard memory types size_t and ptrdiff_t', () => {
      const sizeT = lookupTypedef('size_t');
      assert.ok(sizeT);
      assert.strictEqual(sizeT.category, 'cstddef');
      assert.ok(sizeT.summary.includes('sizeof'));

      const ptrdiffT = lookupTypedef('ptrdiff_t');
      assert.ok(ptrdiffT);
      assert.ok(ptrdiffT.summary.includes('subtracting'));
    });

    it('should normalize std:: prefixed type queries', () => {
      const fromStd = lookupTypedef('std::uint64_t');
      assert.ok(fromStd);
      assert.strictEqual(fromStd.name, 'uint64_t');

      const sizeFromStd = lookupTypedef('std::size_t');
      assert.ok(sizeFromStd);
      assert.strictEqual(sizeFromStd.name, 'size_t');
    });

    it('should retrieve Win32 primitive types DWORD, WORD, BYTE, BOOL', () => {
      const dword = lookupTypedef('DWORD');
      assert.ok(dword);
      assert.strictEqual(dword.bitWidth, 32);
      assert.strictEqual(dword.underlyingType, 'unsigned long');

      const word = lookupTypedef('WORD');
      assert.ok(word);
      assert.strictEqual(word.bitWidth, 16);

      const byte = lookupTypedef('BYTE');
      assert.ok(byte);
      assert.strictEqual(byte.bitWidth, 8);

      const winBool = lookupTypedef('BOOL');
      assert.ok(winBool);
      assert.strictEqual(winBool.byteSize, '4 bytes');
    });

    it('should retrieve POSIX types pid_t and ssize_t', () => {
      const pid = lookupTypedef('pid_t');
      assert.ok(pid);
      assert.strictEqual(pid.category, 'posix');
      assert.ok(pid.summary.includes('process identifier'));

      const ssize = lookupTypedef('ssize_t');
      assert.ok(ssize);
      assert.ok(ssize.summary.includes('-1'));
    });

    it('should return null for un-cataloged identifiers', () => {
      assert.strictEqual(lookupTypedef('MyCustomType123'), null);
      assert.strictEqual(lookupTypedef(''), null);
    });
  });

  describe('TypedefProvider.provideTypedefHover', () => {
    it('should provide hover for HWND by hovered word', () => {
      const hover = TypedefProvider.provideTypedefHover('typedef struct HWND__ *HWND;', 'HWND');
      assert.ok(hover);
      const md = (hover.contents as any).value || (hover.contents[0] as any).value;
      assert.ok(md.includes('### `HWND`'));
      assert.ok(md.includes('Win32 Window Handle'));
    });

    it('should provide hover for uint64_t by code block parsing', () => {
      const hover = TypedefProvider.provideTypedefHover('typedef unsigned long long uint64_t;');
      assert.ok(hover);
      const md = (hover.contents as any).value || (hover.contents[0] as any).value;
      assert.ok(md.includes('### `uint64_t`'));
      assert.ok(md.includes('64-bit unsigned integer'));
    });

    it('should return null for non-typedef code blocks', () => {
      assert.strictEqual(TypedefProvider.provideTypedefHover('int x = 42;'), null);
    });
  });

  describe('Hover Formatting (formatTypedefHover)', () => {
    it('should format rich markdown hover card for HWND with all details and no emojis', () => {
      const hwndInfo = TYPEDEF_KNOWLEDGE_BASE['HWND'];
      const hover = formatTypedefHover(hwndInfo, 'typedef struct HWND__ *HWND;');
      const md = (hover.contents as any).value || (hover.contents[0] as any).value;

      assert.ok(md.includes('### `HWND` *(Type Alias / Win32 Window Handle)*'));
      assert.ok(md.includes('**Category**: `[Win32 Window Handle]` `[<windows.h> / <windef.h>]`'));
      assert.ok(md.includes('typedef struct HWND__ *HWND;'));
      assert.ok(md.includes('Handle to a window or GUI control'));
      assert.ok(md.includes('- **Underlying Type**: `struct HWND__*`'));
      assert.ok(md.includes('- **Memory Size**: 4 bytes (x86) / 8 bytes (x64)'));
      assert.ok(md.includes('- **Invalid / Sentinel Value**: `NULL / nullptr`'));
      assert.ok(md.includes('[Switch Header/Source]'));
      assert.ok(md.includes('[Find References]'));

      // Strict No Emojis check
      const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u;
      assert.strictEqual(emojiRegex.test(md), false, 'Emojis detected in HWND hover');
    });

    it('should format rich markdown hover card for uint64_t with bit width and range', () => {
      const u64Info = TYPEDEF_KNOWLEDGE_BASE['uint64_t'];
      const hover = formatTypedefHover(u64Info, 'typedef unsigned long long uint64_t;');
      const md = (hover.contents as any).value || (hover.contents[0] as any).value;

      assert.ok(md.includes('### `uint64_t` *(Type Alias / Fixed-Width Integer)*'));
      assert.ok(md.includes('**Category**: `[Fixed-Width Integer]` `[<cstdint>]` `[C++11 / C99]`'));
      assert.ok(md.includes('- **Underlying Type**: `unsigned long long`'));
      assert.ok(md.includes('- **Bit Width**: 64 bits (8 bytes)'));
      assert.ok(md.includes('- **Value Range**: `0 to 18,446,744,073,709,551,615 (2^64 - 1)`'));
      assert.ok(md.includes('- **Format Specifier**: `PRIu64 (%llu)`'));
      assert.ok(md.includes('https://en.cppreference.com/w/cpp/types/integer'));
    });

    it('should format clean user-defined typedef card', () => {
      const hover = formatUserTypedefHover(
        'Velocity',
        'double',
        'typedef double Velocity;'
      );
      const md = (hover.contents as any).value || (hover.contents[0] as any).value;

      assert.ok(md.includes('### `Velocity` *(Type Alias)*'));
      assert.ok(md.includes('typedef double Velocity;'));
      assert.ok(md.includes('- **Underlying Type**: `double`'));
      assert.ok(md.includes('[Find References]'));
    });
  });

  describe('HoverTransformer Integration', () => {
    it('should enrich hover when hovering on HWND typedef code block', async () => {
      const rawHover = new mockVscode.Hover([
        new mockVscode.MarkdownString('```cpp\ntypedef struct HWND__ *HWND;\n```')
      ]);

      const result = await HoverTransformer.transformAsync(rawHover, 'HWND');
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### `HWND` *(Type Alias / Win32 Window Handle)*'));
      assert.ok(md.includes('Win32 window manager'));
      assert.ok(md.includes('<windows.h>'));
    });

    it('should enrich hover when hovering on uint64_t typedef code block', async () => {
      const rawHover = new mockVscode.Hover([
        new mockVscode.MarkdownString('```cpp\ntypedef unsigned long long uint64_t;\n```')
      ]);

      const result = await HoverTransformer.transformAsync(rawHover, 'uint64_t');
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### `uint64_t` *(Type Alias / Fixed-Width Integer)*'));
      assert.ok(md.includes('64-bit unsigned integer'));
      assert.ok(md.includes('18,446,744,073,709,551,615'));
    });

    it('should enrich hover when hovering on DWORD typedef code block', async () => {
      const rawHover = new mockVscode.Hover([
        new mockVscode.MarkdownString('```cpp\ntypedef unsigned long DWORD;\n```')
      ]);

      const result = await HoverTransformer.transformAsync(rawHover, 'DWORD');
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### `DWORD` *(Type Alias / Win32 Primitive Type)*'));
      assert.ok(md.includes('32-bit unsigned integer'));
    });

    it('should enrich hover when hovering on size_t type alias code block', async () => {
      const rawHover = new mockVscode.Hover([
        new mockVscode.MarkdownString('```cpp\nusing size_t = unsigned __int64;\n```')
      ]);

      const result = await HoverTransformer.transformAsync(rawHover, 'size_t');
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### `size_t` *(Type Alias / Object Size Type)*'));
      assert.ok(md.includes('sizeof'));
    });

    it('should format user-defined typedefs cleanly when not in curated catalog', async () => {
      const rawHover = new mockVscode.Hover([
        new mockVscode.MarkdownString('```cpp\ntypedef double Radians;\n```')
      ]);

      const result = await HoverTransformer.transformAsync(rawHover, 'Radians');
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### `Radians` *(Type Alias)*'));
      assert.ok(md.includes('- **Underlying Type**: `double`'));
    });
  });

  describe('Protocol Filter Middleware End-to-End Interception', () => {
    it('should return rich HWND description when hovering on HWND in editor', async () => {
      const middleware = createClangdMiddleware();
      assert.ok(middleware.provideHover);

      const mockDoc: any = {
        lineAt: (_line: number) => ({ text: 'HWND hwnd = nullptr;' }),
        getWordRangeAtPosition: (_pos: any) => new mockVscode.Range(0, 0, 0, 4),
        getText: (_range: any) => 'HWND',
        uri: vscode.Uri.file('/workspace/app.cpp')
      };
      const mockPos = new mockVscode.Position(0, 2);
      const mockToken = {} as any;

      const mockNext = async () => {
        return new mockVscode.Hover([
          new mockVscode.MarkdownString('```cpp\ntypedef struct HWND__ *HWND;\n```')
        ]);
      };

      const result = await middleware.provideHover!(mockDoc, mockPos, mockToken, mockNext);
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### `HWND` *(Type Alias / Win32 Window Handle)*'));
      assert.ok(md.includes('Handle to a window or GUI control'));
      assert.ok(md.includes('<windows.h>'));
    });

    it('should return 64-bit description when hovering on uint64_t in editor', async () => {
      const middleware = createClangdMiddleware();
      assert.ok(middleware.provideHover);

      const mockDoc: any = {
        lineAt: (_line: number) => ({ text: 'uint64_t timestamp = 0;' }),
        getWordRangeAtPosition: (_pos: any) => new mockVscode.Range(0, 0, 0, 8),
        getText: (_range: any) => 'uint64_t',
        uri: vscode.Uri.file('/workspace/app.cpp')
      };
      const mockPos = new mockVscode.Position(0, 3);
      const mockToken = {} as any;

      const mockNext = async () => {
        return new mockVscode.Hover([
          new mockVscode.MarkdownString('```cpp\ntypedef unsigned long long uint64_t;\n```')
        ]);
      };

      const result = await middleware.provideHover!(mockDoc, mockPos, mockToken, mockNext);
      assert.ok(result);
      const md = (result.contents as any).value || (result.contents[0] as any).value;

      assert.ok(md.includes('### `uint64_t` *(Type Alias / Fixed-Width Integer)*'));
      assert.ok(md.includes('64-bit unsigned integer'));
      assert.ok(md.includes('18,446,744,073,709,551,615'));
    });
  });
});
