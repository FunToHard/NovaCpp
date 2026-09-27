import './vscode-mock';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import {
  extractDirectIncludes,
  buildIncludeTree,
  analyzeIncludeTree,
  formatIncludeTreeAscii,
  parseFTimeTrace
} from '../src/analysis/include-visualizer';

describe('Include Tree & Build Time Bottleneck Visualizer', () => {
  describe('extractDirectIncludes', () => {
    it('should extract both system and user includes ignoring comments', () => {
      const source = `
// #include <commented_out.h>
#include <iostream>
#include "my_header.h"
/*
#include <block_comment.h>
*/
  #  include   <vector>
#include "../common/types.hpp"
`;
      const res = extractDirectIncludes(source, 'test.cpp');
      assert.strictEqual(res.length, 4);

      assert.strictEqual(res[0].includePath, 'iostream');
      assert.strictEqual(res[0].isSystem, true);

      assert.strictEqual(res[1].includePath, 'my_header.h');
      assert.strictEqual(res[1].isSystem, false);

      assert.strictEqual(res[2].includePath, 'vector');
      assert.strictEqual(res[2].isSystem, true);

      assert.strictEqual(res[3].includePath, '../common/types.hpp');
      assert.strictEqual(res[3].isSystem, false);
    });
  });

  describe('buildIncludeTree & Cycle Detection', () => {
    let tempDir: string;

    beforeEach(() => {
      tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'turbocpp-inc-test-'));
    });

    afterEach(() => {
      fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it('should resolve local include tree and prevent circular inclusion cycles', () => {
      // Create A.h -> B.h -> A.h (circular!)
      const fileA = path.join(tempDir, 'A.h');
      const fileB = path.join(tempDir, 'B.h');

      fs.writeFileSync(fileA, `#pragma once\n#include "B.h"\n#include <string>\n`);
      fs.writeFileSync(fileB, `#pragma once\n#include "A.h"\n#include <vector>\n`);

      const tree = buildIncludeTree(fileA, [tempDir], 5);
      assert.ok(tree.length >= 2);
      assert.strictEqual(tree[0].path, 'B.h');
      assert.strictEqual(tree[1].path, 'string');

      // B.h children should not recursively re-enter A.h forever
      assert.ok(tree[0].children.length > 0);
    });

    it('should support diamond include DAGs without dropping shared headers across branches', () => {
      // main.cpp -> B.h and C.h
      // B.h -> common.h
      // C.h -> common.h
      // common.h -> leaf.h
      const main = path.join(tempDir, 'main.cpp');
      const b = path.join(tempDir, 'B.h');
      const c = path.join(tempDir, 'C.h');
      const common = path.join(tempDir, 'common.h');
      const leaf = path.join(tempDir, 'leaf.h');

      fs.writeFileSync(main, `#include "B.h"\n#include "C.h"\n`);
      fs.writeFileSync(b, `#include "common.h"\n`);
      fs.writeFileSync(c, `#include "common.h"\n`);
      fs.writeFileSync(common, `#include "leaf.h"\n`);
      fs.writeFileSync(leaf, `// leaf header\n`);

      const tree = buildIncludeTree(main, [tempDir], 5);
      assert.strictEqual(tree.length, 2);
      assert.strictEqual(tree[0].path, 'B.h');
      assert.strictEqual(tree[1].path, 'C.h');

      // Verify B.h -> common.h -> leaf.h
      assert.strictEqual(tree[0].children.length, 1);
      assert.strictEqual(tree[0].children[0].path, 'common.h');
      assert.strictEqual(tree[0].children[0].children.length, 1);
      assert.strictEqual(tree[0].children[0].children[0].path, 'leaf.h');

      // Verify C.h -> common.h -> leaf.h (was previously empty/pruned under global visited set)
      assert.strictEqual(tree[1].children.length, 1);
      assert.strictEqual(tree[1].children[0].path, 'common.h');
      assert.strictEqual(tree[1].children[0].children.length, 1);
      assert.strictEqual(tree[1].children[0].children[0].path, 'leaf.h');
    });
  });

  describe('analyzeIncludeTree & Heavy Header Advice', () => {
    it('should detect heavy headers and generate optimization advice', () => {
      const tree = [
        { path: 'windows.h', isSystem: true, line: 1, children: [] },
        { path: 'iostream', isSystem: true, line: 2, children: [] },
        { path: 'ranges', isSystem: true, line: 3, children: [] },
        { path: 'my_math.h', isSystem: false, line: 4, children: [] }
      ];

      const analysis = analyzeIncludeTree('main.cpp', tree);
      assert.strictEqual(analysis.directIncludes, 4);
      assert.strictEqual(analysis.systemIncludes, 3);
      assert.strictEqual(analysis.userIncludes, 1);
      assert.strictEqual(analysis.heavyHeaders.length, 3);
      assert.ok(analysis.suggestions.some(s => s.includes('WIN32_LEAN_AND_MEAN')));
      assert.ok(analysis.suggestions.some(s => s.includes('<iosfwd>')));
      assert.ok(analysis.suggestions.some(s => s.includes('<ranges>')));
    });

    it('should format include tree into ascii hierarchy lines', () => {
      const tree = [
        {
          path: 'engine.h',
          isSystem: false,
          line: 1,
          children: [
            { path: 'renderer.h', isSystem: false, line: 5, children: [] },
            { path: 'vector', isSystem: true, line: 6, children: [] }
          ]
        }
      ];

      const lines = formatIncludeTreeAscii(tree);
      assert.ok(lines.length >= 3);
      assert.ok(lines[0].includes('engine.h'));
      assert.ok(lines[1].includes('renderer.h'));
      assert.ok(lines[2].includes('vector'));
    });
  });

  describe('parseFTimeTrace', () => {
    it('should parse Clang -ftime-trace Chrome JSON and aggregate top bottlenecks', () => {
      const sampleTrace = JSON.stringify({
        traceEvents: [
          { name: 'ExecuteCompiler', ph: 'X', ts: 0, dur: 500000 }, // 500ms
          { name: 'Source', ph: 'X', ts: 10000, dur: 180000, args: { detail: '/usr/include/boost/asio.hpp' } },
          { name: 'Source', ph: 'X', ts: 200000, dur: 120000, args: { detail: '/usr/include/iostream' } },
          { name: 'InstantiateFunction', ph: 'X', ts: 350000, dur: 85000, args: { detail: 'std::vector<MyStruct>::emplace_back' } },
          { name: 'OptFunction', ph: 'X', ts: 450000, dur: 45000, args: { detail: 'MatrixMultiply' } }
        ]
      });

      const summary = parseFTimeTrace(sampleTrace);
      assert.strictEqual(summary.totalDurationMs, 500);

      assert.strictEqual(summary.slowestHeaders.length, 2);
      assert.strictEqual(summary.slowestHeaders[0].file, '/usr/include/boost/asio.hpp');
      assert.strictEqual(summary.slowestHeaders[0].durationMs, 180);
      assert.strictEqual(summary.slowestHeaders[0].percentage, 36);

      assert.strictEqual(summary.slowestTemplates.length, 1);
      assert.strictEqual(summary.slowestTemplates[0].template, 'std::vector<MyStruct>::emplace_back');
      assert.strictEqual(summary.slowestTemplates[0].durationMs, 85);

      assert.strictEqual(summary.slowestFunctions.length, 1);
      assert.strictEqual(summary.slowestFunctions[0].name, 'MatrixMultiply');
      assert.strictEqual(summary.slowestFunctions[0].durationMs, 45);
    });

    it('should calculate self-time by subtracting nested child durations in Clang time trace events', () => {
      const nestedTrace = JSON.stringify({
        traceEvents: [
          { name: 'ExecuteCompiler', ph: 'X', ts: 0, dur: 1000000 }, // 1000ms
          // main.cpp: 0 to 1000ms (1000000us)
          { name: 'Source', ph: 'X', ts: 0, dur: 1000000, args: { detail: '/src/main.cpp' } },
          // a.h: 100ms to 500ms (400000us) inside main.cpp
          { name: 'Source', ph: 'X', ts: 100000, dur: 400000, args: { detail: '/src/a.h' } },
          // b.h: 200ms to 350ms (150000us) inside a.h
          { name: 'Source', ph: 'X', ts: 200000, dur: 150000, args: { detail: '/src/b.h' } }
        ]
      });

      const summary = parseFTimeTrace(nestedTrace);
      assert.strictEqual(summary.totalDurationMs, 1000);

      // Verify self-times:
      // b.h: 150ms
      // a.h: 400ms - 150ms = 250ms
      // main.cpp: 1000ms - 400ms = 600ms
      const main = summary.slowestHeaders.find(h => h.file === '/src/main.cpp');
      const a = summary.slowestHeaders.find(h => h.file === '/src/a.h');
      const b = summary.slowestHeaders.find(h => h.file === '/src/b.h');

      assert.ok(main && a && b);
      assert.strictEqual(main!.durationMs, 600);
      assert.strictEqual(main!.percentage, 60);

      assert.strictEqual(a!.durationMs, 250);
      assert.strictEqual(a!.percentage, 25);

      assert.strictEqual(b!.durationMs, 150);
      assert.strictEqual(b!.percentage, 15);

      // Sum of percentages must equal 100%, never > 100%
      const totalPercentage = main!.percentage + a!.percentage + b!.percentage;
      assert.strictEqual(totalPercentage, 100);
    });
  });
});
