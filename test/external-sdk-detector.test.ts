import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  ExternalSdkDetector,
  compareSemverDesc
} from '../src/prober/external-sdk-detector';
import { FlagSynthesizer } from '../src/prober/flag-synthesizer';
import { VcpkgAdvisor } from '../src/ecosystem/vcpkg-advisor';

describe('External SDKs Auto-Discovery Subsystem', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-sdk-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('compareSemverDesc', () => {
    it('should sort semantic versions descending', () => {
      const versions = ['1.3.268.0', '1.3.296.0', '1.2.189.0', '1.3.290.0'];
      versions.sort(compareSemverDesc);
      assert.deepStrictEqual(versions, ['1.3.296.0', '1.3.290.0', '1.3.268.0', '1.2.189.0']);
    });

    it('should sort CUDA version tags descending', () => {
      const versions = ['v11.8', 'v12.4', 'v12.2', 'v10.2'];
      versions.sort(compareSemverDesc);
      assert.deepStrictEqual(versions, ['v12.4', 'v12.2', 'v11.8', 'v10.2']);
    });

    it('should sort Boost folder versions descending', () => {
      const versions = ['boost_1_83_0', 'boost_1_86_0', 'boost_1_78_0'];
      versions.sort(compareSemverDesc);
      assert.deepStrictEqual(versions, ['boost_1_86_0', 'boost_1_83_0', 'boost_1_78_0']);
    });
  });

  describe('Vulkan SDK Detection', () => {
    it('should detect Vulkan from VULKAN_SDK environment variable', () => {
      const vulkanDir = path.join(tempDir, 'VulkanSDK', '1.3.296.0');
      const incDir = path.join(vulkanDir, 'Include');
      fs.mkdirSync(incDir, { recursive: true });
      fs.writeFileSync(path.join(incDir, 'vulkan.h'), '// Vulkan Header');

      const result = ExternalSdkDetector.detectVulkan({
        env: { VULKAN_SDK: vulkanDir },
        allowFsScan: false
      });

      assert.ok(result);
      assert.strictEqual(result.name, 'Vulkan');
      assert.strictEqual(result.rootPath, vulkanDir);
      assert.strictEqual(result.source, 'env');
      assert.strictEqual(result.includePaths[0], incDir);
    });

    it('should return null when VULKAN_SDK is missing and fs scan is disabled', () => {
      const result = ExternalSdkDetector.detectVulkan({
        env: {},
        allowFsScan: false
      });
      assert.strictEqual(result, null);
    });
  });

  describe('raylib Detection', () => {
    it('should detect raylib from RAYLIB_DIR environment variable with src layout', () => {
      const raylibDir = path.join(tempDir, 'raylib');
      const srcDir = path.join(raylibDir, 'raylib', 'src');
      fs.mkdirSync(srcDir, { recursive: true });
      fs.writeFileSync(path.join(srcDir, 'raylib.h'), '// Raylib Header');

      const result = ExternalSdkDetector.detectRaylib({
        env: { RAYLIB_DIR: raylibDir },
        allowFsScan: false
      });

      assert.ok(result);
      assert.strictEqual(result.name, 'raylib');
      assert.strictEqual(result.source, 'env');
      assert.strictEqual(result.includePaths[0], srcDir);
    });

    it('should detect raylib from RAYLIB_PATH with include layout', () => {
      const raylibDir = path.join(tempDir, 'raylib_pkg');
      const incDir = path.join(raylibDir, 'include');
      fs.mkdirSync(incDir, { recursive: true });
      fs.writeFileSync(path.join(incDir, 'raylib.h'), '// Raylib Header');

      const result = ExternalSdkDetector.detectRaylib({
        env: { RAYLIB_PATH: raylibDir },
        allowFsScan: false
      });

      assert.ok(result);
      assert.strictEqual(result.name, 'raylib');
      assert.strictEqual(result.includePaths[0], incDir);
    });
  });

  describe('CUDA Toolkit Detection', () => {
    it('should detect CUDA from CUDA_PATH environment variable', () => {
      const cudaDir = path.join(tempDir, 'CUDA', 'v12.4');
      const incDir = path.join(cudaDir, 'include');
      fs.mkdirSync(incDir, { recursive: true });

      const result = ExternalSdkDetector.detectCuda({
        env: { CUDA_PATH: cudaDir },
        allowFsScan: false
      });

      assert.ok(result);
      assert.strictEqual(result.name, 'CUDA');
      assert.strictEqual(result.includePaths[0], incDir);
      assert.strictEqual(result.source, 'env');
    });
  });

  describe('Boost Detection', () => {
    it('should detect Boost from BOOST_ROOT environment variable', () => {
      const boostDir = path.join(tempDir, 'boost_1_86_0');
      const boostHdrDir = path.join(boostDir, 'boost');
      fs.mkdirSync(boostHdrDir, { recursive: true });
      fs.writeFileSync(path.join(boostHdrDir, 'version.hpp'), '#define BOOST_VERSION 108600');

      const result = ExternalSdkDetector.detectBoost({
        env: { BOOST_ROOT: boostDir },
        allowFsScan: false
      });

      assert.ok(result);
      assert.strictEqual(result.name, 'Boost');
      assert.strictEqual(result.includePaths[0], boostDir);
    });
  });

  describe('SDL Detection', () => {
    it('should detect SDL2 from SDL2_DIR environment variable', () => {
      const sdlDir = path.join(tempDir, 'SDL2');
      const incDir = path.join(sdlDir, 'include');
      fs.mkdirSync(incDir, { recursive: true });
      fs.writeFileSync(path.join(incDir, 'SDL.h'), '// SDL2 Header');

      const result = ExternalSdkDetector.detectSdl({
        env: { SDL2_DIR: sdlDir },
        allowFsScan: false
      });

      assert.ok(result);
      assert.strictEqual(result.name, 'SDL');
      assert.strictEqual(result.includePaths[0], incDir);
    });
  });

  describe('getAllIncludePaths & Normalization', () => {
    it('should aggregate, de-duplicate, and normalize all detected SDK includes', () => {
      const vulkanDir = path.join(tempDir, 'VulkanSDK');
      const vulkanInc = path.join(vulkanDir, 'Include');
      fs.mkdirSync(vulkanInc, { recursive: true });

      const raylibDir = path.join(tempDir, 'raylib');
      const raylibInc = path.join(raylibDir, 'include');
      fs.mkdirSync(raylibInc, { recursive: true });
      fs.writeFileSync(path.join(raylibInc, 'raylib.h'), '// raylib');

      const includes = ExternalSdkDetector.getAllIncludePaths({
        env: {
          VULKAN_SDK: vulkanDir,
          RAYLIB_DIR: raylibDir
        },
        allowFsScan: false
      });

      assert.ok(includes.length >= 2);
      // All paths should use forward slashes
      for (const inc of includes) {
        assert.ok(!inc.includes('\\'), `Expected forward slashes in path: ${inc}`);
      }
      assert.ok(includes.includes(vulkanInc.replace(/\\/g, '/')));
      assert.ok(includes.includes(raylibInc.replace(/\\/g, '/')));
    });
  });

  describe('VcpkgAdvisor External Headers Catalog', () => {
    it('should match Vulkan, raylib, SDL, and CUDA headers', () => {
      const vulkan = VcpkgAdvisor.matchHeader('#include <vulkan/vulkan.h>');
      assert.ok(vulkan);
      assert.strictEqual(vulkan.info.port, 'vulkan');

      const raylib = VcpkgAdvisor.matchHeader('#include "raylib.h"');
      assert.ok(raylib);
      assert.strictEqual(raylib.info.port, 'raylib');

      const sdl2 = VcpkgAdvisor.matchHeader('#include <SDL2/SDL.h>');
      assert.ok(sdl2);
      assert.strictEqual(sdl2.info.port, 'sdl2');

      const cuda = VcpkgAdvisor.matchHeader('#include <cuda_runtime.h>');
      assert.ok(cuda);
      assert.strictEqual(cuda.info.port, 'cuda');
    });
  });

  describe('FlagSynthesizer with External SDKs', () => {
    it('should append detected external SDK include flags', async () => {
      const synthesizer = new FlagSynthesizer(
        { detectCompilers: async () => [] } as any,
        { extractSystemIncludes: async () => ['C:\\MSVC\\include'] } as any
      );

      const compiler = {
        name: 'MSVC',
        type: 'msvc' as const,
        path: 'C:\\MSVC\\bin\\cl.exe',
        version: '19.38',
        target: 'x86_64-pc-windows-msvc',
        isDefault: true
      };

      const flags = await synthesizer.generateFlags(compiler, {
        standard: 'c++20',
        detectExternalSdks: false // should exclude when false
      });

      assert.ok(flags.includes('--driver-mode=cl'));
      assert.ok(flags.includes('-IC:/MSVC/include'));
    });
  });

  describe('syncWorkspaceClangdConfig', () => {
    it('should create .clangd file with CompileFlags.Add if none exists', () => {
      const vulkanDir = path.join(tempDir, 'VulkanSDK');
      const vulkanInc = path.join(vulkanDir, 'Include');
      fs.mkdirSync(vulkanInc, { recursive: true });

      const synced = ExternalSdkDetector.syncWorkspaceClangdConfig(tempDir, {
        env: { VULKAN_SDK: vulkanDir },
        allowFsScan: false
      });

      assert.strictEqual(synced, true);
      const clangdFile = path.join(tempDir, '.clangd');
      assert.ok(fs.existsSync(clangdFile));
      const content = fs.readFileSync(clangdFile, 'utf8');
      assert.ok(content.includes('CompileFlags:'));
      assert.ok(content.includes('Add:'));
      assert.ok(content.includes(vulkanInc.replace(/\\/g, '/')));
    });

    it('should update existing .clangd non-destructively', () => {
      const clangdFile = path.join(tempDir, '.clangd');
      fs.writeFileSync(
        clangdFile,
        'CompileFlags:\n  Add:\n    - "-std=c++20"\n',
        'utf8'
      );

      const raylibDir = path.join(tempDir, 'raylib');
      const raylibInc = path.join(raylibDir, 'include');
      fs.mkdirSync(raylibInc, { recursive: true });
      fs.writeFileSync(path.join(raylibInc, 'raylib.h'), '// raylib');

      const synced = ExternalSdkDetector.syncWorkspaceClangdConfig(tempDir, {
        env: { RAYLIB_DIR: raylibDir },
        allowFsScan: false
      });

      assert.strictEqual(synced, true);
      const updated = fs.readFileSync(clangdFile, 'utf8');
      assert.ok(updated.includes('"-std=c++20"'));
      assert.ok(updated.includes(raylibInc.replace(/\\/g, '/')));
    });
  });
});
