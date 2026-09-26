import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { NativeBridge, NativeBridgeImpl } from '../src/native/native-bridge';

describe('Native Rust Bridge & TypeScript Fallback Subsystem', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-bridge-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('Graceful Fallback Mode', () => {
    it('should initialize bridge and fallback to pure TypeScript when addon is absent', () => {
      const fallbackBridge = new NativeBridgeImpl('/non/existent/path/novacpp_native.node');
      assert.strictEqual(fallbackBridge.isAccelerated, false);
      assert.strictEqual(fallbackBridge.nativeVersion, null);
    });

    it('should compute struct layout accurately via TypeScript fallback', () => {
      const bridge = new NativeBridgeImpl('/non/existent/path/novacpp_native.node');
      const layout = bridge.calculateStructLayout('TestStruct', [
        { type: 'char', name: 'c' },
        { type: 'int', name: 'i' }
      ]);

      assert.strictEqual(layout.name, 'TestStruct');
      assert.strictEqual(layout.totalSize, 8);
      assert.strictEqual(layout.alignment, 4);
      assert.strictEqual(layout.paddingBytes, 3);
    });

    it('should parse time-trace string content accurately via TypeScript fallback', () => {
      const bridge = new NativeBridgeImpl('/non/existent/path/novacpp_native.node');
      const sampleTrace = JSON.stringify({
        traceEvents: [
          { name: 'ExecuteCompiler', ph: 'X', ts: 0, dur: 200000 },
          { name: 'Source', ph: 'X', ts: 1000, dur: 50000, args: { detail: '/src/header.h' } }
        ]
      });

      const summary = bridge.parseTimeTraceContent(sampleTrace);
      assert.strictEqual(summary.totalDurationMs, 200);
      assert.strictEqual(summary.slowestHeaders.length, 1);
      assert.strictEqual(summary.slowestHeaders[0].file, '/src/header.h');
      assert.strictEqual(summary.slowestHeaders[0].durationMs, 50);
    });

    it('should parse time-trace file from disk accurately via TypeScript fallback', async () => {
      const bridge = new NativeBridgeImpl('/non/existent/path/novacpp_native.node');
      const traceFile = path.join(tempDir, 'trace.json');
      fs.writeFileSync(
        traceFile,
        JSON.stringify({
          traceEvents: [
            { name: 'ExecuteCompiler', ph: 'X', ts: 0, dur: 100000 },
            { name: 'Source', ph: 'X', ts: 500, dur: 30000, args: { detail: '/src/common.h' } }
          ]
        }),
        'utf8'
      );

      const summary = await bridge.parseTimeTrace(traceFile);
      assert.strictEqual(summary.totalDurationMs, 100);
      assert.strictEqual(summary.slowestHeaders.length, 1);
      assert.strictEqual(summary.slowestHeaders[0].file, '/src/common.h');
      assert.strictEqual(summary.slowestHeaders[0].durationMs, 30);
    });

    it('should export singleton NativeBridge default instance', () => {
      assert.ok(NativeBridge);
      assert.strictEqual(typeof NativeBridge.parseTimeTrace, 'function');
      assert.strictEqual(typeof NativeBridge.calculateStructLayout, 'function');
      assert.strictEqual(typeof NativeBridge.parseCMakeWorkspace, 'function');
    });
  });
});
