import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { parseDotConfig, ProfileManager, CppProfile } from '../src/config/profile-manager';
import { CompilerDetector, CompilerInfo } from '../src/prober/compiler-detector';

describe('Multi-Configuration Profiles & Kconfig (.config) Subsystem', () => {
  describe('parseDotConfig', () => {
    it('should parse Linux/RTOS Kconfig defines accurately', () => {
      const sampleConfig = `
# Automatically generated file; DO NOT EDIT.
CONFIG_64BIT=y
CONFIG_SMP=y
CONFIG_HZ=1000
CONFIG_LOCALVERSION="-nova"
# CONFIG_DEBUG_INFO is not set
CONFIG_MODULES=m
      `;

      const parsed = parseDotConfig(sampleConfig);
      assert.deepStrictEqual(parsed, [
        'CONFIG_64BIT=1',
        'CONFIG_SMP=1',
        'CONFIG_HZ=1000',
        'CONFIG_LOCALVERSION="-nova"',
        'CONFIG_MODULES=1'
      ]);
    });
  });

  describe('ProfileManager.loadProfiles', () => {
    let tempDir: string;

    beforeEach(async () => {
      tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'novacpp-profile-test-'));
    });

    afterEach(async () => {
      try {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      } catch {
        // Ignore
      }
    });

    it('should load profiles from .vscode/c_cpp_properties.json', async () => {
      const vscodeDir = path.join(tempDir, '.vscode');
      await fs.promises.mkdir(vscodeDir, { recursive: true });

      const props = {
        configurations: [
          {
            name: 'Win32-Debug',
            cppStandard: 'c++20',
            defines: ['_DEBUG', 'UNICODE']
          },
          {
            name: 'Linux-Release',
            cppStandard: 'c++17',
            defines: ['NDEBUG', 'LINUX']
          }
        ],
        version: 4
      };

      await fs.promises.writeFile(
        path.join(vscodeDir, 'c_cpp_properties.json'),
        JSON.stringify(props),
        'utf8'
      );

      const detector = new CompilerDetector();
      const manager = new ProfileManager(detector);
      const profiles = manager.loadProfiles(tempDir);

      assert.strictEqual(profiles.length, 2);
      assert.strictEqual(profiles[0].name, 'Win32-Debug');
      assert.strictEqual(profiles[1].name, 'Linux-Release');
      assert.deepStrictEqual(profiles[0].defines, ['_DEBUG', 'UNICODE']);

      manager.dispose();
    });

    it('should return Default profile when no config file exists', () => {
      const detector = new CompilerDetector();
      const manager = new ProfileManager(detector);
      const profiles = manager.loadProfiles(tempDir);

      assert.strictEqual(profiles.length, 1);
      assert.strictEqual(profiles[0].name, 'Default');

      manager.dispose();
    });
  });

  describe('ProfileManager.synthesizeProfileFlags', () => {
    it('should synthesize MSVC flags with /D and /FI for MSVC compilers', () => {
      const detector = new CompilerDetector();
      const manager = new ProfileManager(detector);

      const profile: CppProfile = {
        name: 'TestMSVC',
        cppStandard: 'c++23',
        defines: ['MY_DEF=1', 'TESTING'],
        forcedInclude: ['pch.h']
      };

      const msvcCompiler: CompilerInfo = {
        name: 'MSVC',
        type: 'msvc',
        path: 'C:/MSVC/cl.exe'
      };

      const flags = manager.synthesizeProfileFlags(profile, 'F:/project', msvcCompiler);

      assert.ok(flags.includes('--driver-mode=cl'));
      assert.ok(flags.includes('-std:c++23'));
      assert.ok(flags.includes('/DMY_DEF=1'));
      assert.ok(flags.includes('/DTESTING'));
      assert.ok(flags.includes('/FIpch.h'));

      manager.dispose();
    });

    it('should synthesize GCC flags with -D and -include for GCC compilers', () => {
      const detector = new CompilerDetector();
      const manager = new ProfileManager(detector);

      const profile: CppProfile = {
        name: 'TestGCC',
        cppStandard: 'c++20',
        defines: ['LINUX'],
        forcedInclude: ['global_prefix.h']
      };

      const gccCompiler: CompilerInfo = {
        name: 'GCC',
        type: 'gcc',
        path: '/usr/bin/g++'
      };

      const flags = manager.synthesizeProfileFlags(profile, '/home/user/project', gccCompiler);

      assert.ok(flags.includes('-xc++'));
      assert.ok(flags.includes('-std=c++20'));
      assert.ok(flags.includes('-DLINUX'));
      assert.ok(flags.includes('-include global_prefix.h'));

      manager.dispose();
    });
  });
});
