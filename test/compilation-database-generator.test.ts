import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { CompilationDatabaseGenerator } from '../src/solution/compilation-database-generator';
import { SolutionModel, VcxProjectModel } from '../src/solution/solution-models';
import { CompilerInfo } from '../src/prober/compiler-detector';

describe('Visual Studio Solution Subsystem: Compilation Database Generator', () => {
  const generator = new CompilationDatabaseGenerator();

  const mockSolution: SolutionModel = {
    format: 'slnx',
    filePath: 'F:/Projects/Engine/Engine.slnx',
    name: 'Engine',
    configurations: [
      { configuration: 'Debug', platform: 'x64', key: 'Debug|x64' },
      { configuration: 'Release', platform: 'x64', key: 'Release|x64' }
    ],
    projects: [
      {
        name: 'Core',
        relativePath: 'Core/Core.vcxproj',
        fullPath: 'F:/Projects/Engine/Core/Core.vcxproj'
      }
    ]
  };

  const mockProject: VcxProjectModel = {
    filePath: 'F:/Projects/Engine/Core/Core.vcxproj',
    name: 'Core',
    configurations: [
      { configuration: 'Debug', platform: 'x64', key: 'Debug|x64' }
    ],
    compileOptionsByConfig: new Map([
      [
        'Debug|x64',
        {
          includeDirectories: ['F:/Projects/Engine/Core/include', 'F:/Projects/Engine/Common'],
          preprocessorDefinitions: ['WIN32', '_DEBUG', 'ENGINE_CORE'],
          languageStandard: 'c++20',
          additionalOptions: ['/utf-8']
        }
      ]
    ]),
    defaultCompileOptions: {
      includeDirectories: [],
      preprocessorDefinitions: [],
      languageStandard: 'c++20'
    },
    sourceFiles: [
      'F:/Projects/Engine/Core/src/memory.cpp',
      'F:/Projects/Engine/Core/src/logger.cpp'
    ],
    headerFiles: [
      'F:/Projects/Engine/Core/include/memory.h'
    ]
  };

  const mockMsvc: CompilerInfo = {
    name: 'MSVC 14.51 (x64)',
    type: 'msvc',
    path: 'C:/Program Files/MSVC/bin/Hostx64/x64/cl.exe',
    is64Bit: true
  };

  const mockGcc: CompilerInfo = {
    name: 'GCC 15.2.0',
    type: 'gcc',
    path: 'C:/MinGW/bin/g++.exe'
  };

  it('should synthesize MSVC compile_commands.json entries with driver mode and defines', () => {
    const systemIncludes = ['C:/Program Files/MSVC/include', 'C:/Program Files/Windows Kits/10/Include/ucrt'];
    const entries = generator.generateEntries(
      mockSolution,
      [mockProject],
      mockMsvc,
      systemIncludes,
      'Debug|x64'
    );

    assert.strictEqual(entries.length, 2);
    const entry0 = entries[0];
    assert.strictEqual(entry0.file, 'F:/Projects/Engine/Core/src/memory.cpp');
    assert.strictEqual(entry0.directory, 'F:/Projects/Engine/Core');
    assert.ok(entry0.command.includes('--driver-mode=cl'));
    assert.ok(entry0.command.includes('/std:c++20'));
    assert.ok(entry0.command.includes('/TP'));
    assert.ok(entry0.command.includes('/EHsc'));
    assert.ok(entry0.command.includes('-D_DEBUG'));
    assert.ok(entry0.command.includes('-DENGINE_CORE'));
    assert.ok(entry0.command.includes('/utf-8'));
    assert.ok(entry0.command.includes('-I"F:/Projects/Engine/Core/include"'));
    assert.ok(entry0.command.includes('-I"C:/Program Files/MSVC/include"'));
    assert.ok(entry0.command.endsWith('/c "F:/Projects/Engine/Core/src/memory.cpp"'));
  });

  it('should synthesize GCC compile_commands.json entries when GCC compiler is used', () => {
    const entries = generator.generateEntries(
      mockSolution,
      [mockProject],
      mockGcc,
      [],
      'Debug|x64'
    );

    assert.strictEqual(entries.length, 2);
    const entry1 = entries[1];
    assert.strictEqual(entry1.file, 'F:/Projects/Engine/Core/src/logger.cpp');
    assert.ok(entry1.command.includes('-std=c++20'));
    assert.ok(entry1.command.includes('-Wall'));
    assert.ok(entry1.command.includes('-D_DEBUG'));
    assert.ok(entry1.command.endsWith('-c "F:/Projects/Engine/Core/src/logger.cpp"'));
  });

  it('should write valid compile_commands.json to disk', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-compdb-'));
    const targetFile = path.join(tempDir, 'compile_commands.json');

    const entries = generator.generateEntries(mockSolution, [mockProject], mockMsvc, []);
    const writtenPath = await generator.writeCompilationDatabase(targetFile, entries);

    assert.strictEqual(writtenPath, targetFile);
    assert.ok(fs.existsSync(targetFile));

    const content = fs.readFileSync(targetFile, 'utf8');
    const parsed = JSON.parse(content);
    assert.strictEqual(parsed.length, 2);
    assert.strictEqual(parsed[0].file, 'F:/Projects/Engine/Core/src/memory.cpp');

    // Clean up
    fs.rmSync(tempDir, { recursive: true, force: true });
  });
});
