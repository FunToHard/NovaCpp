import './vscode-mock';
import * as assert from 'assert';
import { DirectiveNavigator } from '../src/navigation/directive-navigator';

describe('DirectiveNavigator', () => {
  const sampleLines = [
    '// Header top',
    '#ifdef _WIN32',                 // line 1, depth 1
    '    #define PLATFORM "Windows"',
    '    #if defined(_M_X64)',       // line 3, depth 2
    '        #define ARCH "x64"',
    '    #elif defined(_M_IX86)',    // line 5, depth 2
    '        #define ARCH "x86"',
    '    #else',                     // line 7, depth 2
    '        #define ARCH "Unknown"',
    '    #endif',                    // line 9, depth 2 (then depth 1)
    '#elif defined(__linux__)',       // line 10, depth 1
    '    #define PLATFORM "Linux"',
    '#else',                         // line 12, depth 1
    '    #define PLATFORM "Other"',
    '#endif',                        // line 14, depth 1 (then depth 0)
    '// Footer bottom'
  ];

  it('should extract preprocessor directives with correct depths and types', () => {
    const dirs = DirectiveNavigator.extractDirectives(sampleLines);
    assert.strictEqual(dirs.length, 8);

    assert.strictEqual(dirs[0].line, 1);
    assert.strictEqual(dirs[0].type, 'if');
    assert.strictEqual(dirs[0].depth, 1);

    assert.strictEqual(dirs[1].line, 3);
    assert.strictEqual(dirs[1].type, 'if');
    assert.strictEqual(dirs[1].depth, 2);

    assert.strictEqual(dirs[2].line, 5);
    assert.strictEqual(dirs[2].type, 'elif');
    assert.strictEqual(dirs[2].depth, 2);

    assert.strictEqual(dirs[3].line, 7);
    assert.strictEqual(dirs[3].type, 'else');
    assert.strictEqual(dirs[3].depth, 2);

    assert.strictEqual(dirs[4].line, 9);
    assert.strictEqual(dirs[4].type, 'endif');
    assert.strictEqual(dirs[4].depth, 2);

    assert.strictEqual(dirs[5].line, 10);
    assert.strictEqual(dirs[5].type, 'elif');
    assert.strictEqual(dirs[5].depth, 1);

    assert.strictEqual(dirs[6].line, 12);
    assert.strictEqual(dirs[6].type, 'else');
    assert.strictEqual(dirs[6].depth, 1);

    assert.strictEqual(dirs[7].line, 14);
    assert.strictEqual(dirs[7].type, 'endif');
    assert.strictEqual(dirs[7].depth, 1);
  });

  it('should navigate forward through inner directives at depth 2', () => {
    // Current line is 3 (#if defined(_M_X64)) -> next should be 5 (#elif)
    const next1 = DirectiveNavigator.findNextDirective(sampleLines, 3);
    assert.strictEqual(next1, 5);

    // Current line is 4 inside block -> next should be 5
    const next2 = DirectiveNavigator.findNextDirective(sampleLines, 4);
    assert.strictEqual(next2, 5);

    // Current line is 5 -> next should be 7 (#else)
    const next3 = DirectiveNavigator.findNextDirective(sampleLines, 5);
    assert.strictEqual(next3, 7);

    // Current line is 7 -> next should be 9 (#endif)
    const next4 = DirectiveNavigator.findNextDirective(sampleLines, 7);
    assert.strictEqual(next4, 9);
  });

  it('should navigate backward through directives', () => {
    // From line 7 (#else) -> prev at same depth should be 5 (#elif)
    const prev1 = DirectiveNavigator.findPrevDirective(sampleLines, 7);
    assert.strictEqual(prev1, 5);

    // From line 5 (#elif) -> prev should be 3 (#if)
    const prev2 = DirectiveNavigator.findPrevDirective(sampleLines, 5);
    assert.strictEqual(prev2, 3);
  });

  it('should return null or first directive when out of bounds', () => {
    const next = DirectiveNavigator.findNextDirective(sampleLines, 0);
    assert.strictEqual(next, 1);

    const prev = DirectiveNavigator.findPrevDirective(sampleLines, 0);
    assert.strictEqual(prev, null);
  });
});
