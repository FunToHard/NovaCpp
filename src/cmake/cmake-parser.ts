import * as fs from 'fs';
import * as path from 'path';
import { CMakeProjectInfo, CMakeTargetInfo } from './cmake-models';
import { getPathIdentity } from '../platform/path-identity';

export interface CMakeRawCommand {
  name: string;
  args: string[];
}

export class CMakeParser {
  /**
   * Tokenizes CMake content into commands and argument lists, handling comments, quotes, and multi-line arguments.
   */
  public static tokenizeCommands(content: string): CMakeRawCommand[] {
    const commands: CMakeRawCommand[] = [];
    const len = content.length;
    let i = 0;

    while (i < len) {
      // Skip whitespace
      while (i < len && /\s/.test(content[i])) {
        i++;
      }
      if (i >= len) break;

      // Skip comments
      if (content[i] === '#') {
        while (i < len && content[i] !== '\n' && content[i] !== '\r') {
          i++;
        }
        continue;
      }

      // Read command name
      const nameStart = i;
      while (i < len && /[a-zA-Z0-9_]/.test(content[i])) {
        i++;
      }
      const cmdName = content.substring(nameStart, i).trim().toLowerCase();
      if (!cmdName) {
        i++;
        continue;
      }

      // Skip whitespace between command name and '('
      while (i < len && /\s/.test(content[i])) {
        i++;
      }
      if (i >= len || content[i] !== '(') {
        continue;
      }
      i++; // skip '('

      // Read arguments until matching ')'
      const args: string[] = [];
      let parenDepth = 1;
      let currentToken = '';

      while (i < len && parenDepth > 0) {
        const ch = content[i];

        if (ch === '#') {
          // Comment inside command arguments
          while (i < len && content[i] !== '\n' && content[i] !== '\r') {
            i++;
          }
          continue;
        }

        if (ch === '"') {
          // Quoted string or quoted part of token
          i++;
          let str = '';
          while (i < len && content[i] !== '"') {
            if (content[i] === '\\' && i + 1 < len) {
              str += content[i + 1];
              i += 2;
            } else {
              str += content[i];
              i++;
            }
          }
          if (i < len) i++; // skip closing '"'
          if (currentToken.length > 0) {
            currentToken += `"${str}"`;
          } else {
            currentToken = str;
          }
          continue;
        }

        if (ch === '(') {
          parenDepth++;
          currentToken += ch;
          i++;
          continue;
        }

        if (ch === ')') {
          parenDepth--;
          if (parenDepth === 0) {
            if (currentToken.trim().length > 0) {
              args.push(currentToken.trim());
              currentToken = '';
            }
            i++;
            break;
          } else {
            currentToken += ch;
            i++;
            continue;
          }
        }

        if (/\s/.test(ch)) {
          if (currentToken.trim().length > 0) {
            args.push(currentToken.trim());
            currentToken = '';
          }
          i++;
          continue;
        }

        currentToken += ch;
        i++;
      }

      if (cmdName) {
        commands.push({ name: cmdName, args });
      }
    }

    return commands;
  }

