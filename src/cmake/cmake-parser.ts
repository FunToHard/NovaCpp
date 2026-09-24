import * as fs from 'fs';
import * as path from 'path';

export interface ParsedCMakeInfo {
  includeDirectories: string[];
  compileDefinitions: string[];
  cppStandard?: string;
  targets: string[];
}

export class CMakeParser {
  /**
   * Statically parses CMakeLists.txt to extract include directories, compile definitions,
   * language standard, and declared targets.
   * Useful as immediate IntelliSense fallback before or without running cmake configure.
   */
  public static parse(cmakeListsPath: string, workspaceRoot?: string): ParsedCMakeInfo {
    const defaultWorkspace = workspaceRoot || path.dirname(cmakeListsPath);
    const cmakeDir = path.dirname(cmakeListsPath);

    const result: ParsedCMakeInfo = {
      includeDirectories: [],
      compileDefinitions: [],
      targets: []
    };

    if (!fs.existsSync(cmakeListsPath)) {
      return result;
    }

    let content = '';
    try {
      content = fs.readFileSync(cmakeListsPath, 'utf8');
    } catch {
      return result;
    }

    // Strip line comments
    const lines = content
      .split(/\r?\n/)
      .map((l) => {
        const commentIdx = l.indexOf('#');
        return commentIdx >= 0 ? l.substring(0, commentIdx) : l;
      })
      .join('\n');

    const resolveVar = (raw: string): string => {
      let resolved = raw.trim();
      // Remove enclosing quotes
      if ((resolved.startsWith('"') && resolved.endsWith('"')) || (resolved.startsWith("'") && resolved.endsWith("'"))) {
        resolved = resolved.substring(1, resolved.length - 1);
      }
      resolved = resolved
        .replace(/\$\{CMAKE_CURRENT_SOURCE_DIR\}/gi, cmakeDir)
        .replace(/\$\{PROJECT_SOURCE_DIR\}/gi, defaultWorkspace)
        .replace(/\$\{CMAKE_SOURCE_DIR\}/gi, defaultWorkspace)
        .replace(/\$\{workspaceFolder\}/gi, defaultWorkspace);

      return resolved;
    };

    const addInclude = (rawPath: string) => {
      const resolved = resolveVar(rawPath);
      if (!resolved || resolved.startsWith('$') || resolved.includes('<') || resolved.includes('>')) {
        // Skip unexpanded generator expressions or unresolved variables
        return;
      }
      const absPath = path.isAbsolute(resolved) ? resolved : path.resolve(cmakeDir, resolved);
      const normalized = absPath.replace(/\\/g, '/');
      if (!result.includeDirectories.includes(normalized)) {
        result.includeDirectories.push(normalized);
      }
    };

    const addDefine = (rawDef: string) => {
      let resolved = resolveVar(rawDef);
      if (resolved.startsWith('-D')) {
        resolved = resolved.substring(2);
      }
      if (resolved && !resolved.startsWith('$') && !result.compileDefinitions.includes(resolved)) {
        result.compileDefinitions.push(resolved);
      }
    };

    // 1. Detect C++ standard: set(CMAKE_CXX_STANDARD 20)
    const stdMatch = lines.match(/set\s*\(\s*CMAKE_CXX_STANDARD\s+([0-9]{2})\b/i);
    if (stdMatch) {
      result.cppStandard = `c++${stdMatch[1]}`;
    }

    // 2. Detect targets: add_executable(name ...) or add_library(name ...)
    const targetRegex = /(?:add_executable|add_library)\s*\(\s*([a-zA-Z0-9_.-]+)/gi;
    let tMatch: RegExpExecArray | null;
    while ((tMatch = targetRegex.exec(lines)) !== null) {
      const targetName = tMatch[1];
      if (targetName && !result.targets.includes(targetName)) {
        result.targets.push(targetName);
      }
    }

    // 3. Detect include_directories(...)
    const incDirRegex = /include_directories\s*\(([^)]+)\)/gi;
    let incMatch: RegExpExecArray | null;
    while ((incMatch = incDirRegex.exec(lines)) !== null) {
      const rawArgs = incMatch[1].trim().split(/\s+/);
      for (const arg of rawArgs) {
        const lower = arg.toLowerCase();
        if (lower === 'after' || lower === 'before' || lower === 'system') {
          continue;
        }
        addInclude(arg);
      }
    }

    // 4. Detect target_include_directories(target [INTERFACE|PUBLIC|PRIVATE] dir1 dir2...)
    const targetIncRegex = /target_include_directories\s*\(\s*([a-zA-Z0-9_.-]+)\s+([^)]+)\)/gi;
    let tIncMatch: RegExpExecArray | null;
    while ((tIncMatch = targetIncRegex.exec(lines)) !== null) {
      const body = tIncMatch[2];
      const tokens = body.trim().split(/\s+/);
      for (const token of tokens) {
        const upper = token.toUpperCase();
        if (upper === 'BEFORE' || upper === 'INTERFACE' || upper === 'PUBLIC' || upper === 'PRIVATE' || upper === 'SYSTEM') {
          continue;
        }
        addInclude(token);
      }
    }

    // 5. Detect add_definitions(-DFOO -DBAR=1)
    const addDefsRegex = /add_definitions\s*\(([^)]+)\)/gi;
    let defMatch: RegExpExecArray | null;
    while ((defMatch = addDefsRegex.exec(lines)) !== null) {
      const tokens = defMatch[1].trim().split(/\s+/);
      for (const token of tokens) {
        addDefine(token);
      }
    }

    // 6. Detect target_compile_definitions(target [INTERFACE|PUBLIC|PRIVATE] DEF1 DEF2...)
    const targetDefsRegex = /target_compile_definitions\s*\(\s*([a-zA-Z0-9_.-]+)\s+([^)]+)\)/gi;
    let tDefMatch: RegExpExecArray | null;
    while ((tDefMatch = targetDefsRegex.exec(lines)) !== null) {
      const body = tDefMatch[2];
      const tokens = body.trim().split(/\s+/);
      for (const token of tokens) {
        const upper = token.toUpperCase();
        if (upper === 'BEFORE' || upper === 'INTERFACE' || upper === 'PUBLIC' || upper === 'PRIVATE') {
          continue;
        }
        addDefine(token);
      }
    }

    return result;
  }
}
