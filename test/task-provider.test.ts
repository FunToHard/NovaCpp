import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { isCppFile, getOutputBinaryPath, createBuildExecution } from '../src/tasks/runner';
import { NovaCppTaskProvider } from '../src/tasks/task-provider';
import { CompilerInfo } from '../src/prober/compiler-detector';
import { mockVscode } from './vscode-mock';

describe('Build Task Provider & Execution Engine', () => {
  describe('Runner Utilities', () => {
    it('should correctly identify C/C++ source files', () => {
      assert.strictEqual(isCppFile('main.cpp'), true);
      assert.strictEqual(isCppFile('helper.c'), true);
      assert.strictEqual(isCppFile('kernel.cu'), true);
      assert.strictEqual(isCppFile('code.cxx'), true);
      assert.strictEqual(isCppFile('code.cc'), true);
      assert.strictEqual(isCppFile('script.py'), false);
      assert.strictEqual(isCppFile('document.txt'), false);
      assert.strictEqual(isCppFile('package.json'), false);
    });

    it('should generate output binary path with correct extension', () => {
      const source = path.resolve('src/main.cpp');
      const outputPath = getOutputBinaryPath(source);
      const isWindows = process.platform === 'win32';
      const expectedExt = isWindows ? '.exe' : '';

      assert.strictEqual(path.extname(outputPath), expectedExt);
      assert.strictEqual(path.parse(outputPath).name, 'main');
    });

    it('should generate output binary inside build/ if directory exists', () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-task-'));
      const buildDir = path.join(tmpDir, 'build');
      fs.mkdirSync(buildDir, { recursive: true });

      try {
        const source = path.join(tmpDir, 'main.cpp');
        const outputPath = getOutputBinaryPath(source, tmpDir);
        assert.strictEqual(path.dirname(outputPath), buildDir);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should generate MSVC build arguments correctly', () => {
      const dummyMsvc: CompilerInfo = {
        name: 'MSVC',
        type: 'msvc',
        path: 'C:/MSVC/cl.exe'
      };

      const execution = createBuildExecution(dummyMsvc, 'C:/app/main.cpp', 'C:/app/main.exe', 'c++20');
      assert.strictEqual(execution.process, 'C:/MSVC/cl.exe');
      assert.ok(execution.args.includes('/EHsc'));
      assert.ok(execution.args.includes('/Zi'));
      assert.ok(execution.args.includes('/std:c++20'));
      assert.ok(execution.args.includes('/Fe:C:/app/main.exe'));
      assert.ok(execution.args.includes('C:/app/main.cpp'));
    });

    it('should generate GCC/Clang build arguments correctly', () => {
      const dummyGcc: CompilerInfo = {
        name: 'GCC',
        type: 'gcc',
        path: '/usr/bin/g++'
      };

      const execution = createBuildExecution(dummyGcc, '/app/main.cpp', '/app/main', 'c++23');
      assert.strictEqual(execution.process, '/usr/bin/g++');
      assert.ok(execution.args.includes('/app/main.cpp'));
      assert.ok(execution.args.includes('-std=c++23'));
      assert.ok(execution.args.includes('-g'));
      assert.ok(execution.args.includes('-o'));
      assert.ok(execution.args.includes('/app/main'));
    });
  });

  describe('NovaCppTaskProvider', () => {
    it('should provide build tasks when an active C++ editor exists', async () => {
      const provider = new NovaCppTaskProvider();

      // Mock active text editor
      mockVscode.window.activeTextEditor = {
        document: {
          fileName: 'F:/project/test.cpp',
          uri: mockVscode.Uri.file('F:/project/test.cpp')
        }
      };

      mockVscode.workspace.getWorkspaceFolder = () => ({
        uri: mockVscode.Uri.file('F:/project'),
        name: 'project',
        index: 0
      });

      const tasks = await provider.provideTasks();
      assert.strictEqual(tasks.length, 1);
      assert.strictEqual(tasks[0].name, 'C/C++: Build Active File');
      assert.strictEqual(tasks[0].definition.type, 'novacpp');
      assert.strictEqual(tasks[0].definition.task, 'buildActiveFile');
      assert.ok(tasks[0].execution);

      // Clean up mock
      delete mockVscode.window.activeTextEditor;
    });

    it('should return empty task list when no active C++ editor exists', async () => {
      const provider = new NovaCppTaskProvider();
      delete mockVscode.window.activeTextEditor;

      const tasks = await provider.provideTasks();
      assert.strictEqual(tasks.length, 0);
    });

    it('should resolve defined task correctly', async () => {
      const provider = new NovaCppTaskProvider();

      const taskToResolve: any = {
        definition: {
          type: 'novacpp',
          task: 'buildActiveFile',
          file: 'F:/project/main.cpp'
        },
        name: 'C/C++: Build Active File'
      };

      const resolved = await provider.resolveTask(taskToResolve);
      assert.ok(resolved);
      assert.strictEqual(resolved.name, 'C/C++: Build Active File');
      assert.ok(resolved.execution);
    });
  });
});
