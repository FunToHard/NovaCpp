import * as fs from 'fs';
import * as path from 'path';

export interface ExternalSdkInfo {
  name: 'Vulkan' | 'raylib' | 'CUDA' | 'Boost' | 'SDL';
  version?: string;
  rootPath: string;
  includePaths: string[];
  libraryPaths?: string[];
  source: 'env' | 'filesystem';
}

export interface ExternalSdkDetectorOptions {
  env?: Record<string, string | undefined>;
  allowFsScan?: boolean;
}

/**
 * Compares two semantic version strings or version folder names in descending order.
 * E.g., '1.3.296.0' > '1.3.268.0', 'v12.4' > 'v12.2', 'boost_1_86_0' > 'boost_1_83_0'
 */
export function compareSemverDesc(a: string, b: string): number {
  const parse = (s: string) =>
    s
      .replace(/^[^0-9]*/, '')
      .split(/[._-]/)
      .map((n) => parseInt(n, 10) || 0);

  const pa = parse(a);
  const pb = parse(b);
  const len = Math.max(pa.length, pb.length);

  for (let i = 0; i < len; i++) {
    const diff = (pb[i] || 0) - (pa[i] || 0);
    if (diff !== 0) return diff;
  }
  return b.localeCompare(a);
}

export class ExternalSdkDetector {
  /**
   * Discovers Vulkan SDK via VULKAN_SDK environment variable or standard installation paths.
   */
  public static detectVulkan(options: ExternalSdkDetectorOptions = {}): ExternalSdkInfo | null {
    const env = options.env ?? process.env;
    const allowFsScan = options.allowFsScan ?? true;

    // 1. Check environment variable VULKAN_SDK
    const envPath = env.VULKAN_SDK;
    if (envPath) {
      try {
        if (fs.existsSync(envPath)) {
          const incCandidates = [
            path.join(envPath, 'Include'),
            path.join(envPath, 'include')
          ];
          for (const inc of incCandidates) {
            if (fs.existsSync(inc)) {
              return {
                name: 'Vulkan',
                rootPath: envPath,
                includePaths: [inc],
                libraryPaths: [
                  path.join(envPath, 'Lib'),
                  path.join(envPath, 'lib')
                ].filter((p) => {
                  try { return fs.existsSync(p); } catch { return false; }
                }),
                source: 'env'
              };
            }
          }
        }
      } catch {
        // Ignore fs permission errors
      }
    }

    if (!allowFsScan) return null;

    // 2. Scan standard Windows paths: C:\VulkanSDK\<version>
    const candidateBases = [
      'C:\\VulkanSDK',
      'D:\\VulkanSDK'
    ];

    for (const base of candidateBases) {
      try {
        if (fs.existsSync(base)) {
          const entries = fs.readdirSync(base, { withFileTypes: true })
            .filter((d) => d.isDirectory())
            .map((d) => d.name)
            .sort(compareSemverDesc);

          for (const dirName of entries) {
            const rootDir = path.join(base, dirName);
            const incDir = path.join(rootDir, 'Include');
            const incDirLower = path.join(rootDir, 'include');
            const targetInc = fs.existsSync(incDir) ? incDir : (fs.existsSync(incDirLower) ? incDirLower : null);

            if (targetInc) {
              return {
                name: 'Vulkan',
                version: dirName,
                rootPath: rootDir,
                includePaths: [targetInc],
                libraryPaths: [path.join(rootDir, 'Lib'), path.join(rootDir, 'lib')].filter((p) => {
                  try { return fs.existsSync(p); } catch { return false; }
                }),
                source: 'filesystem'
              };
            }
          }
        }
      } catch {
        // Ignore read errors
      }
    }

    // 3. Scan POSIX / Linux / macOS paths
    const posixCandidates = [
      '/usr/include/vulkan',
      '/usr/local/include/vulkan',
      '/opt/homebrew/include/vulkan'
    ];

    for (const p of posixCandidates) {
      try {
        if (fs.existsSync(p)) {
          const parent = path.dirname(p);
          return {
            name: 'Vulkan',
            rootPath: parent,
            includePaths: [parent],
            source: 'filesystem'
          };
        }
      } catch {
        // Ignore
      }
    }

    return null;
  }

