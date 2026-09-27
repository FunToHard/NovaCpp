import './vscode-mock';
import * as assert from 'assert';
import { InlayHintManager } from '../src/intelligence/inlay-hints';

describe('InlayHintManager (inlay-hints.ts)', () => {
  let manager: InlayHintManager;

  afterEach(() => {
    if (manager) {
      manager.dispose();
    }
  });

  it('should initialize and return default enabled state', () => {
    manager = new InlayHintManager();
    const enabled = manager.isEnabled();
    assert.strictEqual(typeof enabled, 'boolean');
    assert.strictEqual(enabled, true);
  });

  it('should evaluate ensureInlayHintsConfigured without throwing', async () => {
    manager = new InlayHintManager();
    await manager.ensureInlayHintsConfigured();
    assert.strictEqual(manager.isEnabled(), true);
  });

  it('should clean up disposables on dispose', () => {
    manager = new InlayHintManager();
    manager.dispose();
    // Subsequent calls should still safely query configuration
    assert.strictEqual(typeof manager.isEnabled(), 'boolean');
  });
});
