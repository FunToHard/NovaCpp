import './vscode-mock';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { generateProjectFiles } from '../src/project/template-files';
import { ProjectCreator } from '../src/project/project-creator';
import { ProjectCreationOptions } from '../src/project/project-types';

describe('Project Creator & Template Scaffolding', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'c-cpp-pro-creator-test-'));
  });

  afterEach(async () => {
    try {
      await fs.promises.rm(tmpDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup error
    }
  });

  describe('generateProjectFiles', () => {
    it('should generate CMake console application files for modern C++', () => {
      const opts: ProjectCreationOptions = {
        projectName: 'CoolApp',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'console',
        buildSystem: 'cmake',
        isWindows: true
      };

      const files = generateProjectFiles(opts);
      const relativePaths = files.map((f) => f.relativePath);

      assert.ok(relativePaths.includes('CMakeLists.txt'));
      assert.ok(relativePaths.includes('src/main.cpp'));
      assert.ok(relativePaths.includes('src/app.cpp'));
      assert.ok(relativePaths.includes('include/CoolApp/app.hpp'));
      assert.ok(relativePaths.includes('compile_flags.txt'));
      assert.ok(relativePaths.includes('.clangd'));
      assert.ok(relativePaths.includes('.vscode/tasks.json'));
      assert.ok(relativePaths.includes('.vscode/launch.json'));
      assert.ok(relativePaths.includes('.gitignore'));
      assert.ok(relativePaths.includes('README.md'));

      const cmake = files.find((f) => f.relativePath === 'CMakeLists.txt')!.content;
      assert.ok(cmake.includes('project(CoolApp LANGUAGES CXX)'));
      assert.ok(cmake.includes('set(CMAKE_CXX_STANDARD 20)'));
      assert.ok(cmake.includes('add_executable(${PROJECT_NAME}'));
      assert.ok(cmake.includes('set(CMAKE_EXPORT_COMPILE_COMMANDS ON)'));

      const main = files.find((f) => f.relativePath === 'src/main.cpp')!.content;
      assert.ok(main.includes('#include <iostream>'));
      assert.ok(main.includes('CoolApp::getGreeting()'));
    });

    it('should generate C console application files for C17', () => {
      const opts: ProjectCreationOptions = {
        projectName: 'CApp',
        targetDirectory: tmpDir,
        language: 'c',
        standard: 'c17',
        templateType: 'console',
        buildSystem: 'cmake',
        isWindows: false
      };

      const files = generateProjectFiles(opts);
      const relativePaths = files.map((f) => f.relativePath);

      assert.ok(relativePaths.includes('CMakeLists.txt'));
      assert.ok(relativePaths.includes('src/main.c'));
      assert.ok(relativePaths.includes('include/CApp/app.h'));

      const cmake = files.find((f) => f.relativePath === 'CMakeLists.txt')!.content;
      assert.ok(cmake.includes('project(CApp LANGUAGES C)'));
      assert.ok(cmake.includes('set(CMAKE_C_STANDARD 17)'));
    });

    it('should generate Visual Studio Solution and vcxproj for Windows', () => {
      const opts: ProjectCreationOptions = {
        projectName: 'WinApp',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'console',
        buildSystem: 'solution',
        isWindows: true
      };

      const files = generateProjectFiles(opts);
      const relativePaths = files.map((f) => f.relativePath);

      assert.ok(relativePaths.includes('WinApp.sln'));
      assert.ok(relativePaths.includes('WinApp.vcxproj'));
      assert.ok(relativePaths.includes('WinApp.vcxproj.filters'));

      const sln = files.find((f) => f.relativePath === 'WinApp.sln')!.content;
      assert.ok(sln.includes('Microsoft Visual Studio Solution File'));
      assert.ok(sln.includes('"WinApp", "WinApp.vcxproj"'));

      const vcxproj = files.find((f) => f.relativePath === 'WinApp.vcxproj')!.content;
      assert.ok(vcxproj.includes('<LanguageStandard>stdcpp20</LanguageStandard>'));
      assert.ok(vcxproj.includes('<AdditionalIncludeDirectories>include;'));
    });

    it('should generate POSIX Makefile for Linux/macOS', () => {
      const opts: ProjectCreationOptions = {
        projectName: 'UnixApp',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'console',
        buildSystem: 'makefile',
        isWindows: false
      };

      const files = generateProjectFiles(opts);
      const makefile = files.find((f) => f.relativePath === 'Makefile');
      assert.ok(makefile !== undefined);
      assert.ok(makefile!.content.includes('CXX ?= g++'));
      assert.ok(makefile!.content.includes('-std=c++20'));
      assert.ok(makefile!.content.includes('all: $(TARGET)'));
      assert.ok(makefile!.content.includes('clean:'));
    });

    it('should generate Shared Library with export headers', () => {
      const opts: ProjectCreationOptions = {
        projectName: 'MyMathLib',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'shared-lib',
        buildSystem: 'cmake',
        isWindows: true
      };

      const files = generateProjectFiles(opts);
      const relativePaths = files.map((f) => f.relativePath);

      assert.ok(relativePaths.includes('include/MyMathLib/export.hpp'));
      assert.ok(relativePaths.includes('include/MyMathLib/MyMathLib.hpp'));
      assert.ok(relativePaths.includes('src/MyMathLib.cpp'));
      assert.ok(relativePaths.includes('examples/main.cpp'));

      const exportHeader = files.find((f) => f.relativePath === 'include/MyMathLib/export.hpp')!.content;
      assert.ok(exportHeader.includes('__declspec(dllexport)'));
      assert.ok(exportHeader.includes('__declspec(dllimport)'));
      assert.ok(exportHeader.includes('MYMATHLIB_API'));
    });

    it('should generate Unit Test Suite with chosen framework', () => {
      const opts: ProjectCreationOptions = {
        projectName: 'TestProject',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'test-suite',
        buildSystem: 'cmake',
        testFramework: 'catch2',
        isWindows: true
      };

      const files = generateProjectFiles(opts);
      const testFile = files.find((f) => f.relativePath === 'tests/test_calculator.cpp');
      assert.ok(testFile !== undefined);
      assert.ok(testFile!.content.includes('<catch2/catch_test_macros.h>'));
      assert.ok(testFile!.content.includes('TEST_CASE'));
    });

    it('should generate lightweight project with compile_flags.txt', () => {
      const opts: ProjectCreationOptions = {
        projectName: 'SimpleProject',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'console',
        buildSystem: 'lightweight',
        isWindows: true
      };

      const files = generateProjectFiles(opts);
      const flagsFile = files.find((f) => f.relativePath === 'compile_flags.txt');
      assert.ok(flagsFile !== undefined);
      assert.ok(flagsFile!.content.includes('-Iinclude'));
      assert.ok(flagsFile!.content.includes('-std=c++20'));
    });
  });

  describe('ProjectCreator.scaffold', () => {
    it('should fail if project name is empty', async () => {
      const res = await ProjectCreator.scaffold({
        projectName: '   ',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'console',
        buildSystem: 'cmake'
      });

      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('empty'));
    });

    it('should fail if project name contains invalid characters', async () => {
      const res = await ProjectCreator.scaffold({
        projectName: 'Invalid/Name:Project',
        targetDirectory: tmpDir,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'console',
        buildSystem: 'cmake'
      });

      assert.strictEqual(res.success, false);
      assert.ok(res.error?.includes('invalid characters'));
    });

    it('should write all files to the target directory and return mainFilePath', async () => {
      const projectPath = path.join(tmpDir, 'MyAwesomeApp');
      const res = await ProjectCreator.scaffold({
        projectName: 'MyAwesomeApp',
        targetDirectory: projectPath,
        language: 'cpp',
        standard: 'c++20',
        templateType: 'console',
        buildSystem: 'cmake',
        isWindows: true
      });

      assert.strictEqual(res.success, true);
      assert.strictEqual(res.projectRoot, projectPath);
      assert.ok(res.filesCreated.length > 5);
      assert.ok(res.mainFilePath !== undefined);
      assert.ok(fs.existsSync(res.mainFilePath!));

      // Verify files exist on disk
      assert.ok(fs.existsSync(path.join(projectPath, 'CMakeLists.txt')));
      assert.ok(fs.existsSync(path.join(projectPath, 'src', 'main.cpp')));
      assert.ok(fs.existsSync(path.join(projectPath, 'include', 'MyAwesomeApp', 'app.hpp')));
      assert.ok(fs.existsSync(path.join(projectPath, '.vscode', 'tasks.json')));
      assert.ok(fs.existsSync(path.join(projectPath, '.vscode', 'launch.json')));
      assert.ok(fs.existsSync(path.join(projectPath, 'compile_flags.txt')));
      assert.ok(fs.existsSync(path.join(projectPath, '.clangd')));
    });
  });
});
