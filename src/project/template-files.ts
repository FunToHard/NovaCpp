import {
  ProjectCreationOptions,
  GeneratedFile,
  CppStandard,
  CStandard
} from './project-types';

/**
 * Normalizes C++ standard for CMake (e.g. 'c++20' -> '20').
 */
function toCmakeStandard(std: CppStandard | CStandard): string {
  if (std.startsWith('c++')) {
    return std.slice(3);
  }
  if (std.startsWith('c')) {
    return std.slice(1);
  }
  return '20';
}

/**
 * Normalizes C++ standard for MSVC vcxproj (e.g. 'c++20' -> 'stdcpp20').
 */
function toMsvcStandard(std: CppStandard | CStandard): string {
  if (std === 'c++23') return 'stdcpplatest';
  if (std === 'c++20') return 'stdcpp20';
  if (std === 'c++17') return 'stdcpp17';
  if (std === 'c++14') return 'stdcpp14';
  if (std === 'c17') return 'stdc17';
  if (std === 'c11') return 'stdc11';
  return 'stdcpp20';
}

/**
 * Generates all scaffold files for a project given options.
 */
export function generateProjectFiles(opts: ProjectCreationOptions): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const isCpp = opts.language === 'cpp';
  const isWindows = opts.isWindows ?? process.platform === 'win32';
  const ext = isCpp ? 'cpp' : 'c';
  const hExt = isCpp ? 'hpp' : 'h';
  const name = opts.projectName;
  const safeName = name.replace(/[^a-zA-Z0-9_]/g, '_');

  // 1. Source and header files
  switch (opts.templateType) {
    case 'console':
      files.push({
        relativePath: `include/${name}/app.${hExt}`,
        content: isCpp
          ? `#pragma once

#include <string>

namespace ${safeName} {

/**
 * Returns a friendly welcome message.
 */
std::string getGreeting();

} // namespace ${safeName}
`
          : `#ifndef ${safeName.toUpperCase()}_APP_H
#define ${safeName.toUpperCase()}_APP_H

const char* ${safeName}_get_greeting(void);

#endif // ${safeName.toUpperCase()}_APP_H
`
      });

      files.push({
        relativePath: `src/app.${ext}`,
        content: isCpp
          ? `#include "${name}/app.hpp"

namespace ${safeName} {

std::string getGreeting() {
    return "Hello from ${name} powered by C/C++ Pro!";
}

} // namespace ${safeName}
`
          : `#include "${name}/app.h"

const char* ${safeName}_get_greeting(void) {
    return "Hello from ${name} powered by C/C++ Pro!";
}
`
      });

      files.push({
        relativePath: `src/main.${ext}`,
        content: isCpp
          ? `#include <iostream>
#include "${name}/app.hpp"

int main(int argc, char* argv[]) {
    (void)argc;
    (void)argv;
    std::cout << ${safeName}::getGreeting() << std::endl;
    return 0;
}
`
          : `#include <stdio.h>
#include "${name}/app.h"

int main(int argc, char* argv[]) {
    (void)argc;
    (void)argv;
    printf("%s\\n", ${safeName}_get_greeting());
    return 0;
}
`
      });
      break;

    case 'static-lib':
    case 'shared-lib': {
      const isShared = opts.templateType === 'shared-lib';
      const exportHeader = isShared
        ? `#pragma once

#if defined(_WIN32) || defined(__CYGWIN__)
  #if defined(${safeName.toUpperCase()}_EXPORTS)
    #define ${safeName.toUpperCase()}_API __declspec(dllexport)
  #else
    #define ${safeName.toUpperCase()}_API __declspec(dllimport)
  #endif
#elif defined(__GNUC__) && __GNUC__ >= 4
  #define ${safeName.toUpperCase()}_API __attribute__((visibility("default")))
#else
  #define ${safeName.toUpperCase()}_API
#endif
`
        : `#pragma once\n#define ${safeName.toUpperCase()}_API\n`;

      files.push({
        relativePath: `include/${name}/export.${hExt}`,
        content: exportHeader
      });

      files.push({
        relativePath: `include/${name}/${name}.${hExt}`,
        content: isCpp
          ? `#pragma once

#include "${name}/export.${hExt}"
#include <string>

namespace ${safeName} {

class ${safeName.toUpperCase()}_API Calculator {
public:
    int add(int a, int b);
    int multiply(int a, int b);
};

} // namespace ${safeName}
`
          : `#ifndef ${safeName.toUpperCase()}_H
#define ${safeName.toUpperCase()}_H

#include "${name}/export.h"

${safeName.toUpperCase()}_API int ${safeName}_add(int a, int b);
${safeName.toUpperCase()}_API int ${safeName}_multiply(int a, int b);

#endif // ${safeName.toUpperCase()}_H
`
      });

      files.push({
        relativePath: `src/${name}.${ext}`,
        content: isCpp
          ? `#include "${name}/${name}.${hExt}"

namespace ${safeName} {

int Calculator::add(int a, int b) {
    return a + b;
}

int Calculator::multiply(int a, int b) {
    return a * b;
}

} // namespace ${safeName}
`
          : `#include "${name}/${name}.h"

int ${safeName}_add(int a, int b) {
    return a + b;
}

int ${safeName}_multiply(int a, int b) {
    return a * b;
}
`
      });

      files.push({
        relativePath: `examples/main.${ext}`,
        content: isCpp
          ? `#include <iostream>
#include "${name}/${name}.${hExt}"

int main() {
    ${safeName}::Calculator calc;
    std::cout << "3 + 4 = " << calc.add(3, 4) << std::endl;
    return 0;
}
`
          : `#include <stdio.h>
#include "${name}/${name}.h"

int main() {
    printf("3 + 4 = %d\\n", ${safeName}_add(3, 4));
    return 0;
}
`
      });
      break;
    }

    case 'header-only':
      files.push({
        relativePath: `include/${name}/${name}.${hExt}`,
        content: isCpp
          ? `#pragma once

#include <string>

namespace ${safeName} {

template <typename T>
T add(T a, T b) {
    return a + b;
}

} // namespace ${safeName}
`
          : `#ifndef ${safeName.toUpperCase()}_H
#define ${safeName.toUpperCase()}_H

static inline int ${safeName}_add(int a, int b) {
    return a + b;
}

#endif // ${safeName.toUpperCase()}_H
`
      });

      files.push({
        relativePath: `examples/main.${ext}`,
        content: isCpp
          ? `#include <iostream>
#include "${name}/${name}.${hExt}"

int main() {
    std::cout << "5 + 7 = " << ${safeName}::add(5, 7) << std::endl;
    return 0;
}
`
          : `#include <stdio.h>
#include "${name}/${name}.h"

int main() {
    printf("5 + 7 = %d\\n", ${safeName}_add(5, 7));
    return 0;
}
`
      });
      break;

    case 'test-suite':
      files.push({
        relativePath: `include/${name}/calculator.${hExt}`,
        content: isCpp
          ? `#pragma once

namespace ${safeName} {

class Calculator {
public:
    int add(int a, int b) { return a + b; }
    int subtract(int a, int b) { return a - b; }
};

} // namespace ${safeName}
`
          : `#ifndef ${safeName.toUpperCase()}_CALC_H
#define ${safeName.toUpperCase()}_CALC_H

static inline int ${safeName}_add(int a, int b) { return a + b; }
static inline int ${safeName}_subtract(int a, int b) { return a - b; }

#endif // ${safeName.toUpperCase()}_CALC_H
`
      });

      files.push({
        relativePath: `tests/test_calculator.${ext}`,
        content:
          opts.testFramework === 'googletest'
            ? `#include <gtest/gtest.h>
#include "${name}/calculator.${hExt}"

TEST(CalculatorTest, HandlesAddition) {
    ${safeName}::Calculator calc;
    EXPECT_EQ(calc.add(2, 3), 5);
}

TEST(CalculatorTest, HandlesSubtraction) {
    ${safeName}::Calculator calc;
    EXPECT_EQ(calc.subtract(5, 2), 3);
}

int main(int argc, char** argv) {
    ::testing::InitGoogleTest(&argc, argv);
    return RUN_ALL_TESTS();
}
`
            : opts.testFramework === 'doctest'
            ? `#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include <doctest/doctest.h>
#include "${name}/calculator.${hExt}"

TEST_CASE("testing the calculator") {
    ${safeName}::Calculator calc;
    CHECK(calc.add(2, 3) == 5);
    CHECK(calc.subtract(5, 2) == 3);
}
`
            : `#include <catch2/catch_test_macros.h>
#include "${name}/calculator.${hExt}"

TEST_CASE("Calculator handles basic operations", "[calculator]") {
    ${safeName}::Calculator calc;
    REQUIRE(calc.add(2, 3) == 5);
    REQUIRE(calc.subtract(5, 2) == 3);
}
`
      });
      break;
  }

  // 2. Build system configurations
  switch (opts.buildSystem) {
    case 'cmake':
      files.push({
        relativePath: 'CMakeLists.txt',
        content: generateCMakeLists(opts)
      });
      break;

    case 'solution':
      files.push({
        relativePath: `${name}.sln`,
        content: generateSolutionFile(opts)
      });
      files.push({
        relativePath: `${name}.vcxproj`,
        content: generateVcxprojFile(opts)
      });
      files.push({
        relativePath: `${name}.vcxproj.filters`,
        content: generateVcxprojFilters(opts)
      });
      break;

    case 'makefile':
      files.push({
        relativePath: 'Makefile',
        content: generateMakefile(opts)
      });
      break;

    case 'lightweight':
      // Lightweight directly relies on compile_flags.txt and .vscode/tasks.json
      break;
  }

  // 3. IntelliSense & Clangd Configuration
  files.push({
    relativePath: 'compile_flags.txt',
    content: generateCompileFlags(opts)
  });

  files.push({
    relativePath: '.clangd',
    content: generateClangdYaml(opts)
  });

  // 4. VS Code Tasks & Launch Configurations
  files.push({
    relativePath: '.vscode/tasks.json',
    content: generateTasksJson(opts)
  });

  files.push({
    relativePath: '.vscode/launch.json',
    content: generateLaunchJson(opts)
  });

  // 5. Git & Documentation
  files.push({
    relativePath: '.gitignore',
    content: `# Build outputs
build/
bin/
out/
target/
*.obj
*.o
*.exe
*.dll
*.so
*.dylib
*.a
*.lib
*.pdb
*.ilk

# Clangd & IDE metadata
.clangd/
compile_commands.json
.cache/
.vscode/*
!.vscode/tasks.json
!.vscode/launch.json
!.vscode/settings.json
`
  });

  files.push({
    relativePath: 'README.md',
    content: `# ${name}

A modern C/C++ project created with **C/C++ Pro**.

## Build & Run

### Using Visual Studio Code
- **Build**: Press \`Ctrl+Shift+B\` (or \`Cmd+Shift+B\` on macOS) to run the default build task.
- **Run**: Click the play icon in the top right of the editor or run the \`Run C/C++ File\` command.
- **Debug**: Press \`F5\` to start native interactive debugging via C/C++ Pro DAP engine.

### Command Line
${getCommandLineInstructions(opts, isWindows)}
`
  });

  return files;
}

