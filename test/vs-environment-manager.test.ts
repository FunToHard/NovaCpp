import './vscode-mock';
import * as assert from 'assert';
import { VsEnvironmentManager } from '../src/tasks/vs-environment-manager';
import { CompilerDetector } from '../src/prober/compiler-detector';

describe('Visual Studio Developer Environment Injection', () => {
  function createMockContext() {
    const envReplacements = new Map<string, string>();
    const envPrepends = new Map<string, string>();
    const state = new Map<string, any>();

    return {
      environmentVariableCollection: {
        description: '',
        replace: (k: string, v: string) => envReplacements.set(k, v),
        prepend: (k: string, v: string) => envPrepends.set(k, v),
        clear: () => {
          envReplacements.clear();
          envPrepends.clear();
        }
      },
      workspaceState: {
        get: (key: string) => state.get(key),
        update: async (key: string, val: any) => state.set(key, val)
      },
      _envReplacements: envReplacements,
      _envPrepends: envPrepends,
      _state: state
    };
  }

  describe('VsEnvironmentManager.findVcvarsall', () => {
    it('should locate vcvarsall.bat when compiler or VS installation is present', async () => {
      if (process.platform !== 'win32') return;

      const detector = new CompilerDetector();
      const compilers = await detector.detectAllCompilers();
      const msvc = compilers.find((c) => c.type === 'msvc');

      const vcvars = VsEnvironmentManager.findVcvarsall(msvc);
      if (msvc) {
        assert.ok(vcvars, 'Should locate vcvarsall.bat on Windows when MSVC compiler is present');
        assert.ok(vcvars.toLowerCase().endsWith('vcvarsall.bat'));
      }
    });
  });

  describe('VsEnvironmentManager.applyEnvironment', () => {
    it('should inject extracted variables into environmentVariableCollection', () => {
      const mockContext = createMockContext();
      const dummyEnv = {
        INCLUDE: 'C:\\MSVC\\include;C:\\WindowsSDK\\include',
        LIB: 'C:\\MSVC\\lib;C:\\WindowsSDK\\lib',
        LIBPATH: 'C:\\MSVC\\lib',
        VCToolsInstallDir: 'C:\\MSVC\\',
        PATH: 'C:\\MSVC\\bin;C:\\WindowsSDK\\bin'
      };

      VsEnvironmentManager.applyEnvironment(mockContext as any, dummyEnv, 'MSVC 2026 (x64)');

      assert.strictEqual(
        mockContext.environmentVariableCollection.description,
        'Visual Studio Developer Environment: MSVC 2026 (x64)'
      );
      assert.strictEqual(mockContext._envReplacements.get('INCLUDE'), dummyEnv.INCLUDE);
      assert.strictEqual(mockContext._envReplacements.get('LIB'), dummyEnv.LIB);
      assert.strictEqual(mockContext._envReplacements.get('LIBPATH'), dummyEnv.LIBPATH);
      assert.strictEqual(mockContext._envReplacements.get('VCToolsInstallDir'), dummyEnv.VCToolsInstallDir);
      assert.strictEqual(mockContext._envPrepends.get('PATH'), dummyEnv.PATH + ';');
    });

    it('should filter out existing PATH entries to prevent Windows terminal PATH overflow', () => {
      const mockContext = createMockContext();
      const originalPath = process.env['PATH'];
      try {
        process.env['PATH'] = 'C:\\System32;C:\\ExistingApp';
        const dummyEnv = {
          PATH: 'C:\\MSVC\\bin;C:\\System32;C:\\ExistingApp'
        };

        VsEnvironmentManager.applyEnvironment(mockContext as any, dummyEnv, 'MSVC Toolset');
        assert.strictEqual(mockContext._envPrepends.get('PATH'), 'C:\\MSVC\\bin;');
      } finally {
        process.env['PATH'] = originalPath;
      }
    });
  });

  describe('VsEnvironmentManager.clearVsDeveloperEnvironment', () => {
    it('should clear environmentVariableCollection and saved workspace state', () => {
      const mockContext = createMockContext();
      mockContext._envReplacements.set('INCLUDE', 'some_path');
      mockContext._state.set('turbocpp.activeVsEnvironment', { vcvars: 'foo', arch: 'x64' });

      VsEnvironmentManager.clearVsDeveloperEnvironment(mockContext as any);

      assert.strictEqual(mockContext._envReplacements.size, 0);
      assert.strictEqual(mockContext._state.get('turbocpp.activeVsEnvironment'), undefined);
    });
  });
});
