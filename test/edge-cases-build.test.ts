import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import {
  parseSlnx,
  parseVcxproj,
  readFileWithEncoding
} from '../src/solution/sln-parser';
import { CompilationDatabaseGenerator } from '../src/solution/compilation-database-generator';
import { parseDotConfig } from '../src/config/profile-manager';
import { VcpkgAdvisor } from '../src/ecosystem/vcpkg-advisor';
import { CompilerInfo } from '../src/prober/compiler-detector';
import { SolutionModel, VcxProjectModel } from '../src/solution/solution-models';

describe('Build, Solutions & Configuration Edge Cases', () => {
  describe('Encoding & BOM Detection (readFileWithEncoding)', () => {
    let tmpDir: string;

    beforeEach(async () => {
      tmpDir = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'novacpp-enc-test-'));
    });

    afterEach(async () => {
      try {
        await fs.promises.rm(tmpDir, { recursive: true, force: true });
      } catch {}
    });

    it('should correctly read UTF-16 LE files with BOM', async () => {
      const filePath = path.join(tmpDir, 'test_utf16le.sln');
      const text = 'Microsoft Visual Studio Solution File, Format Version 12.00\n';
      const buf = Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(text, 'utf16le')]);
      await fs.promises.writeFile(filePath, buf);

      const readText = await readFileWithEncoding(filePath);
      assert.strictEqual(readText.trim(), text.trim());
    });

    it('should correctly read UTF-8 files with BOM', async () => {
      const filePath = path.join(tmpDir, 'test_utf8bom.sln');
      const text = 'Project("{8BC9CEB8}") = "App", "App.vcxproj"\n';
      const buf = Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')]);
      await fs.promises.writeFile(filePath, buf);

      const readText = await readFileWithEncoding(filePath);
      assert.strictEqual(readText.trim(), text.trim());
    });

    it('should detect UTF-16 LE without BOM by inspecting null bytes', async () => {
      const filePath = path.join(tmpDir, 'test_nobom_utf16.sln');
      const text = 'Microsoft Visual Studio Solution\n';
      const buf = Buffer.from(text, 'utf16le');
      await fs.promises.writeFile(filePath, buf);

      const readText = await readFileWithEncoding(filePath);
      assert.strictEqual(readText.trim(), text.trim());
    });
  });

  describe('Slnx XML Comments & Quoting Edge Cases', () => {
    it('should completely ignore projects commented out in XML comments', () => {
      const slnxContent = `
<Solution>
  <Configurations>
    <Configuration Name="Debug" />
    <Configuration Name="Release" />
    <Platform Name="x64" />
  </Configurations>
  <!--
  <Project Path="src/OldLegacy/OldLegacy.vcxproj" />
  -->
  <Project Path="src/ActiveEngine/ActiveEngine.vcxproj" />
</Solution>
      `;
      const model = parseSlnx(slnxContent, 'F:/project/solution.slnx');
      assert.strictEqual(model.projects.length, 1);
      assert.strictEqual(model.projects[0].name, 'ActiveEngine');
    });
  });

  describe('MSBuild .vcxproj Parsing Edge Cases', () => {
    it('should strip quotes, expand $(ProjectDir), and merge cascaded ItemDefinitionGroup options', () => {
      const vcxContent = `
<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup Label="ProjectConfigurations">
    <ProjectConfiguration Include="Debug|x64">
      <Configuration>Debug</Configuration>
      <Platform>x64</Platform>
    </ProjectConfiguration>
  </ItemGroup>
  <PropertyGroup Label="Globals">
    <ProjectGuid>{12345678-ABCD-1234-ABCD-1234567890AB}</ProjectGuid>
  </PropertyGroup>
  <ItemDefinitionGroup>
    <ClCompile>
      <AdditionalIncludeDirectories>"C:\\CommonIncludes";%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
      <PreprocessorDefinitions>COMMON_DEF;%(PreprocessorDefinitions)</PreprocessorDefinitions>
    </ClCompile>
  </ItemDefinitionGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <ClCompile>
      <AdditionalIncludeDirectories>$(ProjectDir)include;"$(SolutionDir)shared";%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
      <PreprocessorDefinitions>DEBUG_BUILD;%(PreprocessorDefinitions)</PreprocessorDefinitions>
    </ClCompile>
  </ItemDefinitionGroup>
  <ItemGroup>
    <ClCompile Include="src\\main.cpp" />
  </ItemGroup>
</Project>
      `;

      const proj = parseVcxproj(vcxContent, 'F:/MySolution/MyProject/MyProject.vcxproj');
      assert.ok(proj);

      const debugOpts = proj.compileOptionsByConfig.get('Debug|x64');
      assert.ok(debugOpts);

      // Verify cascading: common defs and debug defs are merged
      assert.ok(debugOpts.preprocessorDefinitions.includes('COMMON_DEF'));
      assert.ok(debugOpts.preprocessorDefinitions.includes('DEBUG_BUILD'));

      // Verify includes: quotes stripped and $(ProjectDir)/$(SolutionDir) expanded
      const normalizedIncs = debugOpts.includeDirectories.map((d) => d.replace(/\\/g, '/'));
      assert.ok(normalizedIncs.some((d) => d.includes('C:/CommonIncludes')));
      assert.ok(normalizedIncs.some((d) => d.includes('F:/MySolution/MyProject/include')));
      assert.ok(normalizedIncs.some((d) => d.includes('F:/MySolution/shared')));
    });
  });

  describe('CompilationDatabaseGenerator Headers & Arguments Array', () => {
    it('should emit both arguments array and command string, and include header files', () => {
      const generator = new CompilationDatabaseGenerator();
      const mockSolution: SolutionModel = {
        format: 'sln',
        filePath: 'F:/project/test.sln',
        name: 'TestSolution',
        configurations: [{ configuration: 'Debug', platform: 'x64', key: 'Debug|x64' }],
        projects: []
      };

      const mockProject: VcxProjectModel = {
        filePath: 'F:/project/App/App.vcxproj',
        name: 'App',
        configurations: [{ configuration: 'Debug', platform: 'x64', key: 'Debug|x64' }],
        compileOptionsByConfig: new Map(),
        defaultCompileOptions: {
          includeDirectories: ['F:/project/App/include'],
          preprocessorDefinitions: ['UNICODE'],
          languageStandard: 'c++20'
        },
        sourceFiles: ['F:/project/App/src/main.cpp'],
        headerFiles: ['F:/project/App/include/app.hpp']
      };

      const compiler: CompilerInfo = {
        name: 'Clang',
        path: 'C:/LLVM/bin/clang++.exe',
        type: 'clang',
        version: '18.1.0'
      };

      const entries = generator.generateEntries(
        mockSolution,
        [mockProject],
        compiler,
        [],
        undefined,
        { includeHeaders: true }
      );
      assert.strictEqual(entries.length, 2); // main.cpp and app.hpp

      const headerEntry = entries.find((e) => e.file.endsWith('app.hpp'));
      assert.ok(headerEntry);
      assert.ok(headerEntry.command.includes('-xc++-header'));
      assert.ok(Array.isArray(headerEntry.arguments));
      assert.ok(headerEntry.arguments.includes('-xc++-header'));

      const sourceEntry = entries.find((e) => e.file.endsWith('main.cpp'));
      assert.ok(sourceEntry);
      assert.ok(Array.isArray(sourceEntry.arguments));
      assert.ok(sourceEntry.arguments.includes('-xc++'));
    });
  });

  describe('Kconfig (.config) Parsing Edge Cases', () => {
    it('should strip inline comments and ignore disabled (n) flags', () => {
      const content = `
CONFIG_FOO=y
CONFIG_BAR=n # Disabled feature
CONFIG_BAZ="special value" # inline comment
CONFIG_NUM=128 /* timeout ms */
# CONFIG_NOT_SET is not set
CONFIG_MULTI_WORD="hello world with spaces"
      `;

      const defines = parseDotConfig(content);
      assert.ok(defines.includes('CONFIG_FOO=1'));
      assert.ok(!defines.some((d) => d.startsWith('CONFIG_BAR')));
      assert.ok(defines.includes('CONFIG_BAZ="special value"'));
      assert.ok(defines.includes('CONFIG_NUM=128'));
      assert.ok(defines.includes('CONFIG_MULTI_WORD="hello world with spaces"'));
    });
  });

  describe('vcpkg Advisor Backslash Header Matching', () => {
    it('should match headers with Windows backslashes', () => {
      const match1 = VcpkgAdvisor.matchHeader('#include <nlohmann\\json.hpp>');
      assert.ok(match1);
      assert.strictEqual(match1.info.port, 'nlohmann-json');

      const match2 = VcpkgAdvisor.matchHeader('#include <boost\\container\\vector.hpp>');
      assert.ok(match2);
      assert.strictEqual(match2.info.port, 'boost');
    });
  });
});