/**
 * Generates CMakeLists.txt content.
 */
function generateCMakeLists(opts: ProjectCreationOptions): string {
  const isCpp = opts.language === 'cpp';
  const lang = isCpp ? 'CXX' : 'C';
  const std = toCmakeStandard(opts.standard);
  const name = opts.projectName;

  let targetBlock = '';
  switch (opts.templateType) {
    case 'console':
      targetBlock = `add_executable(\${PROJECT_NAME}
    src/main.${isCpp ? 'cpp' : 'c'}
    src/app.${isCpp ? 'cpp' : 'c'}
)
target_include_directories(\${PROJECT_NAME} PUBLIC include)`;
      break;

    case 'static-lib':
      targetBlock = `add_library(\${PROJECT_NAME} STATIC
    src/\${PROJECT_NAME}.${isCpp ? 'cpp' : 'c'}
)
target_include_directories(\${PROJECT_NAME} PUBLIC include)

add_executable(\${PROJECT_NAME}_example examples/main.${isCpp ? 'cpp' : 'c'})
target_link_libraries(\${PROJECT_NAME}_example PRIVATE \${PROJECT_NAME})`;
      break;

    case 'shared-lib':
      targetBlock = `add_library(\${PROJECT_NAME} SHARED
    src/\${PROJECT_NAME}.${isCpp ? 'cpp' : 'c'}
)
target_include_directories(\${PROJECT_NAME} PUBLIC include)
target_compile_definitions(\${PROJECT_NAME} PRIVATE ${name.toUpperCase()}_EXPORTS)

add_executable(\${PROJECT_NAME}_example examples/main.${isCpp ? 'cpp' : 'c'})
target_link_libraries(\${PROJECT_NAME}_example PRIVATE \${PROJECT_NAME})`;
      break;

    case 'header-only':
      targetBlock = `add_library(\${PROJECT_NAME} INTERFACE)
target_include_directories(\${PROJECT_NAME} INTERFACE include)

add_executable(\${PROJECT_NAME}_example examples/main.${isCpp ? 'cpp' : 'c'})
target_link_libraries(\${PROJECT_NAME}_example PRIVATE \${PROJECT_NAME})`;
      break;

    case 'test-suite':
      targetBlock = `enable_testing()

add_executable(\${PROJECT_NAME}_tests
    tests/test_calculator.${isCpp ? 'cpp' : 'c'}
)
target_include_directories(\${PROJECT_NAME}_tests PRIVATE include)
add_test(NAME \${PROJECT_NAME}_tests COMMAND \${PROJECT_NAME}_tests)`;
      break;
  }

  return `cmake_minimum_required(VERSION 3.20)
project(${name} LANGUAGES ${lang})

set(CMAKE_EXPORT_COMPILE_COMMANDS ON)
set(CMAKE_${lang}_STANDARD ${std})
set(CMAKE_${lang}_STANDARD_REQUIRED ON)
set(CMAKE_${lang}_EXTENSIONS OFF)

${targetBlock}
`;
}

