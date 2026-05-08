import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import {
  parseSln,
  parseSlnx,
  parseVcxproj,
  normalizeLanguageStandard
} from '../src/solution/sln-parser';

describe('Visual Studio Solution Subsystem: Parsers', () => {
  describe('normalizeLanguageStandard', () => {
    it('should map Visual Studio standards to standard C++ flags', () => {
      assert.strictEqual(normalizeLanguageStandard('stdcpplatest'), 'c++23');
      assert.strictEqual(normalizeLanguageStandard('stdcpp23'), 'c++23');
      assert.strictEqual(normalizeLanguageStandard('stdcpp20'), 'c++20');
      assert.strictEqual(normalizeLanguageStandard('stdcpp17'), 'c++17');
      assert.strictEqual(normalizeLanguageStandard('stdcpp14'), 'c++14');
      assert.strictEqual(normalizeLanguageStandard(undefined), 'c++20');
    });
  });

  describe('parseSln (Traditional Solution)', () => {
    it('should parse C++ projects and configurations from .sln text', () => {
      const sampleSln = `
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.10.34928.147
MinimumVisualStudioVersion = 10.0.40219.1
Project("{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}") = "NovaGeometry", "Geometry\\NovaGeometry.vcxproj", "{A1B2C3D4-E5F6-7890-1234-567890ABCDEF}"
EndProject
Project("{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}") = "NovaApp", "App\\NovaApp.vcxproj", "{B2C3D4E5-F6A7-8901-2345-678901BCDEFG}"
EndProject
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "Solution Items", "Solution Items", "{C3D4E5F6-A7B8-9012-3456-789012CDEF01}"
	ProjectSection(SolutionItems) = preProject
		README.md = README.md
	EndProjectSection
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|x64 = Debug|x64
		Debug|ARM64 = Debug|ARM64
		Release|x64 = Release|x64
		Release|ARM64 = Release|ARM64
	EndGlobalSection
EndGlobal
`;

      const parsed = parseSln(sampleSln, 'F:/Projects/NovaEngine/NovaEngine.sln');
      assert.strictEqual(parsed.format, 'sln');
      assert.strictEqual(parsed.name, 'NovaEngine');
      assert.strictEqual(parsed.projects.length, 2); // Only .vcxproj, ignores Solution Items folder

      assert.strictEqual(parsed.projects[0].name, 'NovaGeometry');
      assert.strictEqual(parsed.projects[0].relativePath, 'Geometry/NovaGeometry.vcxproj');
      assert.strictEqual(
        parsed.projects[0].fullPath.replace(/\\/g, '/').toLowerCase(),
        'f:/projects/novaengine/geometry/novageometry.vcxproj'
      );

      assert.strictEqual(parsed.projects[1].name, 'NovaApp');
      assert.strictEqual(parsed.projects[1].relativePath, 'App/NovaApp.vcxproj');

      assert.strictEqual(parsed.configurations.length, 4);
      assert.strictEqual(parsed.configurations[0].key, 'Debug|x64');
      assert.strictEqual(parsed.configurations[0].configuration, 'Debug');
      assert.strictEqual(parsed.configurations[0].platform, 'x64');
      assert.strictEqual(parsed.configurations[2].key, 'Release|x64');
    });
  });

  describe('parseSlnx (Modern XML Solution)', () => {
    it('should parse modern XML .slnx solutions with configurations and folders', () => {
      const sampleSlnx = `
<Solution>
  <Configurations>
    <Platform Name="x64" />
    <Platform Name="ARM64" />
    <Configuration Name="Debug" />
    <Configuration Name="Release" />
  </Configurations>
  <Folder Name="/Engine/">
    <Project Path="Engine/Core/Core.vcxproj" />
    <Project Path="Engine/Renderer/Renderer.vcxproj" Id="11223344-5566-7788-9900-aabbccddeeff" />
  </Folder>
  <Project Path="Apps/Editor/Editor.vcxproj" />
  <File Path="Directory.Build.props" />
</Solution>
`;

      const parsed = parseSlnx(sampleSlnx, 'F:/Projects/GameEngine/GameEngine.slnx');
      assert.strictEqual(parsed.format, 'slnx');
      assert.strictEqual(parsed.name, 'GameEngine');
      assert.strictEqual(parsed.projects.length, 3);

      assert.strictEqual(parsed.projects[0].name, 'Core');
      assert.strictEqual(parsed.projects[0].relativePath, 'Engine/Core/Core.vcxproj');
      assert.strictEqual(
        parsed.projects[0].fullPath.replace(/\\/g, '/').toLowerCase(),
        'f:/projects/gameengine/engine/core/core.vcxproj'
      );

      assert.strictEqual(parsed.projects[1].name, 'Renderer');
      assert.strictEqual(parsed.projects[1].guid, '11223344-5566-7788-9900-aabbccddeeff');

      assert.strictEqual(parsed.projects[2].name, 'Editor');

      // 2 configs * 2 platforms = 4 combinations
      assert.strictEqual(parsed.configurations.length, 4);
      assert.ok(parsed.configurations.some((c) => c.key === 'Debug|x64'));
      assert.ok(parsed.configurations.some((c) => c.key === 'Release|x64'));
      assert.ok(parsed.configurations.some((c) => c.key === 'Debug|ARM64'));
      assert.ok(parsed.configurations.some((c) => c.key === 'Release|ARM64'));
    });
  });

  describe('parseVcxproj (MSBuild C++ Project)', () => {
    it('should extract source files, include directories, macros, and flags', () => {
      const sampleVcxproj = `<?xml version="1.0" encoding="utf-8"?>
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
    <ProjectGuid>{ABCDEF12-3456-7890-ABCD-EF1234567890}</ProjectGuid>
    <RootNamespace>GeometryEngine</RootNamespace>
    <ConfigurationType>Application</ConfigurationType>
  </PropertyGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <ClCompile>
      <WarningLevel>Level4</WarningLevel>
      <LanguageStandard>stdcpp20</LanguageStandard>
      <AdditionalIncludeDirectories>include;..\\common;%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
      <PreprocessorDefinitions>WIN32;_DEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
      <AdditionalOptions>/permissive- %(AdditionalOptions)</AdditionalOptions>
    </ClCompile>
  </ItemDefinitionGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Release|x64'">
    <ClCompile>
      <LanguageStandard>stdcpp20</LanguageStandard>
      <AdditionalIncludeDirectories>include;..\\common;%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
      <PreprocessorDefinitions>WIN32;NDEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
    </ClCompile>
  </ItemDefinitionGroup>
  <ItemGroup>
    <ClCompile Include="main.cpp" />
    <ClCompile Include="src\\cube.cpp" />
    <ClCompile Include="src\\cylinder.cpp" />
  </ItemGroup>
  <ItemGroup>
    <ClInclude Include="include\\cube.h" />
    <ClInclude Include="include\\cylinder.h" />
  </ItemGroup>
</Project>`;

      const parsed = parseVcxproj(sampleVcxproj, 'F:/Projects/Geometry/GeometryEngine.vcxproj');
      assert.strictEqual(parsed.name, 'GeometryEngine');
      assert.strictEqual(parsed.configurationType, 'Application');
      assert.strictEqual(parsed.guid, '{ABCDEF12-3456-7890-ABCD-EF1234567890}');

      assert.strictEqual(parsed.sourceFiles.length, 3);
      assert.strictEqual(
        parsed.sourceFiles[0].replace(/\\/g, '/').toLowerCase(),
        'f:/projects/geometry/main.cpp'
      );
      assert.strictEqual(
        parsed.sourceFiles[1].replace(/\\/g, '/').toLowerCase(),
        'f:/projects/geometry/src/cube.cpp'
      );

      assert.strictEqual(parsed.headerFiles.length, 2);
      assert.strictEqual(
        parsed.headerFiles[0].replace(/\\/g, '/').toLowerCase(),
        'f:/projects/geometry/include/cube.h'
      );

      const debugOpts = parsed.compileOptionsByConfig.get('Debug|x64');
      assert.ok(debugOpts);
      assert.strictEqual(debugOpts.languageStandard, 'c++20');
      assert.strictEqual(debugOpts.preprocessorDefinitions.length, 3);
      assert.ok(debugOpts.preprocessorDefinitions.includes('_DEBUG'));
      assert.ok(debugOpts.includeDirectories.length >= 2);
      assert.ok(debugOpts.additionalOptions?.includes('/permissive-'));

      const releaseOpts = parsed.compileOptionsByConfig.get('Release|x64');
      assert.ok(releaseOpts);
      assert.ok(releaseOpts.preprocessorDefinitions.includes('NDEBUG'));
    });
  });
});
