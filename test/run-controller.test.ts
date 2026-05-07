import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { buildRunCommand, findLaunchVsDevShell, RunController } from '../src/tasks/run-controller';
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

  describe('findLaunchVsDevShell', () => {
    it('should find Launch-VsDevShell.ps1 on Windows for MSVC installations', () => {
      if (process.platform === 'win32') {
        const dummyMsvc: CompilerInfo = {
          name: 'MSVC 14.51',
          type: 'msvc',
          path: 'C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise\\VC\\Tools\\MSVC\\14.51.36231\\bin\\Hostx64\\x64\\cl.exe'
        };
        const script = findLaunchVsDevShell(dummyMsvc);
        assert.ok(script !== null, 'Should find Launch-VsDevShell.ps1 on Windows');
        assert.ok(script.endsWith('Launch-VsDevShell.ps1'));
      }
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

    it('should create Developer PowerShell for VS terminal when compiler is MSVC', async () => {
      if (process.platform === 'win32') {
        // Clear terminals in mock
        (vscode.window as any).terminals = [];

        const mockMsvc: CompilerInfo = {
          name: 'MSVC 14.51',
          type: 'msvc',
          path: 'C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise\\VC\\Tools\\MSVC\\14.51.36231\\bin\\Hostx64\\x64\\cl.exe'
        };

        const mockDetector = {
          getPreferredCompiler: async () => mockMsvc
        } as unknown as CompilerDetector;

        const controller = new RunController(mockDetector);
        const mockDoc = {
          fileName: 'F:/project/test.cpp',
          isDirty: false
        } as unknown as vscode.TextDocument;

        const success = await controller.runFile(mockDoc);
        assert.strictEqual(success, true);

        const terminals = (vscode.window as any).terminals;
        assert.ok(terminals.length > 0, 'Terminal must have been created');
        const created = terminals[0];
        assert.strictEqual(created.name, 'Developer PowerShell for VS');
        assert.strictEqual(created.options.shellPath, 'powershell.exe');
        assert.ok(created.options.shellArgs.some((arg: string) => arg.includes('Launch-VsDevShell.ps1')));
      }
    });

    it('should create standard NovaCpp Run terminal when compiler is GCC', async () => {
      (vscode.window as any).terminals = [];

      const mockGcc: CompilerInfo = {
        name: 'GCC 15.2',
        type: 'gcc',
        path: 'C:\\ProgramData\\mingw64\\bin\\g++.exe'
      };

      const mockDetector = {
        getPreferredCompiler: async () => mockGcc
      } as unknown as CompilerDetector;

      const controller = new RunController(mockDetector);
      const mockDoc = {
        fileName: 'F:/project/test.cpp',
        isDirty: false
      } as unknown as vscode.TextDocument;

      const success = await controller.runFile(mockDoc);
      assert.strictEqual(success, true);

      const terminals = (vscode.window as any).terminals;
      assert.ok(terminals.length > 0);
      assert.strictEqual(terminals[0].name, 'NovaCpp: Run');
    });
  });
});
