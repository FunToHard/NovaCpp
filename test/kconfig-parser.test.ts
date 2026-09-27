import './vscode-mock';
import * as assert from 'assert';
import { parseDotConfig, parseKconfig } from '../src/config/kconfig-parser';

describe('Kconfig Parser (kconfig-parser.ts)', () => {
  it('should parse boolean flags y and m as 1, and discard n', () => {
    const content = `
CONFIG_FEATURE_A=y
CONFIG_FEATURE_B=n
CONFIG_FEATURE_C=m
CONFIG_FEATURE_D=N
CONFIG_FEATURE_E=Y
`;
    const defines = parseDotConfig(content);
    assert.deepStrictEqual(defines, [
      'CONFIG_FEATURE_A=1',
      'CONFIG_FEATURE_C=1',
      'CONFIG_FEATURE_E=1'
    ]);
  });

  it('should parse numeric and hexadecimal configuration values', () => {
    const content = `
CONFIG_BUFFER_SIZE=4096
CONFIG_BASE_ADDR=0x80000000
CONFIG_RETRY_COUNT=5
`;
    const defines = parseDotConfig(content);
    assert.deepStrictEqual(defines, [
      'CONFIG_BUFFER_SIZE=4096',
      'CONFIG_BASE_ADDR=0x80000000',
      'CONFIG_RETRY_COUNT=5'
    ]);
  });

  it('should handle strings with escaped double quotes without premature truncation', () => {
    const content = `
CONFIG_BANNER="C/C++ Pro Kernel v1.0 \\"Enterprise Edition\\""
CONFIG_PATH="/usr/local/bin"
`;
    const defines = parseDotConfig(content);
    assert.strictEqual(defines.length, 2);
    assert.strictEqual(defines[0], 'CONFIG_BANNER="C/C++ Pro Kernel v1.0 \\"Enterprise Edition\\""');
    assert.strictEqual(defines[1], 'CONFIG_PATH="/usr/local/bin"');
  });

  it('should ignore full-line comments and strip inline comments on unquoted values', () => {
    const content = `
# This is a full line comment
# CONFIG_OLD_OPT is not set

CONFIG_ACTIVE=y # enabled by default
CONFIG_LIMIT=128 // max limit
CONFIG_TIMEOUT=500 /* milliseconds */
`;
    const defines = parseDotConfig(content);
    assert.deepStrictEqual(defines, [
      'CONFIG_ACTIVE=1',
      'CONFIG_LIMIT=128',
      'CONFIG_TIMEOUT=500'
    ]);
  });

  it('should support parseKconfig alias function', () => {
    const content = 'CONFIG_TEST=y';
    assert.deepStrictEqual(parseKconfig(content), ['CONFIG_TEST=1']);
  });

  it('should handle empty content and whitespace gracefully', () => {
    assert.deepStrictEqual(parseDotConfig(''), []);
    assert.deepStrictEqual(parseDotConfig('   \n\r\n   '), []);
  });
});
