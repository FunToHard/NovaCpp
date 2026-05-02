import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildRunCommand, RunController } from '../src/tasks/run-controller';
import { CompilerInfo, CompilerDetector } from '../src/prober/compiler-detector';

describe('Run & Debug Controller (Title Bar Actions)', () => {
  describe('buildRunCommand', () => {
    it('should generate MSVC shell command on Windows with /Fe and terminal execution', () => {
      const msvc: CompilerInfo = {
        name: 'MSVC 14.51',
        type: 'msvc',
        path: 'C:\\Program Files\\Microsoft Visual Studio\\cl.exe'
      };

      const cmd = buildRunCommand(msvc, 'F:\\project\\main.cpp', 'F:\\project\\main.exe', 'c++20', true);
      assert.ok(cmd.includes('cl.exe'));
      assert.ok(cmd.includes('/std:c++20'));
      assert.ok(cmd.includes('/Fe:"F:\\project\\main.exe"'));
      assert.ok(cmd.includes('& "F:\\project\\main.exe"'));
    });

    it('should generate GCC/Clang shell command on Windows with static libs and execution', () => {
      const gcc: CompilerInfo = {
        name: 'GCC 15.2',
        type: 'gcc',
        path: 'C:\\ProgramData\\mingw64\\bin\\g++.exe'
      };

      const cmd = buildRunCommand(gcc, 'F:\\project\\main.cpp', 'F:\\project\\main.exe', 'c++20', true);
      assert.ok(cmd.includes('g++.exe'));
      assert.ok(cmd.includes('-std=c++20'));
      assert.ok(cmd.includes('-static-libgcc'));
      assert.ok(cmd.includes('-o "F:\\project\\main.exe"'));
      assert.ok(cmd.includes('& "F:\\project\\main.exe"'));
    });

    it('should generate POSIX command with && operator', () => {
      const clang: CompilerInfo = {
        name: 'Clang 18',
        type: 'clang',
        path: '/usr/bin/clang++'
      };

      const cmd = buildRunCommand(clang, '/app/main.cpp', '/app/main', 'c++20', false);
      assert.ok(cmd.includes('/usr/bin/clang++'));
      assert.ok(cmd.includes('&& "/app/main"'));
    });
  });

  describe('RunController', () => {
    it('should reject running non-C/C++ documents', async () => {
      const mockDetector = {
        getPreferredCompiler: async () => null
      } as unknown as CompilerDetector;

      const controller = new RunController(mockDetector);
      const mockDoc = {
        fileName: 'F:/project/style.css',
        isDirty: false
      } as unknown as vscode.TextDocument;

      const success = await controller.runFile(mockDoc);
      assert.strictEqual(success, false);
    });

    it('should reject debugging non-C/C++ documents', async () => {
      const mockDetector = {
        getPreferredCompiler: async () => null
      } as unknown as CompilerDetector;

      const controller = new RunController(mockDetector);
      const mockDoc = {
        fileName: 'F:/project/readme.txt',
        isDirty: false
      } as unknown as vscode.TextDocument;

      const success = await controller.debugFile(mockDoc);
      assert.strictEqual(success, false);
    });
  });
});