/**
 * Generates Visual Studio Solution (.sln).
 */
function generateSolutionFile(opts: ProjectCreationOptions): string {
  const name = opts.projectName;
  const projectGuid = '{8BC9CEB8-8B4A-11D0-8D11-00A0C91BC942}';
  const instanceGuid = '{11111111-2222-3333-4444-555555555555}';

  return `Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 17
VisualStudioVersion = 17.0.31903.59
MinimumVisualStudioVersion = 10.0.40219.1
Project("${projectGuid}") = "${name}", "${name}.vcxproj", "${instanceGuid}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|x64 = Debug|x64
		Release|x64 = Release|x64
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		${instanceGuid}.Debug|x64.ActiveCfg = Debug|x64
		${instanceGuid}.Debug|x64.Build.0 = Debug|x64
		${instanceGuid}.Release|x64.ActiveCfg = Release|x64
		${instanceGuid}.Release|x64.Build.0 = Release|x64
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
EndGlobal
`;
}

/**
 * Generates Visual Studio Project (.vcxproj).
 */
function generateVcxprojFile(opts: ProjectCreationOptions): string {
  const name = opts.projectName;
  const std = toMsvcStandard(opts.standard);
  const isCpp = opts.language === 'cpp';
  const ext = isCpp ? 'cpp' : 'c';
  const configType =
    opts.templateType === 'static-lib'
      ? 'StaticLibrary'
      : opts.templateType === 'shared-lib'
      ? 'DynamicLibrary'
      : 'Application';

  return `<?xml version="1.0" encoding="utf-8"?>
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
    <VCProjectVersion>17.0</VCProjectVersion>
    <ProjectGuid>{11111111-2222-3333-4444-555555555555}</ProjectGuid>
    <Keyword>Win32Proj</Keyword>
    <RootNamespace>${name}</RootNamespace>
    <WindowsTargetPlatformVersion>10.0</WindowsTargetPlatformVersion>
  </PropertyGroup>
  <Import Project="$(VCTargetsPath)\\Microsoft.Cpp.Default.props" />
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'" Label="Configuration">
    <ConfigurationType>${configType}</ConfigurationType>
    <UseDebugLibraries>true</UseDebugLibraries>
    <PlatformToolset>v143</PlatformToolset>
    <CharacterSet>Unicode</CharacterSet>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)'=='Release|x64'" Label="Configuration">
    <ConfigurationType>${configType}</ConfigurationType>
    <UseDebugLibraries>false</UseDebugLibraries>
    <PlatformToolset>v143</PlatformToolset>
    <WholeProgramOptimization>true</WholeProgramOptimization>
    <CharacterSet>Unicode</CharacterSet>
  </PropertyGroup>
  <Import Project="$(VCTargetsPath)\\Microsoft.Cpp.props" />
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Debug|x64'">
    <ClCompile>
      <WarningLevel>Level3</WarningLevel>
      <SDLCheck>true</SDLCheck>
      <PreprocessorDefinitions>_DEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
      <ConformanceMode>true</ConformanceMode>
      <LanguageStandard>${std}</LanguageStandard>
      <AdditionalIncludeDirectories>include;%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
    </ClCompile>
    <Link>
      <SubSystem>Console</SubSystem>
      <GenerateDebugInformation>true</GenerateDebugInformation>
    </Link>
  </ItemDefinitionGroup>
  <ItemDefinitionGroup Condition="'$(Configuration)|$(Platform)'=='Release|x64'">
    <ClCompile>
      <WarningLevel>Level3</WarningLevel>
      <FunctionLevelLinking>true</FunctionLevelLinking>
      <IntrinsicFunctions>true</IntrinsicFunctions>
      <SDLCheck>true</SDLCheck>
      <PreprocessorDefinitions>NDEBUG;_CONSOLE;%(PreprocessorDefinitions)</PreprocessorDefinitions>
      <ConformanceMode>true</ConformanceMode>
      <LanguageStandard>${std}</LanguageStandard>
      <AdditionalIncludeDirectories>include;%(AdditionalIncludeDirectories)</AdditionalIncludeDirectories>
    </ClCompile>
    <Link>
      <SubSystem>Console</SubSystem>
      <EnableCOMDATFolding>true</EnableCOMDATFolding>
      <OptimizeReferences>true</OptimizeReferences>
      <GenerateDebugInformation>true</GenerateDebugInformation>
    </Link>
  </ItemDefinitionGroup>
  <ItemGroup>
    <ClCompile Include="src\\main.${ext}" />
  </ItemGroup>
  <Import Project="$(VCTargetsPath)\\Microsoft.Cpp.targets" />
</Project>
`;
}

