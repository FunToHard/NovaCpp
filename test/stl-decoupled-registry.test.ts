import './vscode-mock';
import * as assert from 'assert';
import {
  findStlDocumentation,
  getStlEntriesByHeader,
  registerStlModule,
  stlRegistry,
  StlHeaderModule
} from '../src/intelligence/stl-knowledge-base';

describe('Decoupled STL & C-Standard Library Knowledge Base', () => {
  it('should look up ISO C++ standard symbols from decoupled modules', () => {
    const makeUnique = findStlDocumentation('std::make_unique');
    assert.ok(makeUnique);
    assert.strictEqual(makeUnique.header, '<memory>');
    assert.strictEqual(makeUnique.standard, 'C++14');
    assert.ok(makeUnique.complexity?.time);

    const vecPush = findStlDocumentation('push_back', 'std::vector<int>');
    assert.ok(vecPush);
    assert.strictEqual(vecPush.symbol, 'std::vector::push_back');
    assert.strictEqual(vecPush.header, '<vector>');
  });

  it('should look up C Standard Library symbols under cstd headers with both std:: and bare names', () => {
    // Math functions (<cmath> / <math.h>)
    const sqrtPrefixed = findStlDocumentation('std::sqrt');
    const sqrtBare = findStlDocumentation('sqrt');
    assert.ok(sqrtPrefixed);
    assert.ok(sqrtBare);
    assert.strictEqual(sqrtPrefixed.symbol, 'std::sqrt');
    assert.strictEqual(sqrtBare.symbol, 'std::sqrt');
    assert.strictEqual(sqrtPrefixed.header, '<cmath>');

    // Memory functions (<cstring> / <string.h>)
    const memcpyPrefixed = findStlDocumentation('std::memcpy');
    const memcpyBare = findStlDocumentation('memcpy');
    assert.ok(memcpyPrefixed);
    assert.ok(memcpyBare);
    assert.strictEqual(memcpyPrefixed.header, '<cstring>');

    // I/O functions (<cstdio> / <stdio.h>)
    const printfDoc = findStlDocumentation('printf');
    assert.ok(printfDoc);
    assert.strictEqual(printfDoc.symbol, 'std::printf');
    assert.strictEqual(printfDoc.header, '<cstdio>');

    // Heap allocation (<cstdlib> / <stdlib.h>)
    const mallocDoc = findStlDocumentation('malloc');
    assert.ok(mallocDoc);
    assert.strictEqual(mallocDoc.symbol, 'std::malloc');
    assert.strictEqual(mallocDoc.header, '<cstdlib>');
  });

  it('should retrieve entries indexed by header name', () => {
    const cmathEntries = getStlEntriesByHeader('<cmath>');
    assert.ok(cmathEntries.length >= 10);
    const symbols = cmathEntries.map((e) => e.symbol);
    assert.ok(symbols.includes('std::sqrt'));
    assert.ok(symbols.includes('std::pow'));
    assert.ok(symbols.includes('std::sin'));

    const cstdioEntries = getStlEntriesByHeader('cstdio');
    assert.ok(cstdioEntries.length >= 5);
    const ioSymbols = cstdioEntries.map((e) => e.symbol);
    assert.ok(ioSymbols.includes('std::printf'));
    assert.ok(ioSymbols.includes('std::fopen'));
  });

  it('should allow dynamically registering custom standard library headers', () => {
    const customModule: StlHeaderModule = {
      id: 'custom_std_lib',
      headers: ['<experimental/simd>'],
      entries: {
        'std::experimental::native_simd': {
          symbol: 'std::experimental::native_simd',
          canonicalSignature: 'template <typename T> using native_simd = simd<T, simd_abi::native<T>>;',
          summary: 'Vectorized SIMD register representation tailored to target architecture hardware lanes.',
          header: '<experimental/simd>',
          standard: 'C++26 TS',
          parameters: {},
          returns: '',
          docUrl: 'https://en.cppreference.com/w/cpp/experimental/simd',
          complexity: { time: 'O(1) vector execution' }
        }
      }
    };

    registerStlModule(customModule);

    const lookup = findStlDocumentation('std::experimental::native_simd');
    assert.ok(lookup);
    assert.strictEqual(lookup.header, '<experimental/simd>');
    assert.strictEqual(lookup.standard, 'C++26 TS');

    const byHeader = getStlEntriesByHeader('<experimental/simd>');
    assert.strictEqual(byHeader.length, 1);
    assert.strictEqual(byHeader[0].symbol, 'std::experimental::native_simd');
  });

  it('should report substantial symbol coverage in decoupled registry', () => {
    assert.ok(stlRegistry.size() >= 100);
  });
});
