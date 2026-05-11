import './vscode-mock';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { IndexManager } from '../src/diagnostics/index-manager';

describe('IndexManager', () => {
  let tempDir: string;

  beforeEach(async () => {
    tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'novacpp-index-test-'));
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  it('should delete .clangd/index and .clangd/cache directories on reset', async () => {
    const clangdDir = path.join(tempDir, '.clangd');
    const indexDir = path.join(clangdDir, 'index');
    const cacheDir = path.join(clangdDir, 'cache');

    await fs.promises.mkdir(indexDir, { recursive: true });
    await fs.promises.mkdir(cacheDir, { recursive: true });
    await fs.promises.writeFile(path.join(indexDir, 'test.idx'), 'dummy index data');
    await fs.promises.writeFile(path.join(cacheDir, 'test.cache'), 'dummy cache data');

    assert.strictEqual(fs.existsSync(indexDir), true);
    assert.strictEqual(fs.existsSync(cacheDir), true);

    let restartCalled = false;
    const result = await IndexManager.resetIndex(tempDir, async () => {
      restartCalled = true;
    });

    assert.strictEqual(result, true);
    assert.strictEqual(restartCalled, true);
    assert.strictEqual(fs.existsSync(indexDir), false);
    assert.strictEqual(fs.existsSync(cacheDir), false);
  });
});
