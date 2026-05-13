import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { VcpkgAdvisor } from '../src/ecosystem/vcpkg-advisor';

describe('vcpkg Package Advisor & Ecosystem Integration', () => {
  describe('VcpkgAdvisor.matchHeader', () => {
    it('should match known library headers to vcpkg port definitions', () => {
      const match1 = VcpkgAdvisor.matchHeader('#include <nlohmann/json.hpp>');
      assert.ok(match1);
      assert.strictEqual(match1.info.port, 'nlohmann-json');

      const match2 = VcpkgAdvisor.matchHeader('#include <fmt/format.h>');
      assert.ok(match2);
      assert.strictEqual(match2.info.port, 'fmt');

      const match3 = VcpkgAdvisor.matchHeader('#include "spdlog/spdlog.h"');
      assert.ok(match3);
      assert.strictEqual(match3.info.port, 'spdlog');
    });

    it('should prefix-match modular libraries like boost and opencv', () => {
      const matchBoost = VcpkgAdvisor.matchHeader('#include <boost/container/vector.hpp>');
      assert.ok(matchBoost);
      assert.strictEqual(matchBoost.info.port, 'boost');

      const matchOpenCV = VcpkgAdvisor.matchHeader('#include <opencv2/features2d.hpp>');
      assert.ok(matchOpenCV);
      assert.strictEqual(matchOpenCV.info.port, 'opencv');
    });

    it('should return null for non-catalog or local headers', () => {
      const match = VcpkgAdvisor.matchHeader('#include "local_config.h"');
      assert.strictEqual(match, null);
    });
  });

  describe('VcpkgAdvisor.findVcpkgRoot', () => {
    it('should detect vcpkg root from environment or filesystem', () => {
      const root = VcpkgAdvisor.findVcpkgRoot();
      if (process.env.VCPKG_ROOT) {
        assert.strictEqual(root, process.env.VCPKG_ROOT);
      }
    });
  });

  describe('VcpkgAdvisor.provideCodeActions', () => {
    it('should offer copy, terminal run, and doc actions for matched headers', () => {
      const advisor = new VcpkgAdvisor();
      const mockDoc = {
        uri: vscode.Uri.file('F:/DEV/projects/NovaCpp/src/app.cpp'),
        lineAt: () => ({ text: '#include <fmt/format.h>' })
      } as any;

      const actions = advisor.provideCodeActions(
        mockDoc,
        new vscode.Range(0, 0, 0, 24),
        { diagnostics: [] } as any,
        {} as any
      ) as vscode.CodeAction[];

      assert.strictEqual(actions.length, 3);

      const copyAction = actions.find((a) => a.title.includes('Copy'));
      assert.ok(copyAction);
      assert.ok(copyAction.command);
      assert.deepStrictEqual(copyAction.command.arguments, ['vcpkg install fmt']);

      const termAction = actions.find((a) => a.title.includes('Run'));
      assert.ok(termAction);
      assert.deepStrictEqual(termAction.command?.arguments, ['vcpkg install fmt']);

      const docAction = actions.find((a) => a.title.includes('Open documentation'));
      assert.ok(docAction);
    });
  });

  describe('VcpkgAdvisor.findNodeAddonIncludePaths', () => {
    it('should detect node-addon-api or nan dependencies in package.json', async () => {
      const tempDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'novacpp-node-test-'));
      try {
        const pkg = {
          dependencies: {
            'node-addon-api': '^7.0.0'
          }
        };
        await fs.promises.writeFile(path.join(tempDir, 'package.json'), JSON.stringify(pkg));
        const addonDir = path.join(tempDir, 'node_modules', 'node-addon-api');
        await fs.promises.mkdir(addonDir, { recursive: true });

        const paths = VcpkgAdvisor.findNodeAddonIncludePaths(tempDir);
        assert.strictEqual(paths.length, 1);
        assert.strictEqual(paths[0], addonDir);
      } finally {
        await fs.promises.rm(tempDir, { recursive: true, force: true });
      }
    });
  });
});
