import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { ConfigPanel } from '../src/webview/config-panel';
import { CompilerDetector } from '../src/prober/compiler-detector';
import { FlagSynthesizer } from '../src/prober/flag-synthesizer';
import { SystemIncludeExtractor } from '../src/prober/system-includes';
import { mockVscode } from './vscode-mock';

describe('Configuration Webview Editor', () => {
  const detector = new CompilerDetector();
  const extractor = new SystemIncludeExtractor();
  const synthesizer = new FlagSynthesizer(detector, extractor);

  it('should render ConfigPanel and serve HTML with CSP', () => {
    const onReload = async () => {};

    const panel = ConfigPanel.render(
      mockVscode.Uri.file(path.resolve('.')),
      detector,
      synthesizer,
      onReload
    );

    assert.ok(panel);
    assert.strictEqual(ConfigPanel.currentPanel, panel);

    panel.dispose();
    assert.strictEqual(ConfigPanel.currentPanel, undefined);
  });

  it('should gather initial configuration data', async () => {
    const onReload = async () => {};
    const panel = ConfigPanel.render(
      mockVscode.Uri.file(path.resolve('.')),
      detector,
      synthesizer,
      onReload
    );

    const initial = await panel.gatherInitialData();
    assert.ok(Array.isArray(initial.compilers));
    assert.ok(initial.cppStandard);
    assert.ok(initial.cStandard);

    panel.dispose();
  });

  it('should save settings to compile_flags.txt and trigger server reload', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c-cpp-pro-webview-'));
    let reloaded = false;
    const onReload = async () => {
      reloaded = true;
    };

    mockVscode.workspace.workspaceFolders = [
      {
        uri: mockVscode.Uri.file(tmpDir),
        name: 'test-workspace',
        index: 0
      }
    ];

    try {
      const panel = ConfigPanel.render(
        mockVscode.Uri.file(path.resolve('.')),
        detector,
        synthesizer,
        onReload
      );

      const compilers = await detector.detectAllCompilers();
      const compilerPath = compilers[0]?.path ?? 'gcc';

      const result = await panel.handleSaveSettings({
        compilerPath,
        cppStandard: 'c++23',
        cStandard: 'c17',
        outputFormat: 'compile_flags',
        includes: ['C:/custom/include'],
        defines: ['WEBVIEW_TEST=1']
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(reloaded, true, 'Language server must reload after save');

      // Verify compile_flags.txt contents
      const flagsFile = path.join(tmpDir, 'compile_flags.txt');
      assert.ok(fs.existsSync(flagsFile));

      const content = fs.readFileSync(flagsFile, 'utf8');
      assert.ok(content.includes('c++23'), 'Must contain updated C++23 standard');
      assert.ok(content.includes('WEBVIEW_TEST=1'), 'Must contain custom define');

      panel.dispose();
    } finally {
      mockVscode.workspace.workspaceFolders = [];
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should save settings to .clangd YAML and trigger server reload', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c-cpp-pro-clangd-yaml-'));
    let reloaded = false;
    const onReload = async () => {
      reloaded = true;
    };

    mockVscode.workspace.workspaceFolders = [
      {
        uri: mockVscode.Uri.file(tmpDir),
        name: 'test-workspace',
        index: 0
      }
    ];

    try {
      const panel = ConfigPanel.render(
        mockVscode.Uri.file(path.resolve('.')),
        detector,
        synthesizer,
        onReload
      );

      const compilers = await detector.detectAllCompilers();
      const compilerPath = compilers[0]?.path ?? 'gcc';

      const result = await panel.handleSaveSettings({
        compilerPath,
        cppStandard: 'c++26',
        cStandard: 'c23',
        outputFormat: 'clangd_yaml',
        includes: ['include/app'],
        defines: ['EXPERIMENTAL=1']
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(reloaded, true);

      const clangdFile = path.join(tmpDir, '.clangd');
      assert.ok(fs.existsSync(clangdFile));

      const content = fs.readFileSync(clangdFile, 'utf8');
      assert.ok(content.includes('CompileFlags:'));
      assert.ok(content.includes('-std=c++26'));
      assert.ok(content.includes('EXPERIMENTAL=1'));

      panel.dispose();
    } finally {
      mockVscode.workspace.workspaceFolders = [];
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('should append to existing .clangd without overriding user configuration', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c-cpp-pro-clangd-append-'));
    let reloaded = false;
    const onReload = async () => {
      reloaded = true;
    };

    mockVscode.workspace.workspaceFolders = [
      {
        uri: mockVscode.Uri.file(tmpDir),
        name: 'test-workspace',
        index: 0
      }
    ];

    try {
      const clangdFile = path.join(tmpDir, '.clangd');
      fs.writeFileSync(
        clangdFile,
        '# Custom User Config\nDiagnostics:\n  ClangTidy:\n    Add: [modernize*]\nIndex:\n  Background: Build\nCompileFlags:\n  Add:\n    - "-DUSER_FLAG=1"\n',
        'utf8'
      );

      const panel = ConfigPanel.render(
        mockVscode.Uri.file(path.resolve('.')),
        detector,
        synthesizer,
        onReload
      );

      const compilers = await detector.detectAllCompilers();
      const compilerPath = compilers[0]?.path ?? 'gcc';

      const result = await panel.handleSaveSettings({
        compilerPath,
        cppStandard: 'c++23',
        cStandard: 'c17',
        outputFormat: 'clangd_yaml',
        includes: ['extra/include'],
        defines: ['APPEND_FLAG=1']
      });

      assert.strictEqual(result.success, true);
      assert.strictEqual(reloaded, true);

      const content = fs.readFileSync(clangdFile, 'utf8');
      assert.ok(content.includes('Custom User Config'), 'Must preserve existing comments');
      assert.ok(content.includes('modernize*'), 'Must preserve existing Diagnostics section');
      assert.ok(content.includes('Background: Build'), 'Must preserve existing Index section');
      assert.ok(content.includes('USER_FLAG=1'), 'Must preserve existing user flags');
      assert.ok(content.includes('-std=c++23'), 'Must append new standard flag');
      assert.ok(content.includes('extra/include'), 'Must append new include flag');
      assert.ok(content.includes('APPEND_FLAG=1'), 'Must append new define flag');

      panel.dispose();
    } finally {
      mockVscode.workspace.workspaceFolders = [];
      fs.rmSync(tmpDir, { recursive: true, force: true });
    }
  });
});