  /**
   * Discovers raylib via RAYLIB_DIR / RAYLIB_PATH or common installation directories.
   */
  public static detectRaylib(options: ExternalSdkDetectorOptions = {}): ExternalSdkInfo | null {
    const env = options.env ?? process.env;
    const allowFsScan = options.allowFsScan ?? true;

    // 1. Environment variables
    const envCandidates = [env.RAYLIB_DIR, env.RAYLIB_PATH, env.RAYLIB_ROOT];
    for (const envPath of envCandidates) {
      if (envPath) {
        try {
          if (fs.existsSync(envPath)) {
            const incCandidates = [
              path.join(envPath, 'raylib', 'src'),
              path.join(envPath, 'src'),
              path.join(envPath, 'include'),
              envPath
            ];
            for (const inc of incCandidates) {
              if (fs.existsSync(path.join(inc, 'raylib.h'))) {
                return {
                  name: 'raylib',
                  rootPath: envPath,
                  includePaths: [inc],
                  source: 'env'
                };
              }
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    if (!allowFsScan) return null;

    // 2. Standard Windows installation paths: C:\raylib
    const winCandidates = [
      { root: 'C:\\raylib', inc: 'C:\\raylib\\raylib\\src' },
      { root: 'C:\\raylib', inc: 'C:\\raylib\\include' },
      { root: 'C:\\raylib\\raylib', inc: 'C:\\raylib\\raylib\\include' },
      { root: 'D:\\raylib', inc: 'D:\\raylib\\raylib\\src' },
      { root: 'D:\\raylib', inc: 'D:\\raylib\\include' }
    ];

    for (const cand of winCandidates) {
      try {
        if (fs.existsSync(path.join(cand.inc, 'raylib.h'))) {
          return {
            name: 'raylib',
            rootPath: cand.root,
            includePaths: [cand.inc],
            source: 'filesystem'
          };
        }
      } catch {
        // Ignore
      }
    }

    // 3. POSIX / Linux / Homebrew paths
    const posixCandidates = [
      '/usr/local/include',
      '/usr/include',
      '/opt/homebrew/include'
    ];

    for (const dir of posixCandidates) {
      try {
        if (fs.existsSync(path.join(dir, 'raylib.h'))) {
          return {
            name: 'raylib',
            rootPath: dir,
            includePaths: [dir],
            source: 'filesystem'
          };
        }
      } catch {
        // Ignore
      }
    }

    return null;
  }

  /**
   * Discovers NVIDIA CUDA Toolkit via CUDA_PATH or standard Windows/Linux installation paths.
   */
  public static detectCuda(options: ExternalSdkDetectorOptions = {}): ExternalSdkInfo | null {
    const env = options.env ?? process.env;
    const allowFsScan = options.allowFsScan ?? true;

    // 1. Environment variables
    const envCandidates = [
      env.CUDA_PATH,
      env.CUDA_HOME,
      ...Object.keys(env)
        .filter((k) => k.startsWith('CUDA_PATH_V'))
        .map((k) => env[k])
    ];

    for (const envPath of envCandidates) {
      if (envPath) {
        try {
          const inc = path.join(envPath, 'include');
          if (fs.existsSync(inc)) {
            return {
              name: 'CUDA',
              rootPath: envPath,
              includePaths: [inc],
              libraryPaths: [path.join(envPath, 'lib', 'x64')].filter((p) => {
                try { return fs.existsSync(p); } catch { return false; }
              }),
              source: 'env'
            };
          }
        } catch {
          // Ignore
        }
      }
    }

    if (!allowFsScan) return null;

    // 2. Windows default path: C:\Program Files\NVIDIA GPU Computing Toolkit\CUDA\v*.*
    const winBase = 'C:\\Program Files\\NVIDIA GPU Computing Toolkit\\CUDA';
    try {
      if (fs.existsSync(winBase)) {
        const entries = fs.readdirSync(winBase, { withFileTypes: true })
          .filter((d) => d.isDirectory())
          .map((d) => d.name)
          .sort(compareSemverDesc);

        for (const dirName of entries) {
          const rootDir = path.join(winBase, dirName);
          const inc = path.join(rootDir, 'include');
          if (fs.existsSync(inc)) {
            return {
              name: 'CUDA',
              version: dirName,
              rootPath: rootDir,
              includePaths: [inc],
              libraryPaths: [path.join(rootDir, 'lib', 'x64')].filter((p) => {
                try { return fs.existsSync(p); } catch { return false; }
              }),
              source: 'filesystem'
            };
          }
        }
      }
    } catch {
      // Ignore
    }

    // 3. Linux default path: /usr/local/cuda/include
    const linuxInc = '/usr/local/cuda/include';
    try {
      if (fs.existsSync(linuxInc)) {
        return {
          name: 'CUDA',
          rootPath: '/usr/local/cuda',
          includePaths: [linuxInc],
          source: 'filesystem'
        };
      }
    } catch {
      // Ignore
    }

    return null;
  }

  /**
   * Discovers Boost C++ Libraries via BOOST_ROOT, BOOST_DIR, or C:\local\boost_*
   */
  public static detectBoost(options: ExternalSdkDetectorOptions = {}): ExternalSdkInfo | null {
    const env = options.env ?? process.env;
    const allowFsScan = options.allowFsScan ?? true;

    // 1. Environment variables
    const envCandidates = [env.BOOST_ROOT, env.BOOST_DIR, env.BOOST_INCLUDEDIR];
    for (const envPath of envCandidates) {
      if (envPath) {
        try {
          if (fs.existsSync(path.join(envPath, 'boost', 'version.hpp'))) {
            return {
              name: 'Boost',
              rootPath: envPath,
              includePaths: [envPath],
              source: 'env'
            };
          }
          const inc = path.join(envPath, 'include');
          if (fs.existsSync(path.join(inc, 'boost', 'version.hpp')) || fs.existsSync(inc)) {
            return {
              name: 'Boost',
              rootPath: envPath,
              includePaths: [inc],
              source: 'env'
            };
          }
        } catch {
          // Ignore
        }
      }
    }

    if (!allowFsScan) return null;

    // 2. Windows common directory: C:\local\boost_*
    const localDir = 'C:\\local';
    try {
      if (fs.existsSync(localDir)) {
        const entries = fs.readdirSync(localDir, { withFileTypes: true })
          .filter((d) => d.isDirectory() && d.name.toLowerCase().startsWith('boost'))
          .map((d) => d.name)
          .sort(compareSemverDesc);

        for (const dirName of entries) {
          const rootDir = path.join(localDir, dirName);
          if (fs.existsSync(path.join(rootDir, 'boost', 'version.hpp'))) {
            return {
              name: 'Boost',
              version: dirName,
              rootPath: rootDir,
              includePaths: [rootDir],
              source: 'filesystem'
            };
          }
        }
      }
    } catch {
      // Ignore
    }

    // 3. POSIX common directories
    const posixDirs = ['/usr/include/boost', '/usr/local/include/boost', '/opt/homebrew/include/boost'];
    for (const p of posixDirs) {
      try {
        if (fs.existsSync(p)) {
          const parent = path.dirname(p);
          return {
            name: 'Boost',
            rootPath: parent,
            includePaths: [parent],
            source: 'filesystem'
          };
        }
      } catch {
        // Ignore
      }
    }

    return null;
  }

  /**
   * Discovers SDL2 / SDL3 libraries via SDL2_DIR, SDL3_DIR, or C:\SDL2\include, etc.
   */
  public static detectSdl(options: ExternalSdkDetectorOptions = {}): ExternalSdkInfo | null {
    const env = options.env ?? process.env;
    const allowFsScan = options.allowFsScan ?? true;

    // 1. Environment variables
    const envCandidates = [
      { name: 'SDL3_DIR', val: env.SDL3_DIR },
      { name: 'SDL2_DIR', val: env.SDL2_DIR },
      { name: 'SDL_DIR', val: env.SDL_DIR }
    ];

    for (const item of envCandidates) {
      if (item.val) {
        try {
          const incCandidates = [
            path.join(item.val, 'include'),
            path.join(item.val, 'include', 'SDL2'),
            path.join(item.val, 'include', 'SDL3'),
            item.val
          ];
          for (const inc of incCandidates) {
            if (
              fs.existsSync(path.join(inc, 'SDL.h')) ||
              fs.existsSync(path.join(inc, 'SDL3', 'SDL.h')) ||
              fs.existsSync(path.join(inc, 'SDL2', 'SDL.h'))
            ) {
              return {
                name: 'SDL',
                rootPath: item.val,
                includePaths: [inc],
                source: 'env'
              };
            }
          }
        } catch {
          // Ignore
        }
      }
    }

    if (!allowFsScan) return null;

    // 2. Windows filesystem paths
    const winCandidates = [
      'C:\\SDL3\\include',
      'C:\\SDL2\\include',
      'C:\\SDL\\include',
      'C:\\local\\SDL2\\include',
      'C:\\local\\SDL3\\include'
    ];

    for (const inc of winCandidates) {
      try {
        if (fs.existsSync(inc)) {
          return {
            name: 'SDL',
            rootPath: path.dirname(inc),
            includePaths: [inc],
            source: 'filesystem'
          };
        }
      } catch {
        // Ignore
      }
    }

    // 3. POSIX paths
    const posixCandidates = [
      '/usr/include/SDL2',
      '/usr/include/SDL3',
      '/usr/local/include/SDL2',
      '/usr/local/include/SDL3',
      '/opt/homebrew/include/SDL2',
      '/opt/homebrew/include/SDL3'
    ];

    for (const dir of posixCandidates) {
      try {
        if (fs.existsSync(dir)) {
          return {
            name: 'SDL',
            rootPath: path.dirname(dir),
            includePaths: [dir, path.dirname(dir)],
            source: 'filesystem'
          };
        }
      } catch {
        // Ignore
      }
    }

    return null;
  }

  /**
   * Detects all supported external SDKs and returns their metadata.
   */
  public static detectAll(options: ExternalSdkDetectorOptions = {}): ExternalSdkInfo[] {
    const detectors = [
      () => ExternalSdkDetector.detectVulkan(options),
      () => ExternalSdkDetector.detectRaylib(options),
      () => ExternalSdkDetector.detectCuda(options),
      () => ExternalSdkDetector.detectBoost(options),
      () => ExternalSdkDetector.detectSdl(options)
    ];

    const results: ExternalSdkInfo[] = [];
    for (const detector of detectors) {
      try {
        const info = detector();
        if (info) {
          results.push(info);
        }
      } catch {
        // Safe fail-through
      }
    }

    return results;
  }

  /**
   * Gathers all detected include directories, normalized with forward slashes and de-duplicated.
   */
  public static getAllIncludePaths(options: ExternalSdkDetectorOptions = {}): string[] {
    const sdks = ExternalSdkDetector.detectAll(options);
    const seen = new Set<string>();
    const includePaths: string[] = [];

    for (const sdk of sdks) {
      for (const inc of sdk.includePaths) {
        const normalized = inc.replace(/\\/g, '/');
        if (!seen.has(normalized)) {
          seen.add(normalized);
          includePaths.push(normalized);
        }
      }
    }

    return includePaths;
  }

  /**
   * Synchronizes discovered external SDK include paths into the workspace .clangd YAML configuration.
   * This guarantees clangd injects the include paths into EVERY file in the workspace,
   * even when an existing compile_commands.json or CMake build database is active.
   */
  public static syncWorkspaceClangdConfig(
    workspaceRoot: string,
    options: ExternalSdkDetectorOptions = {}
  ): boolean {
    try {
      const includes = ExternalSdkDetector.getAllIncludePaths(options);
      if (includes.length === 0) return false;

      const clangdPath = path.join(workspaceRoot, '.clangd');
      const addFlags = includes.map((inc) => `-I${inc.replace(/\\/g, '/')}`);

      if (!fs.existsSync(clangdPath)) {
        const content = [
          '# Generated by NovaCpp - External SDKs & IntelliSense Integration',
          'CompileFlags:',
          '  Add:',
          ...addFlags.map((f) => `    - "${f}"`),
          ''
        ].join('\n');
        fs.writeFileSync(clangdPath, content, 'utf8');
        return true;
      }

      const existing = fs.readFileSync(clangdPath, 'utf8');
      const missingFlags = addFlags.filter((f) => !existing.includes(f));
      if (missingFlags.length === 0) return false;

      if (/CompileFlags:\s*\n\s*Add:/i.test(existing)) {
        const replacement = missingFlags.map((f) => `    - "${f}"`).join('\n');
        const updated = existing.replace(
          /(CompileFlags:\s*\n\s*Add:)/i,
          `$1\n${replacement}`
        );
        fs.writeFileSync(clangdPath, updated, 'utf8');
        return true;
      } else if (/CompileFlags:/i.test(existing)) {
        const replacement = `CompileFlags:\n  Add:\n` + missingFlags.map((f) => `    - "${f}"`).join('\n');
        const updated = existing.replace(/CompileFlags:/i, replacement);
        fs.writeFileSync(clangdPath, updated, 'utf8');
        return true;
      } else {
        const toAppend = [
          '',
          '# External SDKs added by NovaCpp',
          'CompileFlags:',
          '  Add:',
          ...missingFlags.map((f) => `    - "${f}"`),
          ''
        ].join('\n');
        fs.writeFileSync(clangdPath, existing + toAppend, 'utf8');
        return true;
      }
    } catch {
      return false;
    }
  }
}
