import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import { mockVscode } from './vscode-mock';
import { CMakeParser } from '../src/cmake/cmake-parser';
import { CMakeDetector } from '../src/cmake/cmake-detector';
import { CMakeManager } from '../src/cmake/cmake-manager';
import { CMakeTaskProvider } from '../src/cmake/cmake-task-provider';
import { CMakeTaskDefinition } from '../src/cmake/cmake-models';

describe('Full CMake Subsystem & IntelliSense Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-cmake-test-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
    mockVscode.workspace.workspaceFolders = [];
  });

  describe('CMakeParser (Static Include Directory & Define Extraction)', () => {
    it('should parse include_directories, target_include_directories, and compile definitions', () => {
      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      const content = [
        'cmake_minimum_required(VERSION 3.20)',
        'project(SampleApp CXX)',
        '',
        'set(CMAKE_CXX_STANDARD 23)',
        '',
        '# Global includes',
        'include_directories(SYSTEM include "${CMAKE_CURRENT_SOURCE_DIR}/ext/include")',
        '',
        'add_definitions(-DAPP_DEBUG=1 -DVERSION_STR="1.0.0")',
        '',
        'add_executable(SampleApp main.cpp)',
        'target_include_directories(SampleApp PRIVATE src/core PUBLIC include/public)',
        'target_compile_definitions(SampleApp PRIVATE ENABLE_LOGGING=1)',
        '',
        'add_library(MathLib STATIC math.cpp)',
        'target_include_directories(MathLib INTERFACE math/include)'
      ].join('\n');

      fs.writeFileSync(cmakeLists, content, 'utf8');

      const parsed = CMakeParser.parse(cmakeLists, tempDir);

      assert.strictEqual(parsed.cppStandard, 'c++23');
      assert.deepStrictEqual(parsed.targets, ['SampleApp', 'MathLib']);

      // Includes check
      const expectedIncludes = [
        path.join(tempDir, 'include').replace(/\\/g, '/'),
        path.join(tempDir, 'ext/include').replace(/\\/g, '/'),
        path.join(tempDir, 'src/core').replace(/\\/g, '/'),
        path.join(tempDir, 'include/public').replace(/\\/g, '/'),
        path.join(tempDir, 'math/include').replace(/\\/g, '/')
      ];

      for (const inc of expectedIncludes) {
        assert.ok(
          parsed.includeDirectories.includes(inc),
          `Missing expected include directory: ${inc}`
        );
      }

      // Definitions check
      assert.ok(parsed.compileDefinitions.includes('APP_DEBUG=1'));
      assert.ok(parsed.compileDefinitions.includes('VERSION_STR="1.0.0"'));
      assert.ok(parsed.compileDefinitions.includes('ENABLE_LOGGING=1'));
    });

    it('should return empty result safely when file does not exist', () => {
      const parsed = CMakeParser.parse(path.join(tempDir, 'NonExistent.txt'), tempDir);
      assert.strictEqual(parsed.includeDirectories.length, 0);
      assert.strictEqual(parsed.compileDefinitions.length, 0);
      assert.strictEqual(parsed.targets.length, 0);
    });
  });

  describe('CMakeDetector', () => {
    it('should identify CMake workspace and locate CMakeLists.txt', () => {
      assert.strictEqual(CMakeDetector.isCMakeWorkspace(tempDir), false);

      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(cmakeLists, 'cmake_minimum_required(VERSION 3.20)\n', 'utf8');

      assert.strictEqual(CMakeDetector.isCMakeWorkspace(tempDir), true);
      assert.strictEqual(CMakeDetector.findCMakeLists(tempDir), cmakeLists);
    });

    it('should discover compilation databases across nested build directories and presets', () => {
      // 1. Root database
      const rootDb = path.join(tempDir, 'compile_commands.json');
      fs.writeFileSync(rootDb, '[{"directory": "."}]', 'utf8');

      // 2. Nested out/build/x64-Debug database (newer mtime)
      const outBuild = path.join(tempDir, 'out', 'build', 'x64-Debug');
      fs.mkdirSync(outBuild, { recursive: true });
      const outDb = path.join(outBuild, 'compile_commands.json');
      fs.writeFileSync(outDb, '[{"directory": "out"}]', 'utf8');

      // Update mtime to be newer
      const futureTime = (Date.now() + 10000) / 1000;
      fs.utimesSync(outDb, futureTime, futureTime);

      const dbs = CMakeDetector.findCompilationDatabases(tempDir);
      assert.ok(dbs.length >= 2);
      // Newest should be first
      assert.strictEqual(path.normalize(dbs[0]), path.normalize(outDb));
    });

    it('should parse CMakePresets.json and extract configure presets', () => {
      const presetsFile = path.join(tempDir, 'CMakePresets.json');
      const content = JSON.stringify({
        version: 3,
        configurePresets: [
          {
            name: 'windows-default',
            displayName: 'Windows MSVC x64',
            description: 'Target Windows x64 with MSVC',
            binaryDir: '${sourceDir}/build/win-x64',
            generator: 'Ninja Multi-Config'
          },
          {
            name: 'linux-clang',
            displayName: 'Linux Clang Debug',
            binaryDir: '${sourceDir}/build/linux',
            generator: 'Ninja'
          }
        ]
      });

      fs.writeFileSync(presetsFile, content, 'utf8');

      const presets = CMakeDetector.readPresets(tempDir);
      assert.strictEqual(presets.length, 2);
      assert.strictEqual(presets[0].name, 'windows-default');
      assert.strictEqual(presets[0].displayName, 'Windows MSVC x64');
      assert.strictEqual(presets[1].name, 'linux-clang');
    });
  });

  describe('CMakeManager: Seamless Include Paths & Database Sync', () => {
    it('should initialize and seamlessly mirror build compile_commands.json to workspace root', async () => {
      mockVscode.workspace.workspaceFolders = [
        {
          uri: mockVscode.Uri.file(tempDir),
          name: 'cmake-test',
          index: 0
        }
      ];

      // Setup CMake project with build directory
      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(cmakeLists, 'project(TestApp)\n', 'utf8');

      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, { recursive: true });
      const buildCompDb = path.join(buildDir, 'compile_commands.json');
      const dummyCommands = JSON.stringify([
        {
          directory: tempDir.replace(/\\/g, '/'),
          command: 'clang++ -Icustom/include -c main.cpp',
          file: 'main.cpp'
        }
      ]);
      fs.writeFileSync(buildCompDb, dummyCommands, 'utf8');

      let serverReloaded = false;
      const manager = new CMakeManager(async () => {
        serverReloaded = true;
      });

      await manager.initialize();

      assert.strictEqual(serverReloaded, true, 'Language server should reload upon connecting compilation DB');

      // Verify compile_commands.json mirrored to root
      const rootDb = path.join(tempDir, 'compile_commands.json');
      assert.ok(fs.existsSync(rootDb), 'compile_commands.json must be synced to workspace root');
      const rootContent = fs.readFileSync(rootDb, 'utf8');
      assert.ok(rootContent.includes('custom/include'));

      // Verify .clangd has CompilationDatabase directive non-destructively
      const clangdFile = path.join(tempDir, '.clangd');
      assert.ok(fs.existsSync(clangdFile));
      const clangdContent = fs.readFileSync(clangdFile, 'utf8');
      assert.ok(clangdContent.includes('CompilationDatabase:'));

      manager.dispose();
    });

    it('should preserve existing user configuration in .clangd when adding CompilationDatabase', async () => {
      mockVscode.workspace.workspaceFolders = [
        {
          uri: mockVscode.Uri.file(tempDir),
          name: 'cmake-test-user-cfg',
          index: 0
        }
      ];

      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(cmakeLists, 'project(TestApp)\n', 'utf8');

      // User already has custom .clangd configuration
      const clangdFile = path.join(tempDir, '.clangd');
      fs.writeFileSync(
        clangdFile,
        'Diagnostics:\n  ClangTidy:\n    Add: [performance*]\nCompileFlags:\n  Add: ["-DUSER_DEF=1"]\n',
        'utf8'
      );

      const buildDir = path.join(tempDir, 'build');
      fs.mkdirSync(buildDir, { recursive: true });
      fs.writeFileSync(path.join(buildDir, 'compile_commands.json'), '[]', 'utf8');

      const manager = new CMakeManager(async () => {});
      await manager.initialize();

      const updatedClangd = fs.readFileSync(clangdFile, 'utf8');
      assert.ok(updatedClangd.includes('performance*'), 'Must preserve user Diagnostics');
      assert.ok(updatedClangd.includes('USER_DEF=1'), 'Must preserve user flags');
      assert.ok(updatedClangd.includes('CompilationDatabase:'), 'Must append CompilationDatabase');

      manager.dispose();
    });
  });

  describe('CMakeTaskProvider', () => {
    it('should generate configure, build, clean, and rebuild tasks', async () => {
      mockVscode.workspace.workspaceFolders = [
        {
          uri: mockVscode.Uri.file(tempDir),
          name: 'cmake-task-test',
          index: 0
        }
      ];

      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(cmakeLists, 'project(App)\n', 'utf8');

      const manager = new CMakeManager();
      await manager.initialize();

      const provider = new CMakeTaskProvider(manager);
      const tasks = await provider.provideTasks();

      assert.strictEqual(tasks.length, 4);

      // 1. Configure Task
      const configTask = tasks.find((t) => (t.definition as CMakeTaskDefinition).task === 'configure');
      assert.ok(configTask);
      assert.strictEqual(configTask.source, 'CMake');
      const configExec = configTask.execution as vscode.ProcessExecution;
      assert.ok(configExec.args.includes('-DCMAKE_EXPORT_COMPILE_COMMANDS=ON'));

      // 2. Build Task
      const buildTask = tasks.find((t) => (t.definition as CMakeTaskDefinition).task === 'build');
      assert.ok(buildTask);
      const buildExec = buildTask.execution as vscode.ProcessExecution;
      assert.ok(buildExec.args.includes('--build'));

      // 3. Clean Task
      const cleanTask = tasks.find((t) => (t.definition as CMakeTaskDefinition).task === 'clean');
      assert.ok(cleanTask);
      const cleanExec = cleanTask.execution as vscode.ProcessExecution;
      assert.ok(cleanExec.args.includes('clean'));

      // 4. Rebuild Task
      const rebuildTask = tasks.find((t) => (t.definition as CMakeTaskDefinition).task === 'rebuild');
      assert.ok(rebuildTask);
      const rebuildExec = rebuildTask.execution as vscode.ProcessExecution;
      assert.ok(rebuildExec.args.includes('--clean-first'));

      manager.dispose();
    });

    it('should resolve defined task dynamically', async () => {
      const manager = new CMakeManager();
      const provider = new CMakeTaskProvider(manager);

      const resolved = await provider.resolveTask({
        definition: { type: 'cmake', task: 'build', target: 'MyCustomTarget' } as CMakeTaskDefinition,
        name: 'CMake: Build',
        scope: vscode.TaskScope.Workspace
      } as any);

      assert.ok(resolved);
      const exec = resolved.execution as vscode.ProcessExecution;
      assert.ok(exec.args.includes('--build'));
      assert.ok(exec.args.includes('MyCustomTarget'));
    });
  });
});
