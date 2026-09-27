# AGENTS.md

Instructions and guidelines for AI agents working in the NovaCpp codebase.

## 1. Project Overview

NovaCpp is a high-performance C/C++ extension for Visual Studio Code. It integrates LLVM Clangd, compiler discovery, static build system analysis, and native debugging.

### Core Architecture

- **`src/substrate/`**: Manages the `clangd` language server process, status bar, and communication protocols.
- **`src/prober/`**: Discovers system compilers (MSVC, GCC, Clang) and external SDKs (Vulkan, raylib, CUDA, Boost, SDL).
- **`src/cmake/`**: Statically tokenizes and parses `CMakeLists.txt` files without invoking external CMake binaries.
- **`src/solution/`**: Statically parses Visual Studio solutions (`.sln`, `.slnx`, `.vcxproj`) to generate compilation databases.
- **`src/config/`**: Manages multi-target profiles and Kconfig (`.config`) files.
- **`src/debugger/`**: Manages debug configurations, process attachment, and DAP sessions.
- **`src/intelligence/`**: Implements smart definition navigation, code actions, and documentation lookups.
- **`src/webview/`**: Provides the interactive configuration panel webview.

---

## 2. Essential Commands

Execute commands in the workspace root directory:

1. **Build extension bundle**:
   ```bash
   npm run build
   ```
2. **Watch for incremental changes**:
   ```bash
   npm run watch
   ```
3. **Run TypeScript typecheck**:
   ```bash
   npm run check-types
   ```
4. **Run unit tests**:
   ```bash
   npm test
   ```
5. **Package VSIX extension**:
   ```bash
   npm run package
   ```

---

## 3. Strict TypeScript and Code Integrity Rules

The project enforces the strictest TypeScript compiler options in [`tsconfig.json`](tsconfig.json):

1. **No Implicit Any**: Specify explicit types for all variables, parameters, and return values.
2. **Strict Null Checks**: Handle `null` and `undefined` explicitly. Do not use non-null assertions (`!`) carelessly.
3. **No Unused Code**: Do not leave unused imports, variables, or functions.
4. **Unused Parameters**: Prefix intentionally unused callback parameters with an underscore (e.g., `_token`).
5. **No Implicit Returns**: Ensure all code paths in non-void functions return a value.
6. **No Fallthrough in Switch**: End every non-empty case statement with `break` or `return`.
7. **No Unreachable Code**: Remove dead code paths and unused labels immediately.
8. **Explicit Overrides**: Use the `override` keyword when overriding base class methods.
9. **Zero Type Errors**: Always run `npm run check-types` before submitting any changes.
10. **Strict No Emojis**: Do not use emojis in code, comments, documentation, or commit messages unless absolutely necessary.

---

## 4. Key Engineering Constraints

Adhere strictly to these constraints when modifying the codebase:

### External SDK Discovery
- Do not inject external SDK flags into projects that do not use them.
- Verify workspace usage via `ExternalSdkDetector.isSdkUsedInWorkspace` before adding SDK include directories.

### Confidentiality and Git Hygiene
- Ensure all created test files and temporary artifacts clean up after execution.
- use `git status` and `git diff` commands to verify your changes.
- If user asks for staging write clean commit messages that describe the changes.

### Playground Directory Isolation
- **Never traverse, list, or search the `playground/` directory**:
  - Do not run `ls`, `dir`, `Get-ChildItem`, `find`, or recursive glob searches targeting `playground/`.
  - Do not read, edit, or commit files within `playground/` unless the user explicitly targets a specific sub-path in a prompt.
  - Keep `playground/` strictly isolated as an external manual verification sandbox to prevent context window saturation from third-party codebases.
  - The `playground/` directory itself is tracked via `.gitkeep`, but all repository contents inside it are ignored by git.

### Strict No Emojis Rule
- Do not use emojis in source code, user-facing UI messages, diagnostics, comments, documentation, commit messages, or agent communication unless absolutely necessary. Maintain a clean, professional, and technical tone throughout.

---

## 5. Verification Checklist

Complete these steps for every change before committing:

1. Run `npm run check-types` and verify 0 type errors.
2. Run `npm test` and verify all unit tests pass.
3. Verify `git status` shows no unintended or untracked files.
