import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractExpressionAtColumn } from '../src/debugger/process-picker';
import { LaunchGenerator } from '../src/debugger/launch-generator';
import { NovaCppDebugConfigurationProvider } from '../src/debugger/dap-session';
import { VsEnvironmentManager } from '../src/tasks/vs-environment-manager';

describe('Debugger, Runtime & Environment Edge Cases', () => {
  describe('extractExpressionAtColumn Edge Cases', () => {
    it('should return null when cursor is directly on whitespace', () => {
      const line = 'int x = 42;   int y = 10;';
      const res = extractExpressionAtColumn(line, 12); // column 12 is whitespace
      assert.strictEqual(res, null);
    });

    it('should correctly evaluate expression when cursor is on > of ->', () => {
      const line = 'auto name = player->get_name();';
      const arrowGtIndex = line.indexOf('->') + 1; // position of '>'
      const res = extractExpressionAtColumn(line, arrowGtIndex);
      assert.ok(res);
      assert.strictEqual(res.text, 'player->get_name');
    });

    it('should correctly evaluate expression when cursor is on second : of ::', () => {
      const line = 'std::vector<int> v;';
      const secondColonIndex = line.indexOf('::') + 1;
      const res = extractExpressionAtColumn(line, secondColonIndex);
      assert.ok(res);
      assert.strictEqual(res.text, 'std::vector<int>');
    });

    it('should handle nested array subscript expressions like grid[row][col]', () => {
      const line = 'matrix[row][col] = 100;';
      const matrixIndex = line.indexOf('matrix');
      const res = extractExpressionAtColumn(line, matrixIndex);
      assert.ok(res);
      assert.strictEqual(res.text, 'matrix[row][col]');

      const colIndex = line.indexOf('col');
      const resCol = extractExpressionAtColumn(line, colIndex);
      assert.ok(resCol);
      assert.strictEqual(resCol.text, 'col');
    });

    it('should handle parenthesized pointer dereference (*ptr).field', () => {
      const line = 'int val = (*ptr).count;';
      const countIndex = line.indexOf('count');
      const res = extractExpressionAtColumn(line, countIndex);
      assert.ok(res);
      assert.strictEqual(res.text, '(*ptr).count');

      const ptrIndex = line.indexOf('ptr');
      const resPtr = extractExpressionAtColumn(line, ptrIndex);
      assert.ok(resPtr);
      assert.strictEqual(resPtr.text, '*ptr');
    });

    it('should handle leading unary * and & operators', () => {
      const line = 'process(*data, &ref);';
      const dataIndex = line.indexOf('*data') + 1;
      const res = extractExpressionAtColumn(line, dataIndex);
      assert.ok(res);
      assert.strictEqual(res.text, '*data');

      const refIndex = line.indexOf('&ref') + 1;
      const resRef = extractExpressionAtColumn(line, refIndex);
      assert.ok(resRef);
      assert.strictEqual(resRef.text, '&ref');
    });
  });

  describe('LaunchGenerator Variable Substitution Edge Cases', () => {
    it('should safely substitute variables with paths containing dollar signs', () => {
      const workspaceRoot = 'C:/Users/$pecial/Project$1';
      const activeFile = 'C:/Users/$pecial/Project$1/src/$test.cpp';

      const resolved = LaunchGenerator.resolveVariables(
        '${workspaceFolder}/build/${fileBasenameNoExtension}',
        activeFile,
        workspaceRoot
      );

      assert.strictEqual(resolved, 'C:/Users/$pecial/Project$1/build/$test');
    });
  });

  describe('Attach Configuration & Variable Resolution Edge Cases', () => {
    it('should resolve variables in attach mode, normalize processId to number, and generate sourceMap array', async () => {
      const provider = new NovaCppDebugConfigurationProvider();
      const mockFolder = { uri: vscode.Uri.file('F:/my_project') } as any;

      const attachConfig: vscode.DebugConfiguration = {
        name: 'Attach to Server',
        type: 'novacpp-debug',
        request: 'attach',
        processId: '12345',
        cwd: '${workspaceFolder}',
        program: '${workspaceFolder}/bin/server',
        sourceFileMap: {
          '${workspaceFolder}': '/remote/src'
        }
      };

      const resolved = await provider.resolveDebugConfiguration(mockFolder, attachConfig);
      assert.ok(resolved);
      assert.strictEqual(resolved.processId, 12345);
      assert.strictEqual(resolved.cwd, 'F:/my_project');
      assert.strictEqual(resolved.program, 'F:/my_project/bin/server');
      assert.deepStrictEqual(resolved.sourceFileMap, {
        'F:/my_project': '/remote/src'
      });
      assert.ok(Array.isArray(resolved.sourceMap));
      assert.deepStrictEqual(resolved.sourceMap, [
        ['F:/my_project', '/remote/src']
      ]);
    });
  });

  describe('VS Environment Manager Case-Insensitive PATH & Variable Handling', () => {
    it('should case-insensitively detect and prepend PATH when set command outputs Path', () => {
      const mockCollection = {
        items: new Map<string, string>(),
        clear() {
          this.items.clear();
        },
        replace(key: string, val: string) {
          this.items.set(key, val);
        },
        prepend(key: string, val: string) {
          const prev = this.items.get(key) ?? '';
          this.items.set(key, val + prev);
        }
      };

      const mockContext = {
        environmentVariableCollection: mockCollection,
        workspaceState: {
          get: () => undefined,
          update: async () => {}
        }
      } as any;

      const envFromCmd = {
        Path: 'C:\\MSVC\\bin;C:\\Windows\\System32',
        Include: 'C:\\MSVC\\include',
        Lib: 'C:\\MSVC\\lib'
      };

      VsEnvironmentManager.applyEnvironment(mockContext, envFromCmd, 'MSVC Toolset (x64)');

      assert.ok(mockCollection.items.has('PATH'));
      assert.ok(mockCollection.items.get('PATH')!.includes('C:\\MSVC\\bin'));
      assert.ok(mockCollection.items.has('INCLUDE'));
      assert.strictEqual(mockCollection.items.get('INCLUDE'), 'C:\\MSVC\\include');
      assert.ok(mockCollection.items.has('LIB'));
      assert.strictEqual(mockCollection.items.get('LIB'), 'C:\\MSVC\\lib');
    });
  });
});
