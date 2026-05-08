import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import { SolutionManager } from '../src/solution/solution-manager';
import { CompilerDetector, CompilerInfo } from '../src/prober/compiler-detector';
import { SystemIncludeExtractor } from '../src/prober/system-includes';

describe('Visual Studio Solution Subsystem: SolutionManager', () => {
  let tempDir: string;
  let slnxFile: string;
  let vcxprojFile: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-solmgr-'));

    slnxFile = path.join(tempDir, 'TestSolution.slnx');
    const slnxContent = `
<Solution>
  <Configurations>
    <Platform Name="x64" />
    <Configuration Name="Debug" />
    <Configuration Name="Release" />
  </Configurations>
  <Project Path="TestProject.vcxproj" />
</Solution>
`;
    fs.writeFileSync(slnxFile, slnxContent, 'utf8');

    vcxprojFile = path.join(tempDir, 'TestProject.vcxproj');
    const vcxContent = `<?xml version="1.0" encoding="utf-8"?>
<Project DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup Label="ProjectConfigurations">
    <ProjectConfiguration Include="Debug|x64">
      <Configuration>Debug</Configuration>
      <Platform>x64</Platform>
    </ProjectConfiguration>
    <ProjectConfiguration Include="Release|x64">
      <Configuration>Release</Configuration>
      <Platform>x64</Platform>
    </ProjectConfiguration>
  </ItemGroup>
  <PropertyGroup Label="Globals">
    <ProjectGuid>{12345678-ABCD-EF01-2345-6789ABCDEF01}</ProjectGuid>
  </PropertyGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <ClCompile>
      <LanguageStandard>stdcpp20</LanguageStandard>
      <AdditionalIncludeDirectories>include;%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
      <PreprocessorDefinitions>WIN32;_DEBUG;%(PreprocessorDefinitions)</PreprocessorDefinitions>
    </ClCompile>
  </ItemDefinitionGroup>
  <ItemGroup>
    <ClCompile Include="main.cpp" />
  </ItemGroup>
</Project>`;
    fs.writeFileSync(vcxprojFile, vcxContent, 'utf8');
    fs.writeFileSync(path.join(tempDir, 'main.cpp'), 'int main() { return 0; }', 'utf8');
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should initialize and discover solutions in workspace', async () => {
    // Override workspace findFiles for this test
    const origFindFiles = vscode.workspace.findFiles;
    (vscode.workspace as any).findFiles = async () => {
      return [vscode.Uri.file(slnxFile)];
    };
    (vscode.workspace as any).workspaceFolders = [
      { uri: vscode.Uri.file(tempDir), name: 'TestWorkspace', index: 0 }
    ];

    const mockCompiler: CompilerInfo = {
      name: 'MSVC (x64)',
      type: 'msvc',
      path: 'C:/MSVC/cl.exe',
      is64Bit: true
    };

    const mockDetector = {
      getPreferredCompiler: async () => mockCompiler,
      findMsBuild: () => 'C:/MSVC/MSBuild.exe'
    } as unknown as CompilerDetector;

    const mockExtractor = {
      extractSystemIncludes: async () => ['C:/MSVC/include']
    } as unknown as SystemIncludeExtractor;

    let serverReloaded = false;
    const manager = new SolutionManager(mockDetector, mockExtractor, async () => {
      serverReloaded = true;
    });

    await manager.initialize();

    const activeSol = manager.getActiveSolution();
    assert.ok(activeSol);
    assert.strictEqual(activeSol.name, 'TestSolution');
    assert.strictEqual(activeSol.format, 'slnx');
    assert.strictEqual(activeSol.projects.length, 1);

    const activeConfig = manager.getActiveConfiguration();
    assert.strictEqual(activeConfig.key, 'Debug|x64');

    // Verify compile_commands.json was synthesized
    const compDbPath = path.join(tempDir, 'compile_commands.json');
    assert.ok(fs.existsSync(compDbPath));
    const compDb = JSON.parse(fs.readFileSync(compDbPath, 'utf8'));
    assert.strictEqual(compDb.length, 1);
    assert.ok(compDb[0].file.endsWith('main.cpp'));
    assert.ok(compDb[0].command.includes('--driver-mode=cl'));
    assert.ok(compDb[0].command.includes('-D_DEBUG'));
    assert.ok(serverReloaded);

    manager.dispose();
    (vscode.workspace as any).findFiles = origFindFiles;
  });
});
