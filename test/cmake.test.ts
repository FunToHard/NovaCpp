import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { mockVscode } from './vscode-mock';
import { CMakeParser } from '../src/cmake/cmake-parser';
import { CMakeDetector } from '../src/cmake/cmake-detector';
import { CMakeManager } from '../src/cmake/cmake-manager';
import { FlagSynthesizer } from '../src/prober/flag-synthesizer';
import { CompilerDetector } from '../src/prober/compiler-detector';
import { SystemIncludeExtractor } from '../src/prober/system-includes';

describe('CMake Static Include Extraction & IntelliSense Integration', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'turbocpp-cmake-static-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
    mockVscode.workspace.workspaceFolders = [];
  });

  describe('CMakeParser Tokenization & Command Extraction', () => {
    it('should tokenize multi-line commands, quoted arguments, and strip comments', () => {
      const content = `
        # Top-level comment
        cmake_minimum_required(VERSION 3.20)
        project("My Complex App")

        # Multi-line include_directories
        include_directories(
          include
          "path with spaces/inc" # comment in args
          \${CMAKE_CURRENT_SOURCE_DIR}/ext
        )
      `;

      const commands = CMakeParser.tokenizeCommands(content);
      assert.strictEqual(commands.length, 3);
      assert.strictEqual(commands[0].name, 'cmake_minimum_required');
      assert.deepStrictEqual(commands[0].args, ['VERSION', '3.20']);

      assert.strictEqual(commands[1].name, 'project');
      assert.deepStrictEqual(commands[1].args, ['My Complex App']);

      assert.strictEqual(commands[2].name, 'include_directories');
      assert.strictEqual(commands[2].args[0], 'include');
      assert.strictEqual(commands[2].args[1], 'path with spaces/inc');
      assert.strictEqual(commands[2].args[2], '${CMAKE_CURRENT_SOURCE_DIR}/ext');
    });
  });

  describe('CMakeParser Include Directories & Target Extraction', () => {
    it('should parse include_directories, target_include_directories, and compile definitions', () => {
      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      const content = `
        cmake_minimum_required(VERSION 3.20)
        project(SampleApp CXX)

        set(CMAKE_CXX_STANDARD 20)
        set(CUSTOM_INC_DIR \${CMAKE_CURRENT_SOURCE_DIR}/custom/include)

        include_directories(
          SYSTEM include
          \${CUSTOM_INC_DIR}
        )

        add_definitions(-DAPP_DEBUG=1 -DVERSION_STR="1.0.0")

        add_executable(SampleApp main.cpp src/core.cpp)
        target_include_directories(SampleApp
          PRIVATE
            src/core
          PUBLIC
            include/public
        )
        target_compile_definitions(SampleApp PRIVATE ENABLE_LOGGING=1)

        add_library(MathLib STATIC math.cpp)
        target_include_directories(MathLib INTERFACE math/include)
      `;

      fs.writeFileSync(cmakeLists, content, 'utf8');

      const parsed = CMakeParser.parseWorkspace(tempDir);
      assert.ok(parsed);
      assert.strictEqual(parsed.cppStandard, 'c++20');
      assert.strictEqual(parsed.targets.length, 2);

      const norm = (p: string) => path.join(tempDir, p).replace(/\\/g, '/');

      const expectedIncludes = [
        norm('include'),
        norm('custom/include'),
        norm('src/core'),
        norm('include/public'),
        norm('math/include')
      ];

      for (const inc of expectedIncludes) {
        assert.ok(
          parsed.includeDirectories.includes(inc),
          `Missing expected include directory: ${inc}`
        );
      }

      assert.ok(parsed.compileDefinitions.includes('APP_DEBUG=1'));
      assert.ok(parsed.compileDefinitions.includes('VERSION_STR="1.0.0"'));
      assert.ok(parsed.compileDefinitions.includes('ENABLE_LOGGING=1'));
    });

    it('should recursively parse subdirectories via add_subdirectory', () => {
      const rootCMake = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(
        rootCMake,
        `
        project(MultiFolder)
        include_directories(common/include)
        add_subdirectory(engine)
        add_subdirectory(ui)
        `,
        'utf8'
      );

      // Create engine subdirectory
      const engineDir = path.join(tempDir, 'engine');
      fs.mkdirSync(engineDir, { recursive: true });
      fs.writeFileSync(
        path.join(engineDir, 'CMakeLists.txt'),
        `
        add_library(EngineCore core.cpp)
        target_include_directories(EngineCore PUBLIC \${CMAKE_CURRENT_SOURCE_DIR}/include)
        `,
        'utf8'
      );

      // Create ui subdirectory
      const uiDir = path.join(tempDir, 'ui');
      fs.mkdirSync(uiDir, { recursive: true });
      fs.writeFileSync(
        path.join(uiDir, 'CMakeLists.txt'),
        `
        add_library(UI widget.cpp)
        target_include_directories(UI PRIVATE \${CMAKE_CURRENT_SOURCE_DIR}/views)
        `,
        'utf8'
      );

      const parsed = CMakeParser.parseWorkspace(tempDir);
      assert.ok(parsed);

      const norm = (p: string) => path.join(tempDir, p).replace(/\\/g, '/');
      assert.ok(parsed.includeDirectories.includes(norm('common/include')));
      assert.ok(parsed.includeDirectories.includes(norm('engine/include')));
      assert.ok(parsed.includeDirectories.includes(norm('ui/views')));

      assert.strictEqual(parsed.targets.length, 2);
      assert.ok(parsed.targets.some((t) => t.name === 'EngineCore'));
      assert.ok(parsed.targets.some((t) => t.name === 'UI'));
    });

    it('should parse included .cmake files', () => {
      const rootCMake = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(
        rootCMake,
        `
        project(App)
        include(cmake/Dependencies.cmake)
        `,
        'utf8'
      );

      const cmakeDir = path.join(tempDir, 'cmake');
      fs.mkdirSync(cmakeDir, { recursive: true });
      fs.writeFileSync(
        path.join(cmakeDir, 'Dependencies.cmake'),
        `
        include_directories(deps/glm deps/stb)
        add_definitions(-DUSE_GLM=1)
        `,
        'utf8'
      );

      const parsed = CMakeParser.parseWorkspace(tempDir);
      assert.ok(parsed);

      const norm = (p: string) => path.join(tempDir, p).replace(/\\/g, '/');
      assert.ok(parsed.includeDirectories.includes(norm('deps/glm')));
      assert.ok(parsed.includeDirectories.includes(norm('deps/stb')));
      assert.ok(parsed.compileDefinitions.includes('USE_GLM=1'));
    });
  });

  describe('FlagSynthesizer with CMake Include Extraction', () => {
    it('should automatically append CMake include paths and definitions into synthesized flags', async () => {
      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(
        cmakeLists,
        `
        project(TestApp)
        include_directories(include third_party/catch2)
        add_definitions(-DCMAKE_APP_TEST=1)
        `,
        'utf8'
      );

      const synthesizer = new FlagSynthesizer(
        { detectCompilers: async () => [] } as any,
        { extractSystemIncludes: async () => ['C:/MSVC/include'] } as any
      );

      const compiler = {
        name: 'GCC',
        type: 'gcc' as const,
        path: '/usr/bin/g++',
        version: '13.2',
        target: 'x86_64-linux-gnu',
        isDefault: true
      };

      const flags = await synthesizer.generateFlags(compiler, {
        standard: 'c++20',
        workspaceRoot: tempDir,
        detectExternalSdks: false
      });

      const norm = (p: string) => path.join(tempDir, p).replace(/\\/g, '/');

      assert.ok(flags.includes(`-I${norm('include')}`));
      assert.ok(flags.includes(`-I${norm('third_party/catch2')}`));
      assert.ok(flags.includes('-DCMAKE_APP_TEST=1'));
    });
  });

  describe('CMakeManager: Static Database Synthesis & Menu', () => {
    it('should synthesize compile_commands.json from parsed CMakeLists.txt without running cmake CLI', async () => {
      mockVscode.workspace.workspaceFolders = [
        {
          uri: mockVscode.Uri.file(tempDir),
          name: 'cmake-test',
          index: 0
        }
      ];

      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(
        cmakeLists,
        `
        project(SampleProject)
        include_directories(include)
        add_executable(MyBinary main.cpp src/util.cpp)
        target_include_directories(MyBinary PRIVATE internal)
        `,
        'utf8'
      );

      const detector = new CompilerDetector();
      const extractor = new SystemIncludeExtractor();

      let reloaded = false;
      const manager = new CMakeManager(detector, extractor, async () => {
        reloaded = true;
      });

      await manager.initialize();

      assert.strictEqual(reloaded, true, 'Language server should reload when compilation database is generated');

      const compDbPath = path.join(tempDir, 'compile_commands.json');
      assert.ok(fs.existsSync(compDbPath), 'compile_commands.json must be generated directly from CMakeLists.txt');

      const content = fs.readFileSync(compDbPath, 'utf8');
      const entries = JSON.parse(content);
      assert.ok(Array.isArray(entries));
      assert.strictEqual(entries.length, 2);

      const files = entries.map((e: any) => e.file);
      assert.ok(files.some((f: string) => f.includes('main.cpp')));
      assert.ok(files.some((f: string) => f.includes('util.cpp')));

      // Check that include flags are present in arguments
      const args = entries[0].arguments;
      assert.ok(args.some((a: string) => a.includes('include')));

      manager.dispose();
    });

    it('should isolate target private includes and unwrap BUILD_INTERFACE generator expressions', () => {
      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(
        cmakeLists,
        `
        project(MultiTarget)
        include_directories(common_inc)
        add_executable(TargetA a.cpp)
        target_include_directories(TargetA PRIVATE target_a_private $<BUILD_INTERFACE:\${CMAKE_CURRENT_SOURCE_DIR}/build_only>)
        add_executable(TargetB b.cpp)
        target_include_directories(TargetB PRIVATE target_b_private)
        `,
        'utf8'
      );

      const parsed = CMakeParser.parseWorkspace(tempDir);
      assert.ok(parsed);
      assert.strictEqual(parsed.targets.length, 2);

      const targetA = parsed.targets.find(t => t.name === 'TargetA');
      const targetB = parsed.targets.find(t => t.name === 'TargetB');
      assert.ok(targetA && targetB);

      const norm = (p: string) => path.join(tempDir, p).replace(/\\/g, '/');
      assert.ok(targetA.includeDirectories.includes(norm('target_a_private')));
      assert.ok(targetA.includeDirectories.includes(norm('build_only')));
      assert.strictEqual(targetB.includeDirectories.includes(norm('target_a_private')), false);

      assert.ok(parsed.globalIncludeDirectories);
      assert.ok(parsed.globalIncludeDirectories.includes(norm('common_inc')));
      assert.strictEqual(parsed.globalIncludeDirectories.includes(norm('target_a_private')), false);
    });

    it('should emit pure C compiler flags and C standard for C source files', async () => {
      mockVscode.workspace.workspaceFolders = [
        {
          uri: { fsPath: tempDir },
          name: 'CTest',
          index: 0
        }
      ];

      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(
        cmakeLists,
        `
        project(MixedProject C CXX)
        set(CMAKE_C_STANDARD 11)
        set(CMAKE_CXX_STANDARD 17)
        add_executable(MixedApp main.cpp helper.c)
        `,
        'utf8'
      );

      const detector = new CompilerDetector();
      const extractor = new SystemIncludeExtractor();

      const manager = new CMakeManager(detector, extractor, async () => {});
      await manager.initialize();

      const compDbPath = path.join(tempDir, 'compile_commands.json');
      assert.ok(fs.existsSync(compDbPath));

      const content = fs.readFileSync(compDbPath, 'utf8');
      const entries = JSON.parse(content);
      assert.strictEqual(entries.length, 2);

      const cppEntry = entries.find((e: any) => e.file.endsWith('main.cpp'));
      const cEntry = entries.find((e: any) => e.file.endsWith('helper.c'));
      assert.ok(cppEntry && cEntry);

      const preferredCompiler = await detector.getPreferredCompiler();
      const isMsvc = preferredCompiler?.type === 'msvc';
      if (isMsvc) {
        assert.ok(cEntry.arguments.includes('/TC'), 'C file should compile with /TC on MSVC');
        assert.ok(cEntry.arguments.includes('/std:c11'), 'C file should specify C11 standard on MSVC');
        assert.ok(cppEntry.arguments.includes('/TP'), 'C++ file should compile with /TP on MSVC');
      } else {
        assert.ok(cEntry.arguments.includes('-xc'), 'C file should compile with -xc');
        assert.ok(cEntry.arguments.includes('-std=c11'), 'C file should specify -std=c11');
        assert.ok(cppEntry.arguments.includes('-xc++'), 'C++ file should compile with -xc++');
      }

      manager.dispose();
    });
  });

  describe('CMakeDetector', () => {
    it('should correctly detect CMake workspace from CMakeLists.txt presence', () => {
      assert.strictEqual(CMakeDetector.isCMakeWorkspace(tempDir), false);

      const cmakeLists = path.join(tempDir, 'CMakeLists.txt');
      fs.writeFileSync(cmakeLists, 'project(Test)\n', 'utf8');

      assert.strictEqual(CMakeDetector.isCMakeWorkspace(tempDir), true);
      assert.strictEqual(CMakeDetector.findCMakeLists(tempDir), cmakeLists);
    });
  });
});