/**
 * Generates Visual Studio filters file (.vcxproj.filters).
 */
function generateVcxprojFilters(opts: ProjectCreationOptions): string {
  const isCpp = opts.language === 'cpp';
  const ext = isCpp ? 'cpp' : 'c';

  return `<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup>
    <Filter Include="Source Files">
      <UniqueIdentifier>{4FC737F1-C7A5-4376-A066-2A32D752A2FF}</UniqueIdentifier>
      <Extensions>cpp;c;cc;cxx;def;odl;idl;hpj;bat;asm;asmx</Extensions>
    </Filter>
    <Filter Include="Header Files">
      <UniqueIdentifier>{93995380-89BD-4b04-88EB-625FBE52EBFB}</UniqueIdentifier>
      <Extensions>h;hh;hpp;hxx;hm;inl;inc;ipp;xsd</Extensions>
    </Filter>
  </ItemGroup>
  <ItemGroup>
    <ClCompile Include="src\\main.${ext}">
      <Filter>Source Files</Filter>
    </ClCompile>
  </ItemGroup>
</Project>
`;
}

/**
 * Generates POSIX Makefile for Linux and macOS.
 */
function generateMakefile(opts: ProjectCreationOptions): string {
  const isCpp = opts.language === 'cpp';
  const compiler = isCpp ? '$(CXX)' : '$(CC)';
  const flagsVar = isCpp ? 'CXXFLAGS' : 'CFLAGS';
  const stdFlag = `-std=${opts.standard}`;
  const name = opts.projectName;
  const isDarwin = process.platform === 'darwin';
  const ext = isCpp ? 'cpp' : 'c';

  let targetRule = '';
  switch (opts.templateType) {
    case 'console':
      targetRule = `all: $(TARGET)

$(TARGET): $(OBJS)
	@mkdir -p $(BIN_DIR)
	${compiler} $(OBJS) -o $(TARGET) $(LDFLAGS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.${ext}
	@mkdir -p $(BUILD_DIR)
	${compiler} $(${flagsVar}) -c $< -o $@
`;
      break;

    case 'static-lib':
      targetRule = `all: $(LIB_TARGET)

$(LIB_TARGET): $(OBJS)
	@mkdir -p $(BIN_DIR)
	ar rcs $(LIB_TARGET) $(OBJS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.${ext}
	@mkdir -p $(BUILD_DIR)
	${compiler} $(${flagsVar}) -c $< -o $@
`;
      break;

    case 'shared-lib': {
      targetRule = `all: $(SHARED_TARGET)

$(SHARED_TARGET): $(OBJS)
	@mkdir -p $(BIN_DIR)
	${compiler} -shared $(OBJS) -o $(SHARED_TARGET) $(LDFLAGS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.${ext}
	@mkdir -p $(BUILD_DIR)
	${compiler} $(${flagsVar}) -fPIC -c $< -o $@
`;
      break;
    }

    default:
      targetRule = `all: $(TARGET)

$(TARGET): $(OBJS)
	@mkdir -p $(BIN_DIR)
	${compiler} $(OBJS) -o $(TARGET) $(LDFLAGS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.${ext}
	@mkdir -p $(BUILD_DIR)
	${compiler} $(${flagsVar}) -c $< -o $@
`;
      break;
  }

  return `CXX ?= g++
CC ?= gcc
${flagsVar} ?= ${stdFlag} -Wall -Wextra -O2 -Iinclude
LDFLAGS ?=

SRC_DIR = src
BUILD_DIR = build
BIN_DIR = bin

SRCS = $(wildcard $(SRC_DIR)/*.${ext})
OBJS = $(patsubst $(SRC_DIR)/%.${ext}, $(BUILD_DIR)/%.o, $(SRCS))
TARGET = $(BIN_DIR)/${name}
LIB_TARGET = $(BIN_DIR)/lib${name}.a
SHARED_TARGET = $(BIN_DIR)/lib${name}.${isDarwin ? 'dylib' : 'so'}

.PHONY: all clean run

${targetRule}
run: all
	./$(TARGET)

clean:
	rm -rf $(BUILD_DIR) $(BIN_DIR)
`;
}

