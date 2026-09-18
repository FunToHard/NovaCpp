import './vscode-mock';
import { mockVscode } from './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { LldbDapLocator } from '../src/debugger/lldb-dap';
import { LaunchGenerator } from '../src/debugger/launch-generator';
import {
  NovaCppDebugConfigurationProvider,
  NovaCppDebugAdapterDescriptorFactory
} from '../src/debugger/dap-session';

describe('Integrated Debugger (DAP Engine)', () => {
  describe('Debugger Locator', () => {
    it('should find a viable debugger backend or respect custom fallback', () => {
      const resolved = LldbDapLocator.resolvePreferredDebugger();
      if (resolved) {
        console.log('    Found debugger backend:', resolved.type, resolved.path);
        assert.ok(fs.existsSync(resolved.path), `Debugger binary must exist: ${resolved.path}`);
        if (resolved.type === 'gdb') {
          assert.ok(resolved.args.includes('--interpreter=dap'));
        }
      } else {
        // In environments without a preinstalled debugger, ensure custom fallback works
        const custom = LldbDapLocator.resolvePreferredDebugger('auto', process.execPath);
        assert.ok(custom !== null);
      }
    });

    it('should respect custom debugger path overrides', () => {
      const customPath = process.platform === 'win32' ? 'C:\\dummy\\lldb-dap.exe' : '/dummy/lldb-dap';
      const resolved = LldbDapLocator.findLldbDap(customPath);
      // Even if file doesn't exist, if it can't find it, returns null
      assert.strictEqual(resolved, null);
    });

    it('should respect explicit debugger preference', () => {
      const gdb = LldbDapLocator.resolvePreferredDebugger('gdb');
      if (gdb) {
        assert.strictEqual(gdb.type, 'gdb');
        assert.ok(gdb.args.includes('--interpreter=dap'));
      }
    });
  });

  describe('Launch Configuration Generator & Variable Resolver', () => {
    it('should generate valid default launch configuration', () => {
      const config = LaunchGenerator.createDefaultConfiguration();
      assert.strictEqual(config.type, 'novacpp-debug');
      assert.strictEqual(config.request, 'launch');
      assert.strictEqual(config.name, 'NovaCpp: Debug Active File');
      assert.ok(config.program!.includes('${fileBasenameNoExtension}'));
    });

    it('should resolve workspace and active file variables', () => {
      const workspaceRoot = 'F:/project/my-cpp-app';
      const activeFile = 'F:/project/my-cpp-app/src/main.cpp';

      const resolved = LaunchGenerator.resolveVariables(
        '${workspaceFolder}/bin/${fileBasenameNoExtension}',
        activeFile,
        workspaceRoot
      );

      assert.strictEqual(resolved, 'F:/project/my-cpp-app/bin/main');
    });

    it('should scaffold .vscode/launch.json when requested', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-dap-'));
      try {
        const launchFile = await LaunchGenerator.scaffoldLaunchJson(tmpDir);
        assert.ok(fs.existsSync(launchFile));

        const content = JSON.parse(fs.readFileSync(launchFile, 'utf8'));
        assert.strictEqual(content.version, '0.2.0');
        assert.strictEqual(content.configurations.length, 1);
        assert.strictEqual(content.configurations[0].type, 'novacpp-debug');
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });

  describe('Debug Configuration Provider & Adapter Descriptor Factory', () => {
    const configProvider = new NovaCppDebugConfigurationProvider();
    const adapterFactory = new NovaCppDebugAdapterDescriptorFactory();

    it('should provide default debug configuration list', () => {
      const configs = configProvider.provideDebugConfigurations(undefined);
      assert.ok(Array.isArray(configs));
      assert.strictEqual(configs.length, 2);
      assert.strictEqual(configs[0].type, 'novacpp-debug');
      assert.strictEqual(configs[1].request, 'attach');
    });

    it('should create DebugAdapterExecutable for active session', () => {
      const resolved = LldbDapLocator.resolvePreferredDebugger();
      if (!resolved) {
        (mockVscode.workspace as any)._config = {
          'novacpp.debuggerPath': process.execPath
        };
      }

      const session: any = {
        configuration: {
          name: 'Debug',
          type: 'novacpp-debug',
          request: 'launch',
          program: 'main.exe',
          debuggerType: 'auto'
        }
      };

      const descriptor: any = adapterFactory.createDebugAdapterDescriptor(session, undefined);
      assert.ok(descriptor !== null);
      assert.ok(descriptor.command);
      console.log('    DebugAdapterExecutable command:', descriptor.command, descriptor.args);

      (mockVscode.workspace as any)._config = {};
    });
  });
});
