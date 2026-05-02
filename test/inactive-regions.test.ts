import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { CMakeWatcher } from '../src/bridge/cmake-watcher';
import { InactiveRegionsManager } from '../src/bridge/inactive-regions';
import { mockVscode } from './vscode-mock';

describe('Build System Bridge & Inactive Regions', () => {
  describe('CMakeWatcher Compilation Database Bridge', () => {
    it('should create watcher and trigger debounced reload on database update', (done) => {
      let reloaded = false;
      const onReload = async () => {
        reloaded = true;
      };

      const watcher = new CMakeWatcher(onReload);
      assert.ok(watcher);

      // Create a temporary file with content
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-watch-'));
      const dbFile = path.join(tmpDir, 'compile_commands.json');
      fs.writeFileSync(dbFile, '[{"directory":".","file":"main.cpp","command":"g++ main.cpp"}]', 'utf8');

      // Invoke debounced reload with file
      (watcher as any).debouncedReload(mockVscode.Uri.file(dbFile));

      // Before debounce time
      assert.strictEqual(reloaded, false);

      // Wait for debounce (1500ms in production, we can test execution or timeout)
      setTimeout(() => {
        assert.strictEqual(reloaded, true);
        watcher.dispose();
        fs.rmSync(tmpDir, { recursive: true, force: true });
        done();
      }, 1600);
    });

    it('should not reload if updated file has 0 bytes size', (done) => {
      let reloaded = false;
      const onReload = async () => {
        reloaded = true;
      };

      const watcher = new CMakeWatcher(onReload);
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-empty-'));
      const emptyFile = path.join(tmpDir, 'compile_commands.json');
      fs.writeFileSync(emptyFile, '', 'utf8');

      (watcher as any).debouncedReload(mockVscode.Uri.file(emptyFile));

      setTimeout(() => {
        assert.strictEqual(reloaded, false, 'Should not reload on 0-byte file');
        watcher.dispose();
        fs.rmSync(tmpDir, { recursive: true, force: true });
        done();
      }, 1600);
    });
  });

  describe('InactiveRegionsManager (#ifdef Dimming)', () => {
    it('should store and map inactive ranges for text documents', () => {
      const manager = new InactiveRegionsManager();
      const testUri = 'file:///F:/project/test.cpp';

      const range1 = new mockVscode.Range(
        new mockVscode.Position(5, 0),
        new mockVscode.Position(10, 0)
      );

      manager.handleInactiveRegions({
        textDocument: { uri: testUri },
        regions: [range1]
      });

      const stored = manager.getRegions(testUri);
      assert.ok(stored);
      assert.strictEqual(stored.length, 1);
      assert.strictEqual(stored[0].start.line, 5);
      assert.strictEqual(stored[0].end.line, 10);

      manager.dispose();
    });

    it('should apply decorations to matching visible editors', () => {
      const manager = new InactiveRegionsManager();
      const testUri = 'file:///F:/project/active.cpp';

      let setDecorationsCalled = false;
      let appliedRanges: any[] = [];

      const mockEditor: any = {
        document: {
          uri: mockVscode.Uri.parse(testUri)
        },
        setDecorations: (_type: any, ranges: any[]) => {
          setDecorationsCalled = true;
          appliedRanges = ranges;
        }
      };

      mockVscode.window.visibleTextEditors = [mockEditor];

      const range = new mockVscode.Range(
        new mockVscode.Position(20, 0),
        new mockVscode.Position(25, 0)
      );

      manager.handleInactiveRegions({
        textDocument: { uri: testUri },
        regions: [range]
      });

      assert.strictEqual(setDecorationsCalled, true);
      assert.strictEqual(appliedRanges.length, 1);

      // Clean up
      mockVscode.window.visibleTextEditors = [];
      manager.dispose();
    });
  });
});