/**
 * Generates compile_flags.txt.
 */
function generateCompileFlags(opts: ProjectCreationOptions): string {
  const flags = ['-Iinclude', `-std=${opts.standard}`, '-Wall', '-Wextra'];
  if (opts.templateType === 'shared-lib') {
    flags.push(`-D${opts.projectName.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase()}_EXPORTS`);
  }
  return flags.join('\n') + '\n';
}

/**
 * Generates .clangd configuration YAML.
 */
function generateClangdYaml(opts: ProjectCreationOptions): string {
  const flags = [`-std=${opts.standard}`, '-Iinclude', '-Wall'];
  return `CompileFlags:
  Add:
${flags.map((f) => `    - "${f}"`).join('\n')}
Diagnostics:
  UnusedIncludes: Strict
Index:
  Background: Build
`;
}

/**
 * Generates .vscode/tasks.json.
 */
function generateTasksJson(opts: ProjectCreationOptions): string {
  const name = opts.projectName;
  const isWindows = opts.isWindows ?? process.platform === 'win32';
  const binaryExt = isWindows ? '.exe' : '';

  let command = 'cmake';
  let args = ['--build', 'build'];
  let group = 'build';

  if (opts.buildSystem === 'makefile') {
    command = 'make';
    args = [];
  } else if (opts.buildSystem === 'solution') {
    command = 'msbuild';
    args = [`${name}.sln`, '/p:Configuration=Debug', '/p:Platform=x64'];
  } else if (opts.buildSystem === 'lightweight') {
    if (isWindows) {
      command = 'cl.exe';
      args = [
        '/EHsc',
        '/Zi',
        '/std:c++20',
        '/Iinclude',
        'src/main.cpp',
        `/Fe:build/${name}.exe`,
        '/Fo:build/'
      ];
    } else {
      command = opts.language === 'cpp' ? 'g++' : 'gcc';
      args = [
        `-std=${opts.standard}`,
        '-g',
        '-Iinclude',
        'src/main.cpp',
        '-o',
        `build/${name}`
      ];
    }
  }

  const tasksConfig = {
    version: '2.0.0',
    tasks: [
      {
        type: 'shell',
        label: 'C/C++ Pro: Build Project',
        command: command,
        args: args,
        problemMatcher: ['$gcc', '$msCompile'],
        group: {
          kind: group,
          isDefault: true
        }
      },
      {
        type: 'shell',
        label: 'C/C++ Pro: Run Project',
        command: opts.buildSystem === 'cmake'
          ? `\${workspaceFolder}/build/${name}${binaryExt}`
          : opts.buildSystem === 'makefile'
          ? `\${workspaceFolder}/bin/${name}${binaryExt}`
          : `\${workspaceFolder}/build/${name}${binaryExt}`,
        dependsOn: ['C/C++ Pro: Build Project'],
        problemMatcher: []
      }
    ]
  };

  return JSON.stringify(tasksConfig, null, 2);
}

