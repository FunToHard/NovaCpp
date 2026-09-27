import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractExpressionAtColumn, CppEvaluatableExpressionProvider } from '../src/debugger/process-picker';
import { LaunchGenerator } from '../src/debugger/launch-generator';
import { CppProDebugConfigurationProvider } from '../src/debugger/dap-session';

describe('Debugger Enhancements: Process Picker & Evaluatable Expressions', () => {
  describe('extractExpressionAtColumn', () => {
    it('should extract simple identifier', () => {
      const line = 'int totalCount = 42;';
      const col = line.indexOf('totalCount') + 2;
      const result = extractExpressionAtColumn(line, col);
      assert.ok(result);
      assert.strictEqual(result.text, 'totalCount');
    });

    it('should extract chained member dot expressions', () => {
      const line = 'std::string name = user.profile.firstName;';
      const col = line.indexOf('profile') + 1;
      const result = extractExpressionAtColumn(line, col);
      assert.ok(result);
      assert.strictEqual(result.text, 'user.profile.firstName');
    });

    it('should extract arrow pointer expressions', () => {
      const line = 'double val = engine->renderer->scale;';
      const col = line.indexOf('renderer') + 2;
      const result = extractExpressionAtColumn(line, col);
      assert.ok(result);
      assert.strictEqual(result.text, 'engine->renderer->scale');
    });

    it('should extract indexed array expressions', () => {
      const line = 'int item = grid[i][j];';
      const col = line.indexOf('grid') + 1;
      const result = extractExpressionAtColumn(line, col);
      assert.ok(result);
      assert.strictEqual(result.text, 'grid[i][j]');
    });

    it('should extract scoped identifiers', () => {
      const line = 'auto t = std::chrono::steady_clock::now();';
      const col = line.indexOf('steady_clock') + 3;
      const result = extractExpressionAtColumn(line, col);
      assert.ok(result);
      assert.strictEqual(result.text, 'std::chrono::steady_clock::now');
    });

    it('should return null for out of bounds column', () => {
      const line = 'int x = 1;';
      assert.strictEqual(extractExpressionAtColumn(line, 100), null);
    });
  });

  describe('CppEvaluatableExpressionProvider', () => {
    it('should provide EvaluatableExpression with correct range and text', () => {
      const provider = new CppEvaluatableExpressionProvider();
      const mockDoc = {
        lineAt: () => ({ text: 'int result = data.values[0];' })
      } as any;

      const pos = new vscode.Position(0, 15); // inside 'data.values[0]'
      const expr = provider.provideEvaluatableExpression(mockDoc, pos, {} as any) as vscode.EvaluatableExpression;

      assert.ok(expr);
      assert.strictEqual(expr.expression, 'data.values[0]');
    });
  });

  describe('LaunchGenerator & Attach Configuration', () => {
    it('should generate attach configuration with pickProcess command', () => {
      const attachConfig = LaunchGenerator.createAttachConfiguration();
      assert.strictEqual(attachConfig.request, 'attach');
      assert.strictEqual(attachConfig.type, 'c-cpp-pro-debug');
      assert.strictEqual(attachConfig.processId, '${command:c-cpp-pro.pickProcess}');
    });
  });

  describe('CppProDebugConfigurationProvider Attach & Remapping', () => {
    it('should resolve attach configuration without requiring program binary', async () => {
      const provider = new CppProDebugConfigurationProvider();
      const config: vscode.DebugConfiguration = {
        name: 'Attach Test',
        type: 'c-cpp-pro-debug',
        request: 'attach'
      };

      const resolved = await provider.resolveDebugConfiguration(undefined, config);
      assert.ok(resolved);
      assert.strictEqual(resolved.request, 'attach');
      assert.strictEqual(resolved.processId, '${command:c-cpp-pro.pickProcess}');
    });

    it('should dynamically execute c-cpp-pro.pickProcess when processId is command placeholder', async () => {
      const provider = new CppProDebugConfigurationProvider();
      const config: vscode.DebugConfiguration = {
        name: 'Attach Pick Process Test',
        type: 'c-cpp-pro-debug',
        request: 'attach',
        processId: '${command:c-cpp-pro.pickProcess}'
      };

      const origExecuteCommand = vscode.commands.executeCommand;
      try {
        (vscode.commands as any).executeCommand = async (cmd: string) => {
          if (cmd === 'c-cpp-pro.pickProcess') {
            return 4567;
          }
          return undefined;
        };

        const resolved = await provider.resolveDebugConfiguration(undefined, config);
        assert.ok(resolved);
        assert.strictEqual(resolved.processId, 4567);
      } finally {
        (vscode.commands as any).executeCommand = origExecuteCommand;
      }
    });

    it('should resolve sourceFileMap variables in launch configuration', async () => {
      const provider = new CppProDebugConfigurationProvider();
      const config: any = {
        name: 'Launch Test',
        type: 'c-cpp-pro-debug',
        request: 'launch',
        program: __filename,
        sourceFileMap: {
          '/build/source': '${workspaceFolder}/src'
        }
      };

      const mockFolder = { uri: vscode.Uri.file('F:/project') } as any;
      const resolved = await provider.resolveDebugConfiguration(mockFolder, config);
      assert.ok(resolved);
      assert.strictEqual(resolved.sourceFileMap['/build/source'], 'F:/project/src');
    });
  });
});