  /**
   * Statically parses a single CMakeLists.txt or .cmake file and returns discovered includes, definitions, and targets.
   */
  public static parseFile(
    filePath: string,
    workspaceRoot: string,
    inheritedVariables: Map<string, string> = new Map(),
    visitedFiles: Set<string> = new Set()
  ): {
    includeDirectories: string[];
    globalIncludeDirectories?: string[];
    compileDefinitions: string[];
    globalCompileDefinitions?: string[];
    cppStandard?: string;
    cStandard?: string;
    targets: CMakeTargetInfo[];
    subdirectories: string[];
  } {
    const normalizedFilePath = path.normalize(filePath);
    if (visitedFiles.has(getPathIdentity(normalizedFilePath))) {
      return {
        includeDirectories: [],
        globalIncludeDirectories: [],
        compileDefinitions: [],
        globalCompileDefinitions: [],
        targets: [],
        subdirectories: []
      };
    }
    visitedFiles.add(getPathIdentity(normalizedFilePath));

    const result = {
      includeDirectories: [] as string[],
      globalIncludeDirectories: [] as string[],
      compileDefinitions: [] as string[],
      globalCompileDefinitions: [] as string[],
      cppStandard: undefined as string | undefined,
      cStandard: undefined as string | undefined,
      targets: [] as CMakeTargetInfo[],
      subdirectories: [] as string[]
    };

    if (!fs.existsSync(normalizedFilePath)) {
      return result;
    }

    let fileContent = '';
    try {
      fileContent = fs.readFileSync(normalizedFilePath, 'utf8');
    } catch {
      return result;
    }

    const currentDir = path.dirname(normalizedFilePath);
    const variables = new Map<string, string>(inheritedVariables);

    // Built-in CMake directory variables
    if (!variables.has('CMAKE_CURRENT_SOURCE_DIR')) {
      variables.set('CMAKE_CURRENT_SOURCE_DIR', currentDir);
    }
    variables.set('CMAKE_CURRENT_LIST_DIR', currentDir);
    variables.set('PROJECT_SOURCE_DIR', workspaceRoot);
    variables.set('CMAKE_SOURCE_DIR', workspaceRoot);
    variables.set('workspaceFolder', workspaceRoot);

    const resolveVariables = (str: string): string => {
      let resolved = str;
      let prev = '';
      let loopCount = 0;
      while (resolved !== prev && loopCount < 5) {
        prev = resolved;
        loopCount++;
        resolved = resolved.replace(/\$\{([a-zA-Z0-9_]+)\}/g, (_, varName) => {
          return variables.get(varName) ?? '';
        });
      }
      return resolved;
    };

    const addInclude = (rawPath: string, target?: CMakeTargetInfo) => {
      let candidate = rawPath.trim();
      const buildInterfaceMatch = candidate.match(/\$<BUILD_INTERFACE:([^>]+)>/i);
      if (buildInterfaceMatch) {
        candidate = buildInterfaceMatch[1].trim();
      } else if (candidate.includes('$<INSTALL_INTERFACE:')) {
        return; // Skip install-only interface paths
      }

      const resolved = resolveVariables(candidate).trim();
      if (!resolved || resolved.startsWith('$') || resolved.includes('<') || resolved.includes('>')) {
        return; // Skip unresolved generator expressions or missing variables
      }

      // Filter out keywords
      const upper = resolved.toUpperCase();
      if (['PUBLIC', 'PRIVATE', 'INTERFACE', 'SYSTEM', 'BEFORE', 'AFTER'].includes(upper)) {
        return;
      }

      const currentSourceDir = variables.get('CMAKE_CURRENT_SOURCE_DIR') || currentDir;
      const absPath = path.isAbsolute(resolved) ? resolved : path.resolve(currentSourceDir, resolved);
      const normalized = absPath.replace(/\\/g, '/');

      if (!result.includeDirectories.includes(normalized)) {
        result.includeDirectories.push(normalized);
      }
      if (!target) {
        if (!result.globalIncludeDirectories.includes(normalized)) {
          result.globalIncludeDirectories.push(normalized);
        }
      } else {
        if (!target.includeDirectories.includes(normalized)) {
          target.includeDirectories.push(normalized);
        }
      }
    };

    const addDefine = (rawDef: string, target?: CMakeTargetInfo) => {
      let resolved = resolveVariables(rawDef).trim();
      if (!resolved || resolved.startsWith('$')) return;

      const upper = resolved.toUpperCase();
      if (['PUBLIC', 'PRIVATE', 'INTERFACE'].includes(upper)) {
        return;
      }

      if (resolved.startsWith('-D')) {
        resolved = resolved.substring(2);
      }

      if (!result.compileDefinitions.includes(resolved)) {
        result.compileDefinitions.push(resolved);
      }
      if (!target) {
        if (!result.globalCompileDefinitions.includes(resolved)) {
          result.globalCompileDefinitions.push(resolved);
        }
      } else {
        if (!target.compileDefinitions.includes(resolved)) {
          target.compileDefinitions.push(resolved);
        }
      }
    };

    const commands = CMakeParser.tokenizeCommands(fileContent);

    for (const cmd of commands) {
      switch (cmd.name) {
        case 'set': {
          if (cmd.args.length >= 2) {
            const varName = cmd.args[0];
            const value = cmd.args.slice(1).join(' ');
            const resolvedValue = resolveVariables(value);
            variables.set(varName, resolvedValue);

            if (varName === 'CMAKE_CXX_STANDARD') {
              const std = resolvedValue.trim();
              if (/^[0-9]+$/.test(std)) {
                result.cppStandard = `c++${std}`;
              }
            } else if (varName === 'CMAKE_C_STANDARD') {
              const std = resolvedValue.trim();
              if (/^[0-9]+$/.test(std)) {
                result.cStandard = `c${std}`;
              }
            }
          }
          break;
        }

        case 'include_directories': {
          for (const arg of cmd.args) {
            addInclude(arg);
          }
          break;
        }

        case 'target_include_directories': {
          if (cmd.args.length >= 2) {
            const targetName = cmd.args[0];
            let target = result.targets.find((t) => t.name === targetName);
            if (!target) {
              target = {
                name: targetName,
                type: 'custom',
                sourceFiles: [],
                includeDirectories: [],
                compileDefinitions: []
              };
              result.targets.push(target);
            }
            for (let k = 1; k < cmd.args.length; k++) {
              addInclude(cmd.args[k], target);
            }
          }
          break;
        }

        case 'add_definitions': {
          for (const arg of cmd.args) {
            addDefine(arg);
          }
          break;
        }

        case 'target_compile_definitions': {
          if (cmd.args.length >= 2) {
            const targetName = cmd.args[0];
            let target = result.targets.find((t) => t.name === targetName);
            if (!target) {
              target = {
                name: targetName,
                type: 'custom',
                sourceFiles: [],
                includeDirectories: [],
                compileDefinitions: []
              };
              result.targets.push(target);
            }
            for (let k = 1; k < cmd.args.length; k++) {
              addDefine(cmd.args[k], target);
            }
          }
          break;
        }

        case 'add_executable': {
          if (cmd.args.length >= 1) {
            const targetName = cmd.args[0];
            const sources = cmd.args.slice(1).map((s) => {
              const res = resolveVariables(s);
              return path.isAbsolute(res) ? res : path.resolve(currentDir, res);
            });

            let target = result.targets.find((t) => t.name === targetName);
            if (!target) {
              target = {
                name: targetName,
                type: 'executable',
                sourceFiles: [],
                includeDirectories: [],
                compileDefinitions: []
              };
              result.targets.push(target);
            } else {
              target.type = 'executable';
            }
            target.sourceFiles.push(...sources);
          }
          break;
        }

        case 'add_library': {
          if (cmd.args.length >= 1) {
            const targetName = cmd.args[0];
            let type: 'library' | 'interface' = 'library';
            let srcStart = 1;

            if (cmd.args.length >= 2) {
              const secondUpper = cmd.args[1].toUpperCase();
              if (['STATIC', 'SHARED', 'MODULE', 'OBJECT'].includes(secondUpper)) {
                srcStart = 2;
              } else if (secondUpper === 'INTERFACE') {
                type = 'interface';
                srcStart = 2;
              }
            }

            const sources = cmd.args.slice(srcStart).map((s) => {
              const res = resolveVariables(s);
              return path.isAbsolute(res) ? res : path.resolve(currentDir, res);
            });

            let target = result.targets.find((t) => t.name === targetName);
            if (!target) {
              target = {
                name: targetName,
                type,
                sourceFiles: [],
                includeDirectories: [],
                compileDefinitions: []
              };
              result.targets.push(target);
            } else {
              target.type = type;
            }
            target.sourceFiles.push(...sources);
          }
          break;
        }

        case 'target_sources': {
          if (cmd.args.length >= 2) {
            const targetName = cmd.args[0];
            let target = result.targets.find((t) => t.name === targetName);
            if (!target) {
              target = {
                name: targetName,
                type: 'custom',
                sourceFiles: [],
                includeDirectories: [],
                compileDefinitions: []
              };
              result.targets.push(target);
            }
            const sources = cmd.args
              .slice(1)
              .filter((s) => !['PUBLIC', 'PRIVATE', 'INTERFACE'].includes(s.toUpperCase()))
              .map((s) => {
                const res = resolveVariables(s);
                return path.isAbsolute(res) ? res : path.resolve(currentDir, res);
              });
            target.sourceFiles.push(...sources);
          }
          break;
        }

        case 'add_subdirectory': {
          if (cmd.args.length >= 1) {
            const subName = resolveVariables(cmd.args[0]);
            result.subdirectories.push(subName);

            const subDir = path.isAbsolute(subName) ? subName : path.resolve(currentDir, subName);
            const subCMake = path.join(subDir, 'CMakeLists.txt');

            if (fs.existsSync(subCMake)) {
              const subVars = new Map<string, string>(variables);
              subVars.set('CMAKE_CURRENT_SOURCE_DIR', subDir);
              const subParsed = CMakeParser.parseFile(
                subCMake,
                workspaceRoot,
                subVars,
                visitedFiles
              );

              // Merge subdirectory results
              for (const inc of subParsed.includeDirectories) {
                if (!result.includeDirectories.includes(inc)) {
                  result.includeDirectories.push(inc);
                }
              }
              if (subParsed.globalIncludeDirectories) {
                for (const inc of subParsed.globalIncludeDirectories) {
                  if (!result.globalIncludeDirectories.includes(inc)) {
                    result.globalIncludeDirectories.push(inc);
                  }
                }
              }
              for (const def of subParsed.compileDefinitions) {
                if (!result.compileDefinitions.includes(def)) {
                  result.compileDefinitions.push(def);
                }
              }
              if (subParsed.globalCompileDefinitions) {
                for (const def of subParsed.globalCompileDefinitions) {
                  if (!result.globalCompileDefinitions.includes(def)) {
                    result.globalCompileDefinitions.push(def);
                  }
                }
              }
              for (const subTarget of subParsed.targets) {
                const existing = result.targets.find((t) => t.name === subTarget.name);
                if (!existing) {
                  result.targets.push(subTarget);
                }
              }
            }
          }
          break;
        }

        case 'include': {
          if (cmd.args.length >= 1) {
            const fileArg = resolveVariables(cmd.args[0]);
            const candidates = [
              path.isAbsolute(fileArg) ? fileArg : path.resolve(currentDir, fileArg),
              path.isAbsolute(fileArg) ? fileArg : path.resolve(currentDir, `${fileArg}.cmake`),
              path.resolve(workspaceRoot, 'cmake', fileArg),
              path.resolve(workspaceRoot, 'cmake', `${fileArg}.cmake`)
            ];

            for (const cand of candidates) {
              if (fs.existsSync(cand) && fs.statSync(cand).isFile()) {
                const incParsed = CMakeParser.parseFile(
                  cand,
                  workspaceRoot,
                  variables,
                  visitedFiles
                );
                for (const inc of incParsed.includeDirectories) {
                  if (!result.includeDirectories.includes(inc)) {
                    result.includeDirectories.push(inc);
                  }
                }
                if (incParsed.globalIncludeDirectories) {
                  for (const inc of incParsed.globalIncludeDirectories) {
                    if (!result.globalIncludeDirectories.includes(inc)) {
                      result.globalIncludeDirectories.push(inc);
                    }
                  }
                }
                for (const def of incParsed.compileDefinitions) {
                  if (!result.compileDefinitions.includes(def)) {
                    result.compileDefinitions.push(def);
                  }
                }
                if (incParsed.globalCompileDefinitions) {
                  for (const def of incParsed.globalCompileDefinitions) {
                    if (!result.globalCompileDefinitions.includes(def)) {
                      result.globalCompileDefinitions.push(def);
                    }
                  }
                }
                break;
              }
            }
          }
          break;
        }
      }
    }

    return result;
  }

  /**
   * Scans a workspace root for CMakeLists.txt and recursively parses all include directories,
   * definitions, and targets across the entire project.
   */
  public static parseWorkspace(workspaceRoot: string): CMakeProjectInfo | null {
    if (!workspaceRoot) return null;

    const rootCMake = path.join(workspaceRoot, 'CMakeLists.txt');
    if (!fs.existsSync(rootCMake)) {
      return null;
    }

    const parsed = CMakeParser.parseFile(rootCMake, workspaceRoot);

    return {
      workspaceRoot,
      cmakeListsPath: rootCMake,
      includeDirectories: parsed.includeDirectories,
      globalIncludeDirectories: parsed.globalIncludeDirectories,
      compileDefinitions: parsed.compileDefinitions,
      globalCompileDefinitions: parsed.globalCompileDefinitions,
      cppStandard: parsed.cppStandard,
      cStandard: parsed.cStandard,
      targets: parsed.targets,
      subdirectories: parsed.subdirectories
    };
  }

  /**
   * Returns all discovered CMake include paths for a given workspace root.
   */
  public static getIncludePaths(workspaceRoot: string): string[] {
    const project = CMakeParser.parseWorkspace(workspaceRoot);
    return project ? project.includeDirectories : [];
  }
}
