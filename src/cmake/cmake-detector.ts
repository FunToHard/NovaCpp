import * as fs from 'fs';
import * as path from 'path';
import * as cp from 'child_process';
import { CMakePreset } from './cmake-models';

export class CMakeDetector {
  /**
   * Discovers the cmake binary from user settings, PATH, or standard platform directories.
   */
  public static async findCMake(customPath?: string): Promise<string | null> {
    if (customPath && customPath.trim().length > 0) {
      const trimmed = customPath.trim();
      try {
        if (fs.existsSync(trimmed)) {
          return trimmed;
        }
      } catch {
        // Fall through
      }
    }

    // 1. Check PATH
    try {
      const isWin = process.platform === 'win32';
      const checkCmd = isWin ? 'where.exe cmake' : 'which cmake';
      const out = cp.execSync(checkCmd, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
      const firstLine = out.split(/\r?\n/)[0]?.trim();
      if (firstLine && fs.existsSync(firstLine)) {
        return firstLine;
      }
    } catch {
      // Ignore PATH check failure
    }

    // 2. Standard Windows locations
    if (process.platform === 'win32') {
      const candidates = [
        'C:\\Program Files\\CMake\\bin\\cmake.exe',
        'C:\\Program Files (x86)\\CMake\\bin\\cmake.exe'
      ];

      for (const cand of candidates) {
        try {
          if (fs.existsSync(cand)) return cand;
        } catch {
          // Ignore
        }
      }

      // Check Visual Studio bundled CMake
      const vsBases = [
        'C:\\Program Files\\Microsoft Visual Studio\\2022',
        'C:\\Program Files (x86)\\Microsoft Visual Studio\\2019'
      ];
      const vsEditions = ['Enterprise', 'Professional', 'Community', 'Preview', 'BuildTools'];

      for (const base of vsBases) {
        for (const ed of vsEditions) {
          const vsCmake = path.join(
            base,
            ed,
            'Common7\\IDE\\CommonExtensions\\Microsoft\\CMake\\CMake\\bin\\cmake.exe'
          );
          try {
            if (fs.existsSync(vsCmake)) return vsCmake;
          } catch {
            // Ignore
          }
        }
      }
    } else {
      // POSIX locations
      const posixCandidates = [
        '/usr/local/bin/cmake',
        '/usr/bin/cmake',
        '/opt/homebrew/bin/cmake',
        '/opt/local/bin/cmake'
      ];
      for (const cand of posixCandidates) {
        try {
          if (fs.existsSync(cand)) return cand;
        } catch {
          // Ignore
        }
      }
    }

    return null;
  }

  /**
   * Checks whether the workspace folder is a CMake project.
   */
  public static isCMakeWorkspace(workspaceRoot: string): boolean {
    if (!workspaceRoot) return false;
    try {
      const cmakeLists = path.join(workspaceRoot, 'CMakeLists.txt');
      const cmakePresets = path.join(workspaceRoot, 'CMakePresets.json');
      return fs.existsSync(cmakeLists) || fs.existsSync(cmakePresets);
    } catch {
      return false;
    }
  }

  /**
   * Returns path to CMakeLists.txt in workspace root or null if not found.
   */
  public static findCMakeLists(workspaceRoot: string): string | null {
    if (!workspaceRoot) return null;
    const file = path.join(workspaceRoot, 'CMakeLists.txt');
    try {
      return fs.existsSync(file) ? file : null;
    } catch {
      return null;
    }
  }

  /**
   * Discovers all compile_commands.json files across common CMake build directories.
   * Sorted descending by last modified timestamp (most recent first).
   */
  public static findCompilationDatabases(workspaceRoot: string, customBuildDir?: string): string[] {
    if (!workspaceRoot || !fs.existsSync(workspaceRoot)) return [];

    const candidates: string[] = [];

    // Custom build dir candidate
    if (customBuildDir) {
      const customPath = path.isAbsolute(customBuildDir)
        ? path.join(customBuildDir, 'compile_commands.json')
        : path.join(workspaceRoot, customBuildDir, 'compile_commands.json');
      candidates.push(customPath);
    }

    // Direct root
    candidates.push(path.join(workspaceRoot, 'compile_commands.json'));

    // Standard build directory
    const buildDir = path.join(workspaceRoot, 'build');
    candidates.push(path.join(buildDir, 'compile_commands.json'));

    // Multi-configuration directories under build/
    try {
      if (fs.existsSync(buildDir)) {
        const subdirs = fs.readdirSync(buildDir, { withFileTypes: true });
        for (const sub of subdirs) {
          if (sub.isDirectory()) {
            candidates.push(path.join(buildDir, sub.name, 'compile_commands.json'));
          }
        }
      }
    } catch {
      // Ignore read errors
    }

    // Visual Studio CMake output dirs: out/build/<preset>/
    const outBuildDir = path.join(workspaceRoot, 'out', 'build');
    try {
      if (fs.existsSync(outBuildDir)) {
        const subdirs = fs.readdirSync(outBuildDir, { withFileTypes: true });
        for (const sub of subdirs) {
          if (sub.isDirectory()) {
            candidates.push(path.join(outBuildDir, sub.name, 'compile_commands.json'));
          }
        }
      }
    } catch {
      // Ignore read errors
    }

    // CLion standard build dirs
    candidates.push(
      path.join(workspaceRoot, 'cmake-build-debug', 'compile_commands.json'),
      path.join(workspaceRoot, 'cmake-build-release', 'compile_commands.json'),
      path.join(workspaceRoot, 'cmake-build-relwithdebinfo', 'compile_commands.json')
    );

    // Preset binaryDirs
    const presets = CMakeDetector.readPresets(workspaceRoot);
    for (const p of presets) {
      if (p.binaryDir) {
        const bDir = p.binaryDir
          .replace(/\$\{sourceDir\}/gi, workspaceRoot)
          .replace(/\$\{workspaceFolder\}/gi, workspaceRoot)
          .replace(/\$\{presetName\}/gi, p.name);
        const absDir = path.isAbsolute(bDir) ? bDir : path.resolve(workspaceRoot, bDir);
        candidates.push(path.join(absDir, 'compile_commands.json'));
      }
    }

    // Filter to existing valid files with size > 0
    const validDatabases: { filePath: string; mtime: number }[] = [];
    const seen = new Set<string>();

    for (const c of candidates) {
      const norm = path.normalize(c);
      if (seen.has(norm)) continue;
      seen.add(norm);

      try {
        if (fs.existsSync(norm)) {
          const stat = fs.statSync(norm);
          if (stat.size > 0) {
            validDatabases.push({ filePath: norm, mtime: stat.mtimeMs });
          }
        }
      } catch {
        // Ignore
      }
    }

    // Sort by mtime descending
    validDatabases.sort((a, b) => b.mtime - a.mtime);
    return validDatabases.map((v) => v.filePath);
  }

  /**
   * Returns the primary compilation database for the workspace or null if none found.
   */
  public static findCompilationDatabase(workspaceRoot: string, customBuildDir?: string): string | null {
    const list = CMakeDetector.findCompilationDatabases(workspaceRoot, customBuildDir);
    return list.length > 0 ? list[0] : null;
  }

  /**
   * Reads configure presets from CMakePresets.json and CMakeUserPresets.json.
   */
  public static readPresets(workspaceRoot: string): CMakePreset[] {
    const presets: CMakePreset[] = [];
    const presetFiles = [
      path.join(workspaceRoot, 'CMakePresets.json'),
      path.join(workspaceRoot, 'CMakeUserPresets.json')
    ];

    for (const pf of presetFiles) {
      try {
        if (fs.existsSync(pf)) {
          const raw = fs.readFileSync(pf, 'utf8');
          const data = JSON.parse(raw);
          if (Array.isArray(data.configurePresets)) {
            for (const cp of data.configurePresets) {
              if (cp && typeof cp.name === 'string') {
                presets.push({
                  name: cp.name,
                  displayName: cp.displayName,
                  description: cp.description,
                  binaryDir: cp.binaryDir,
                  generator: cp.generator,
                  cacheVariables: cp.cacheVariables
                });
              }
            }
          }
        }
      } catch {
        // Ignore JSON parse errors
      }
    }

    return presets;
  }
}
