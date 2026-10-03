# Changelog

All notable changes to the C/C++ Pro extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-10-03

### Fixed

- **Struct Member Variable Hover Layout Isolation**:
  - Resolved an issue where hovering over a struct type used as a member variable inside an enclosing class (e.g. `Rect` inside `class UIElement`) displayed the enclosing class layout instead of the member struct layout.
  - Enforced strict symbol and candidate name verification in AST memory layout resolution to prevent enclosing container scopes from leaking into member variable type hover cards.

### Changed

- Promoted `0.3.x` features to the official Stable Release channel following the Visual Studio Code Marketplace even-minor versioning convention.

## [0.3.0] - 2026-10-02

### Added

- **Project-Wide Reference Count CodeLens**:
  - Displays usage count directly above C++ classes, structs, member variables, functions, and methods across the workspace.
  - Interactive CodeLens click navigates directly to the symbol reference panel (`editor.action.findReferences`).
  - Added configuration settings:
    - `c-cpp-pro.referenceCount.enabled`: Toggles reference count CodeLens display on/off (default: `true`).
    - `c-cpp-pro.referenceCount.visibleSymbolKinds`: Filters which symbol kinds display reference counts (`class`, `struct`, `variable`, `function`, `method`).

- **Struct & Class Memory Layout & Alignment Inspection in Hover**:
  - Enriched hover card when hovering over `class`, `struct`, or `union` definitions and usages.
  - Displays total struct byte size, natural alignment, padding overhead percentage, and 64-byte cache line footprint.
  - Renders detailed field offset table showing byte offsets (`+0`, `+4`, `+8`), field sizes, member names, types, and padding indicators (`*padding* ░░`).
  - Implements field reordering recommendations that identify alignment waste and calculate optimal packed size.
  - Adds direct quick-action link to launch the dedicated Memory Layout Webview (`command:c-cpp-pro.inspectMemoryLayout`).
  - Multi-tier AST resolution resolving struct layout from active cursor location, document text lookup, or Clangd definition provider navigation into headers.

- **Win32 & Enum Memory Layout Heuristics**:
  - Added native and TypeScript support for Win32 types (`DWORD`, `WORD`, `BYTE`, `BOOL`, `HANDLE`, `HWND`, `HDC`, `HINSTANCE`) and ISO C++ character types (`char8_t`, `char16_t`, `char32_t`, `wchar_t`).
  - Added semantic heuristic mapping common enum and status types (`Type`, `Kind`, `Mode`, `State`, `Status`, `Action`, `Op`, `Code`, `Flag`, `Flags`) to 4-byte aligned types.
  - Added brace matching and body parser handling inline methods, access specifiers (`public:`, `private:`), default initializers (`= 0.0`), uniform initializers (`{0}`), and C++ attributes (`[[no_unique_address]]`, `alignas(...)`).

### Changed

- **Clean Declaration Headings**:
  - Sanitized Clangd hover headers by stripping raw namespace comments (`// In namespace ...`) from code blocks and displaying clean badges (`### struct Name *(in namespace ide)*`).

- **Native Rust Engine Alignment**:
  - Synchronized Rust native acceleration crate (`c-cpp-pro-native`) memory layout parser with the TypeScript fallback engine for parity across all supported platforms.

### Fixed

- **Visual Studio Marketplace Extension Icon**:
  - Configured top-level icon field in `package.json` pointing to `media/icon.png` to resolve marketplace gallery display issues.

- **VSIX Packaging Sanitization**:
  - Updated `.vscodeignore` to exclude local test harnesses, scratch files, and development artifacts from production `.vsix` packages.

---

## [0.2.1] - 2026-09-27

### Changed

- Configured extension marketplace icon metadata.
- Staged multi-platform native library targets for Windows, Linux, and macOS.

### Fixed

- Resolved Unix native library naming conventions (`libc_cpp_pro_native.so`, `libc_cpp_pro_native.dylib`).

---

## [0.2.0] - 2026-09-27

### Added

- **Static CMake Parser & Include Extractor**:
  - Static tokenization and AST parsing of `CMakeLists.txt` files without invoking external CMake binaries.
  - Extraction of target include directories, definitions, and compilation parameters.
  - Standalone `compile_commands.json` database generation for CMake projects.

- **Visual Studio Solution Parser**:
  - Static parsing of `.sln`, `.slnx`, and `.vcxproj` files to generate compilation databases for MSVC workspaces.

- **Multi-Target Kconfig Profile Support**:
  - Profile and target switcher supporting Linux kernel-style `.config` files.

---

## [0.1.1] - 2026-09-27

### Added

- **C/C++ Project Scaffolding Wizard**:
  - Interactive multi-platform project creation command (`c-cpp-pro.createProject`) supporting Windows, Linux, and macOS.
  - Template scaffolding for Console, Static Library, Shared Library, and GUI applications with CMake or raw compile flags.

- **Documentation & Wiki Integration**:
  - Comprehensive command palette references, configuration guides, and architecture documentation.

---

## [0.1.0] - 2026-09-26

### Added

- **LLVM Clangd Language Server Substrate**:
  - High-performance Clangd lifecycle management, automatic toolchain detection, and background indexing.
- **Intelligent Semantic Completions**:
  - Rich ISO C++ Standard Library documentation, complexity annotations, exception safety guarantees, and iterator invalidation rules.
- **Native Debugger Integration (DAP Engine)**:
  - Automated debug configuration generation and launch resolution for LLDB and GDB.
- **Compiler Prober & Flag Synthesizer**:
  - System compiler discovery across MSVC, GCC, and Clang toolchains.
- **Memory Layout & Include Analysis**:
  - Struct layout visualization and `-ftime-trace` compile time flamegraph analysis.