/**
 * Generates .vscode/launch.json.
 */
function generateLaunchJson(opts: ProjectCreationOptions): string {
  const name = opts.projectName;
  const isWindows = opts.isWindows ?? process.platform === 'win32';
  const binaryExt = isWindows ? '.exe' : '';

  let programPath = `\${workspaceFolder}/build/${name}${binaryExt}`;
  if (opts.buildSystem === 'makefile') {
    programPath = `\${workspaceFolder}/bin/${name}${binaryExt}`;
  }

  const launchConfig = {
    version: '0.2.0',
    configurations: [
      {
        name: `C/C++ Pro: Debug ${name}`,
        type: 'c-cpp-pro-debug',
        request: 'launch',
        program: programPath,
        args: [],
        stopAtEntry: false,
        cwd: '${workspaceFolder}',
        environment: [],
        externalConsole: false,
        preLaunchTask: 'C/C++ Pro: Build Project'
      }
    ]
  };

  return JSON.stringify(launchConfig, null, 2);
}

/**
 * Returns command-line instructions for README.
 */
function getCommandLineInstructions(opts: ProjectCreationOptions, isWindows: boolean): string {
  const name = opts.projectName;
  switch (opts.buildSystem) {
    case 'cmake':
      return `\`\`\`bash
# Configure the build directory
cmake -B build -DCMAKE_BUILD_TYPE=Debug

# Compile the target
cmake --build build

# Execute binary
${isWindows ? `.\\build\\Debug\\${name}.exe` : `./build/${name}`}
\`\`\``;

    case 'solution':
      return `\`\`\`cmd
msbuild ${name}.sln /p:Configuration=Debug /p:Platform=x64
.\\x64\\Debug\\${name}.exe
\`\`\``;

    case 'makefile':
      return `\`\`\`bash
# Build
make

# Run
make run

# Clean
make clean
\`\`\``;

    case 'lightweight':
      return isWindows
        ? `\`\`\`cmd
cl.exe /EHsc /Zi /std:c++20 /Iinclude src\\main.cpp /Fe:build\\${name}.exe
.\\build\\${name}.exe
\`\`\``
        : `\`\`\`bash
g++ -std=${opts.standard} -g -Iinclude src/main.cpp -o build/${name}
./build/${name}
\`\`\``;
  }
}
