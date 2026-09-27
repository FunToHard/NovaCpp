# Command Palette Reference

This document provides a comprehensive reference for all commands exposed by C/C++ Pro in the Visual Studio Code Command Palette (`Ctrl+Shift+P` on Windows/Linux, `Cmd+Shift+P` on macOS).

All commands use the `C/C++ Pro:` title prefix and register under the `c-cpp-pro.*` command identifier namespace.

---

## Table of Contents

1. [Language Server & Indexing](#1-language-server--indexing)
2. [Compiler & Build Configuration](#2-compiler--build-configuration)
3. [Execution & Debugging](#3-execution--debugging)
4. [Visual Studio Solution Integration](#4-visual-studio-solution-integration)
5. [CMake Intelligence](#5-cmake-intelligence)
6. [Code Analysis & Inspection](#6-code-analysis--inspection)
7. [Navigation & Documentation](#7-navigation--documentation)
8. [Testing & Telemetry](#8-testing--telemetry)

---

## 1. Language Server & Indexing

Commands for managing the underlying LLVM Clangd language server daemon and symbol indexes.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **C/C++ Pro: Restart Language Server** | `c-cpp-pro.restartServer` | None | Terminates the active `clangd` process and starts a fresh instance with current configuration. |
| **C/C++ Pro: Reset Clangd Symbol Index** | `c-cpp-pro.resetIndex` | None | Stops `clangd`, safely purges the `.clangd/index` cache directory with file-lock retries on Windows, and restarts indexing. |
| **C/C++ Pro: Switch Header/Source** | `c-cpp-pro.switchSourceHeader` | `Alt+O` (`Alt+Cmd+O` on macOS) | Toggles the active editor between corresponding C/C++ source (`.cpp`, `.cc`, `.c`) and header (`.hpp`, `.h`, `.hxx`) files. |
| **C/C++ Pro: Download and Install clangd** | `c-cpp-pro.installClangd` | None | Downloads and installs the latest verified LLVM `clangd` release binary for your host operating system architecture. |
| **C/C++ Pro: Toggle Inactive Regions Dimming** | `c-cpp-pro.toggleDimInactiveRegions` | None | Toggles visual dimming of preprocessor branches (`#if`, `#ifdef`, `#else`) disabled by compiler conditional compilation. |
| **C/C++ Pro: Log Diagnostics** | `c-cpp-pro.logDiagnostics` | None | Collects runtime diagnostic metrics, compiler paths, detected SDK flags, and server status into an output channel. |

---

## 2. Compiler & Build Configuration

Commands for configuring active compilers, profiles, environment variables, and compilation databases.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **C/C++ Pro: Create New C/C++ Project** | `c-cpp-pro.createProject` | None | Launches the project scaffolding wizard to generate CMake, Visual Studio Solution, Makefile, or Lightweight C/C++ projects across Windows, Linux, and macOS. |
| **C/C++ Pro: Open Configuration Panel** | `c-cpp-pro.openSettings` | None | Opens the interactive Webview configuration panel to edit language standards, include paths, defines, and compiler flags. |
| **C/C++ Pro: Scan for Installed Compilers** | `c-cpp-pro.detectCompilers` | None | Probes the local operating system for MSVC, Clang, GCC, and MinGW installations and displays them in a quick pick list. |
| **C/C++ Pro: Generate compile_flags.txt** | `c-cpp-pro.generateCompileFlags` | None | Synthesizes a clean `compile_flags.txt` in the workspace root based on detected compiler paths and installed SDKs. |
| **C/C++ Pro: Select Target Configuration Profile** | `c-cpp-pro.selectProfile` | None | Prompts you to pick an active build profile from `.vscode/c_cpp_properties.json` or `.config` Kconfig files. |
| **C/C++ Pro: Set Visual Studio Developer Environment** | `c-cpp-pro.setVsDeveloperEnvironment` | None | Prompts you to select an installed MSVC version and architecture (`x64`, `x86`, `arm64`) and injects its environment into VS Code terminals. |
| **C/C++ Pro: Clear Visual Studio Developer Environment** | `c-cpp-pro.clearVsDeveloperEnvironment` | None | Clears all injected Visual Studio Developer environment variables from the extension terminal context. |

---

## 3. Execution & Debugging

Commands for single-file builds, execution, debugger launches, and process attachment.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **Run C/C++ File** | `c-cpp-pro.runFile` | Editor Title Bar | Compiles the active C/C++ file with the preferred compiler and executes the output binary in an integrated terminal. |
| **Debug C/C++ File** | `c-cpp-pro.debugFile` | Editor Title Bar | Compiles the active file with debug symbols (`-g` or `/Zi`) and starts an interactive debugging session via `lldb-dap`, GDB, or MSVC. |
| **C/C++ Pro: Pick Process to Attach** | `c-cpp-pro.pickProcess` | None | Displays a searchable list of running system processes with PID, executable name, and command-line arguments for debugger attachment. |

---

## 4. Visual Studio Solution Integration

Commands for parsing and building Visual Studio `.sln`, `.slnx`, and `.vcxproj` projects statically without launching Visual Studio.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **C/C++ Pro: Solution Actions Menu** | `c-cpp-pro.solutionMenu` | None | Opens a quick-pick menu showing available solution actions (select, configure, build, rebuild, clean, generate database). |
| **C/C++ Pro: Select Active Solution (.sln / .slnx)** | `c-cpp-pro.selectSolution` | None | Scans the workspace for `.sln` and `.slnx` solution files and sets the active solution for tasks and IntelliSense. |
| **C/C++ Pro: Select Solution Configuration** | `c-cpp-pro.selectSolutionConfiguration` | None | Selects the active build configuration (such as `Debug|x64` or `Release|ARM64`) for the current solution. |
| **C/C++ Pro: Build Solution (MSBuild)** | `c-cpp-pro.buildSolution` | None | Executes an incremental MSBuild task targeting the active solution and configuration. |
| **C/C++ Pro: Rebuild Solution (MSBuild)** | `c-cpp-pro.rebuildSolution` | None | Executes a full rebuild MSBuild task targeting the active solution. |
| **C/C++ Pro: Clean Solution (MSBuild)** | `c-cpp-pro.cleanSolution` | None | Cleans all build artifacts generated by previous solution builds. |
| **C/C++ Pro: Generate compile_commands.json from Solution** | `c-cpp-pro.generateCompilationDbFromSolution` | None | Statically parses all project definitions (`.vcxproj`) in the active solution and writes a unified `compile_commands.json`. |

---

## 5. CMake Intelligence

Commands for static CMake analysis, target dependency extraction, and compilation database synthesis.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **C/C++ Pro: CMake Intelligence Menu** | `c-cpp-pro.cmake.menu` | None | Opens the CMake management menu with rescan, compile command generation, and target inspection options. |
| **C/C++ Pro: Re-scan CMakeLists.txt Includes** | `c-cpp-pro.cmake.rescan` | None | Re-scans all `CMakeLists.txt` files across the workspace and updates include paths in the language server. |
| **C/C++ Pro: Generate compile_commands.json from CMakeLists.txt** | `c-cpp-pro.cmake.generateCompilationDatabase` | None | Statically parses the root `CMakeLists.txt` file and generates a `compile_commands.json` database without invoking external CMake binaries. |

---

## 6. Code Analysis & Inspection

Commands for inspecting low-level memory layouts, preprocessor macro expansions, templates, and compilation traces.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **C/C++ Pro: Inspect Type & Memory Layout (Struct Padding / Alignment)** | `c-cpp-pro.inspectMemoryLayout` | None | Calculates and displays byte offsets, member padding, alignment requirements, and 64-byte CPU cache lines for the struct under the cursor. |
| **C/C++ Pro: Analyze #include Hierarchy & Dependencies** | `c-cpp-pro.analyzeIncludes` | None | Analyzes all direct and transitive `#include` directives in the active file and generates an interactive tree graph. |
| **C/C++ Pro: Visualize Clang -ftime-trace Build Bottlenecks** | `c-cpp-pro.visualizeTimeTrace` | None | Parses Clang `-ftime-trace` JSON profiles and visualizes frontend parsing, template instantiation, and code generation duration. |
| **C/C++ Pro: Show Visual Type & Inheritance Hierarchy Graph** | `c-cpp-pro.showTypeHierarchy` | None | Displays the visual type hierarchy tree showing base classes, derived types, and interface implementations. |
| **C/C++ Pro: Open Inline Compiler Disassembly (Assembly View)** | `c-cpp-pro.viewDisassembly` | None | Compiles the active source file to assembly with Intel syntax and displays the generated instructions side-by-side. |
| **C/C++ Pro: Set Disassembly Optimization Level** | `c-cpp-pro.setDisassemblyOptimizationLevel` | None | Configures the compiler optimization level (`-O0`, `-O1`, `-O2`, `-O3`, `-Os`, `-Ofast`) used by the inline disassembly provider. |
| **C/C++ Pro: Expand Macro at Cursor (Step-by-Step)** | `c-cpp-pro.expandMacro` | None | Expands nested preprocessor macros recursively step-by-step and displays the final token substitution in a hover preview. |
| **C/C++ Pro: Evaluate constexpr Expression at Cursor** | `c-cpp-pro.evaluateConstexpr` | None | Synthesizes an isolated constant-expression evaluation harness and calculates compile-time `constexpr` values. |
| **C/C++ Pro: Run Clang-Tidy Analysis on Active File** | `c-cpp-pro.runClangTidyOnActiveFile` | None | Runs Clang-Tidy static analysis checks on the active document and emits diagnostics into the Problems panel. |
| **C/C++ Pro: Clear Clang-Tidy Diagnostics** | `c-cpp-pro.clearCodeAnalysisDiagnostics` | None | Clears all active Clang-Tidy diagnostic markers from the Problems panel. |

---

## 7. Navigation & Documentation

Commands for navigating complex preprocessor conditional blocks and generating documentation.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **C/C++ Pro: Go to Next Directive in Group** | `c-cpp-pro.goToNextDirectiveInGroup` | None | Jumps the editor cursor to the next related preprocessor directive within the current `#if` / `#elif` / `#else` / `#endif` block. |
| **C/C++ Pro: Go to Previous Directive in Group** | `c-cpp-pro.goToPrevDirectiveInGroup` | None | Jumps the editor cursor to the preceding directive within the current preprocessor conditional group. |
| **C/C++ Pro: Generate Doxygen Documentation Comment** | `c-cpp-pro.generateDoxygenComment` | None | Generates a structured Doxygen docstring template with `@param`, `@return`, and `@tparam` tags for the function or struct under the cursor. |
| **C/C++ Pro: Open C++ Reference Documentation** | `c-cpp-pro.openDocs` | None | Opens the official ISO C++ Standard Library or Win32 API reference documentation page for the selected symbol in an external browser. |

---

## 8. Testing & Telemetry

Commands for test discovery and telemetry management.

| Command Title | Command Identifier | Shortcut | Description |
| :--- | :--- | :--- | :--- |
| **C/C++ Pro: Discover & Refresh Unit Tests** | `c-cpp-pro.refreshTests` | None | Scans all C++ files for GoogleTest (`TEST`, `TEST_F`, `TEST_P`), Catch2 (`TEST_CASE`, `SCENARIO`), doctest, and Boost.Test cases. |
| **C/C++ Pro: Inspect Anonymous STL Telemetry Buffer** | `c-cpp-pro.inspectTelemetry` | None | Displays the in-memory STL symbol invocation counts and privacy allowlist compliance metrics in a dedicated output channel. |
| **C/C++ Pro: Flush Telemetry Batch** | `c-cpp-pro.flushTelemetry` | None | Dispatches the pending anonymous STL completion counts to the telemetry service or persists them to local offline storage. |
