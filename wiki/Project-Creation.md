# Project Creation Guide

C/C++ Pro provides a turnkey project scaffolding wizard to bootstrap production-ready C and C++ projects on **Windows**, **Linux**, and **macOS**.

To launch the wizard:
1. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on macOS) to open the Command Palette.
2. Type **`C/C++ Pro: Create New C/C++ Project`** and press `Enter`.

---

## 1. Project Templates

| Template | Description | Generated Structure |
| :--- | :--- | :--- |
| **Console Application** | Standalone executable with a main entry point and modular functions. | `src/main.cpp`, `src/app.cpp`, `include/<Name>/app.hpp` |
| **Static Library** | Compiled reusable `.lib` / `.a` archive with public headers. | `src/<Name>.cpp`, `include/<Name>/<Name>.hpp`, `examples/main.cpp` |
| **Shared / Dynamic Library** | Dynamic `.dll` / `.so` / `.dylib` with cross-platform export macros. | `src/<Name>.cpp`, `include/<Name>/export.hpp`, `examples/main.cpp` |
| **Header-Only Library** | Template or inline library requiring no compiled binary files. | `include/<Name>/<Name>.hpp`, `examples/main.cpp` |
| **Unit Test Suite** | Pre-configured test runner supporting Catch2, GoogleTest, or doctest. | `include/<Name>/calculator.hpp`, `tests/test_calculator.cpp` |

---

## 2. Platform Build System Support

The project wizard tailors available build systems to the host platform:

| Platform | Supported Build Systems | Recommended Default |
| :--- | :--- | :--- |
| **Windows** | CMake, Visual Studio Solution (`.sln` / `.vcxproj`), Lightweight (`compile_flags.txt`) | **CMake** (or **Visual Studio Solution** for MSVC developers) |
| **Linux** | CMake, POSIX Makefile, Lightweight (`compile_flags.txt`) | **CMake** |
| **macOS** | CMake, POSIX Makefile, Lightweight (`compile_flags.txt`) | **CMake** |

---

## 3. Directory Selection & Collision Protection

During creation, the wizard guides you through:
1. **Destination Directory**: Choose between active workspace folders or click **Browse folder...** to open a native OS folder dialog.
2. **Project Name**: Enter a valid project name. Names cannot contain invalid filesystem characters (`\ / : * ? " < > |`).
3. **Collision Warning**: If the target folder already contains files, C/C++ Pro prompts for confirmation before scaffolding.
4. **Workspace Open**: If created outside the current workspace, you can immediately open the project in the current or a new VS Code window.

---

## 4. Generated Configuration

Every generated project includes turnkey developer tooling:
- **`.clangd` & `compile_flags.txt`**: Instant AST indexing without manual path configuration.
- **`.vscode/tasks.json`**: Pre-configured build and run tasks accessible via `Ctrl+Shift+B`.
- **`.vscode/launch.json`**: Native debugging pre-wired to C/C++ Pro's DAP engine (`c-cpp-pro-debug`).
- **`.gitignore`**: Standard C/C++ ignore patterns for build outputs, caches, and compiler artifacts.
- **`README.md`**: Complete command-line and IDE build instructions.
