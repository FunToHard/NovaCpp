# NovaCpp: Fast C/C++ Extension for Visual Studio Code

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![VS Code Engine](https://img.shields.io/badge/VS%20Code-%5E1.85.0-brightgreen.svg)](https://code.visualstudio.com/)
[![Language](https://img.shields.io/badge/Language-C%20%2F%20C%2B%2B%20%2F%20CUDA-00599C.svg)](https://isocpp.org/)

NovaCpp combines the blazing index and AST completion speed of LLVM's **`clangd`** with the turnkey developer experience of modern IDEs. It provides instant symbol search, zero-configuration compiler discovery, integrated DAP debugging, native Visual Studio solution (`.sln` / `.slnx`) support, struct memory layout inspection, build time bottleneck analysis, and unit test discovery right out of the box.

---

## Why NovaCpp?

| Feature | Microsoft `vscode-cpptools` | Official `vscode-clangd` | **NovaCpp** |
| :--- | :--- | :--- | :--- |
| **Completion & AST Latency** | Slow (Disk AutoPCH, 500–1000ms) | Ultra Fast (In-memory AST) | **Ultra Fast (`clangd` backend)** |
| **Workspace Indexing** | Sluggish (SQLite token database) | Instant (Compacted AST index) | **Instant (`clangd` index)** |
| **Out-of-the-Box Experience** | High (Auto compiler detection) | Manual (Requires `compile_commands.json`) | **Turnkey (Auto-probing & synthesis)** |
| **Integrated Debugging** | Yes (`cppdbg`, `cppvsdbg`) | None (Manual launch configs) | **Yes (Built-in `lldb-dap`, GDB, MSVC)** |
| **Visual Studio Solutions** | Limited | None | **Native (`.sln`, `.slnx`, `.vcxproj`)** |
| **Memory Layout Inspector** | None | None | **Interactive (Padding & cache lines)** |
| **Build Bottleneck Analysis** | None | None | **Yes (Clang `-ftime-trace` & include tree)** |
| **Test Explorer** | Requires separate extension | None | **Built-in (GTest, Catch2, doctest, Boost)** |
| **Configuration GUI** | Yes (Webview panel) | None (Raw YAML) | **Modern Webview Configuration Editor** |
| **Memory Footprint** | Heavy (Multi-process `cpptools-srv`) | Lean (Single daemon) | **Lean (Single daemon + DAP bridge)** |

---

## Features

### 1. High-Performance Language Intelligence
- **Clangd Substrate**: Fast semantic completions, instant signature help, precise go-to-definition, find-references, and rename refactorings.
- **Rich AST Hover Transformer**: Enriches documentation with standard library insights, algorithmic complexity guarantees, exception safety notes, and direct links to cppreference.com.
- **C++ Postfix Completion Templates**: Expand expressions fluently using postfix operators like `.if`, `.for`, `.var`, `.unique`, `.shared`, `.cast`, `.return`, and `.beg...end`.
- **Inactive Preprocessor Region Dimming**: Inactive `#if`, `#ifdef`, `#elif`, and `#else` code blocks are dimmed accurately based on compiler preprocessor evaluation.
- **Automated Doxygen Generation**: Type `/**` above functions, structs, or classes (or invoke the code action) to generate complete Doxygen docstrings with parameter and return tags.

### 2. Zero-Configuration Compiler & SDK Discovery
- **Automatic Compiler Probing**: Detects installed MSVC (`cl.exe`), Clang (`clang++`), GCC/MinGW (`g++`), and WSL toolchains without manual path configuration.
- **Flags Synthesis**: Automatically generates `compile_flags.txt` and `compile_commands.json` for single-file scripts and unstructured projects.
- **Ecosystem & SDK Discovery**: Out-of-the-box detection of common graphics and system SDKs:
  - **Vulkan SDK** (`C:\VulkanSDK\<version>` or `$VULKAN_SDK`)
  - **raylib** (`C:\raylib` or `/usr/local/include/raylib`)
  - **CUDA Toolkit** (`$CUDA_PATH`)
  - **Boost C++ Libraries** (`C:\local\boost_*`, `/usr/include/boost`)
  - **SDL2 / SDL3**
  - **vcpkg** and **Node-API** (`node-addon-api`, `nan`) includes

### 3. Visual Studio Solution & Project Integration
- **Solution Formats**: First-class support for traditional `.sln` and the modern XML-based `.slnx` solution formats.
- **Project Parsing**: Extracts include directories, preprocessor definitions, language standards, and forced includes from `.vcxproj` files across all configurations (Debug/Release, x64/x86/ARM64).
- **Compilation Database Generation**: Generates a unified `compile_commands.json` covering all C++ source files in the active solution.
- **MSBuild Task Provider**: Generates build, rebuild, clean, and per-project tasks automatically accessible via VS Code's Task runner.

### 4. Integrated DAP Debugging & Run Controller
- **Zero-Setup Debugging**: Seamlessly hooks into `lldb-dap`, GDB (`--interpreter=dap`), or MSVC for native C/C++ debugging.
- **Automatic Launch Generation**: Pre-configured launch configurations with dynamic workspace variable resolution (`${fileBasenameNoExtension}`, `${workspaceFolder}`).
- **Interactive Process Picker**: Select running processes to attach with cross-platform PID and name resolution.
- **Evaluatable Expression Provider**: Evaluate nested member accesses (`a->b.c`), indexed arrays (`arr[i]`), and pointers when hovering during debug breaks.
- **Run & Debug Editor Title Actions**: One-click play and debug buttons in the editor title bar with automated Visual Studio Developer Shell (`vcvarsall`) environment injection on Windows.

### 5. Type & Memory Layout Inspector
- Inspect struct and class memory layouts directly inside the editor (`novacpp.inspectMemoryLayout`).
- Visualize field byte offsets, member sizes, struct alignment, and wasted memory from padding holes.
- Visual indicators for 64-byte CPU cache line boundaries to optimize data structures for cache locality.

### 6. Include Tree & Build Bottleneck Visualizer
- **Header Dependency Hierarchy**: Analyze `#include` trees, detect circular inclusion cycles, and receive optimization tips for heavy headers (`novacpp.analyzeIncludes`).
- **Clang `-ftime-trace` Profiling**: Inspect Chrome tracing JSON files to pinpoint slow template instantiations and expensive header parse times (`novacpp.visualizeTimeTrace`).

### 7. Modern C++ Test Explorer
- Native VS Code Test Explorer integration for modern C++ testing frameworks.
- Automatically discovers tests, suites, and scenarios for:
  - **GoogleTest** (`TEST`, `TEST_F`, `TEST_P`)
  - **Catch2** (`TEST_CASE`, `SCENARIO`)
  - **doctest** (`TEST_CASE`)
  - **Boost.Test** (`BOOST_AUTO_TEST_CASE`)

### 8. Macro Expansion & Compile-Time Evaluation
- **Step-by-Step Macro Expansion**: Preview complex object-like and function-like macro expansions directly at cursor position (`novacpp.expandMacro`).
- **`constexpr` Evaluation**: Preview compile-time evaluations and constant folding results (`novacpp.evaluateConstexpr`).

### 9. Inline Disassembly & Compiler Explorer
- Open inline assembly output alongside your C++ code (`novacpp.viewDisassembly`).
- Filter compiler directives, labels, and comments with customizable optimization flags (`-O0`, `-O1`, `-O2`, `-O3`, `-Os`, `-Oz`).

### 10. Semantic Symbol Hierarchy Graphs
- Generate Mermaid diagrams visualizing class inheritance and symbol relationships (`novacpp.showTypeHierarchy`).

### 11. Configuration Editor & Multi-Target Profiles
- Modern graphical Webview editor (`novacpp.openSettings`) to configure include paths, preprocessor defines, compiler paths, and C/C++ language standards.
- Supports `.vscode/c_cpp_properties.json` and Linux/RTOS Kconfig (`.config`) files.
- Visual Studio Developer Environment switcher (`novacpp.setVsDeveloperEnvironment`) to quickly initialize compiler environments.

---

## Getting Started

1. **Install NovaCpp** from the Visual Studio Code Marketplace.
2. Open any C or C++ folder or source file.
3. If `clangd` is not installed on your system, NovaCpp will prompt you to automatically download and install a managed LLVM release.
4. NovaCpp detects your local compiler (MSVC, Clang, or GCC) and configures your project automatically.

---

## Key Commands

| Command | Title |
| :--- | :--- |
| `novacpp.openSettings` | NovaCpp: Open Configuration Panel |
| `novacpp.restartServer` | NovaCpp: Restart Language Server |
| `novacpp.switchSourceHeader` | NovaCpp: Switch Header/Source (`Alt+O`) |
| `novacpp.inspectMemoryLayout` | NovaCpp: Inspect Type & Memory Layout |
| `novacpp.analyzeIncludes` | NovaCpp: Analyze #include Hierarchy & Dependencies |
| `novacpp.visualizeTimeTrace` | NovaCpp: Visualize Clang -ftime-trace Build Bottlenecks |
| `novacpp.refreshTests` | NovaCpp: Discover & Refresh Unit Tests |
| `novacpp.expandMacro` | NovaCpp: Expand Macro at Cursor |
| `novacpp.evaluateConstexpr` | NovaCpp: Evaluate constexpr Expression at Cursor |
| `novacpp.viewDisassembly` | NovaCpp: Open Inline Compiler Disassembly |
| `novacpp.showTypeHierarchy` | NovaCpp: Show Visual Type & Inheritance Hierarchy Graph |
| `novacpp.selectSolution` | NovaCpp: Select Active Solution (.sln / .slnx) |
| `novacpp.buildSolution` | NovaCpp: Build Solution (MSBuild) |
| `novacpp.setVsDeveloperEnvironment` | NovaCpp: Set Visual Studio Developer Environment |
| `novacpp.generateDoxygenComment` | NovaCpp: Generate Doxygen Documentation Comment |
| `novacpp.runClangTidyOnActiveFile` | NovaCpp: Run Clang-Tidy Analysis on Active File |
| `novacpp.resetIndex` | NovaCpp: Reset Clangd Symbol Index |

---

## Configuration Settings

| Setting | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `novacpp.path` | `string` | `"clangd"` | Path to the `clangd` language server executable. |
| `novacpp.arguments` | `array` | `[...]` | Command-line flags passed to `clangd` on startup. |
| `novacpp.compilerPath` | `string` | `""` | Path to the preferred C/C++ compiler. Auto-detected if omitted. |
| `novacpp.cppStandard` | `string` | `"c++20"` | C++ language standard (`c++98`, `c++11`, `c++14`, `c++17`, `c++20`, `c++23`, `c++26`). |
| `novacpp.cStandard` | `string` | `"c17"` | C language standard (`c89`, `c99`, `c11`, `c17`, `c23`). |
| `novacpp.inactiveRegions.enabled` | `boolean` | `true` | Dim inactive preprocessor blocks (`#ifdef`, `#if 0`). |
| `novacpp.inactiveRegions.opacity` | `number` | `0.45` | Opacity for dimmed preprocessor regions (0.1 to 1.0). |
| `novacpp.postfixCompletions` | `boolean` | `true` | Enable C++ postfix completion templates (`.if`, `.for`, etc.). |
| `novacpp.doxygen.generateOnType` | `boolean` | `true` | Auto-generate Doxygen comments when typing `/**`. |
| `novacpp.codeAnalysis.clangTidy.enabled` | `boolean` | `true` | Enable Clang-Tidy background linter analysis. |
| `novacpp.debugger.preferred` | `string` | `"auto"` | Preferred debugger backend (`auto`, `lldb-dap`, `gdb`, `msvc`). |

---

## License

This project is licensed under the [MIT License](LICENSE).
