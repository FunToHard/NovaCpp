import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import * as which from 'which';

export type CompilerType = 'msvc' | 'clang' | 'clang-cl' | 'gcc' | 'wsl-gcc' | 'wsl-clang';

export interface CompilerInfo {
  name: string;
  type: CompilerType;
  path: string;
  version?: string;
  is64Bit?: boolean;
  msvcVersion?: string;
  msvcInstallDir?: string;
  windowsSdkVersion?: string;
  windowsSdkDir?: string;
}

export class CompilerDetector {
  private cachedCompilers: CompilerInfo[] | null = null;

  /**
   * Detects all installed compilers across the system.
   */
  public async detectAllCompilers(forceRefresh = false): Promise<CompilerInfo[]> {
    if (this.cachedCompilers && !forceRefresh) {
      return this.cachedCompilers;
    }

    const compilers: CompilerInfo[] = [];

    // Run detections
    if (process.platform === 'win32') {
      compilers.push(...this.detectMSVC());
    }

    compilers.push(...this.detectClang());
    compilers.push(...this.detectGCC());

    if (process.platform === 'win32') {
      compilers.push(...this.detectWSL());
    }

    // Deduplicate by normalized path
    const seen = new Set<string>();
    const deduplicated = compilers.filter((c) => {
      const normalized = path.normalize(c.path).toLowerCase();
      if (seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    });

    this.cachedCompilers = deduplicated;
    return deduplicated;
  }

  /**
   * Detects MSVC toolsets using vswhere.exe or default VS directories.
   */
  public detectMSVC(): CompilerInfo[] {
    const results: CompilerInfo[] = [];
    const vswherePath = path.join(
      process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
      'Microsoft Visual Studio',
      'Installer',
      'vswhere.exe'
    );

    let installations: Array<{
      installationPath: string;
      displayName?: string;
      installationVersion?: string;
    }> = [];

    if (fs.existsSync(vswherePath)) {
      try {
        const stdout = cp.execFileSync(
          vswherePath,
          ['-latest', '-products', '*', '-format', 'json'],
          { encoding: 'utf8', timeout: 5000 }
        );
        installations = JSON.parse(stdout);
      } catch {
        // Fallback to checking default directories
      }
    }

    if (!installations || installations.length === 0) {
      const defaultPaths = [
        'C:\\Program Files\\Microsoft Visual Studio\\2022\\Enterprise',
        'C:\\Program Files\\Microsoft Visual Studio\\2022\\Professional',
        'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community',
        'C:\\Program Files\\Microsoft Visual Studio\\18\\Enterprise',
        'C:\\Program Files\\Microsoft Visual Studio\\18\\Professional',
        'C:\\Program Files\\Microsoft Visual Studio\\18\\Community'
      ];
      for (const p of defaultPaths) {
        if (fs.existsSync(p)) {
          installations.push({ installationPath: p, displayName: path.basename(p) });
        }
      }
    }

    const sdkInfo = this.detectWindowsSDK();

    for (const inst of installations) {
      const msvcBase = path.join(inst.installationPath, 'VC', 'Tools', 'MSVC');
      if (!fs.existsSync(msvcBase)) continue;

      try {
        const versions = fs.readdirSync(msvcBase).filter((v) => {
          return fs.statSync(path.join(msvcBase, v)).isDirectory();
        });

        for (const ver of versions) {
          const x64Cl = path.join(msvcBase, ver, 'bin', 'Hostx64', 'x64', 'cl.exe');
          const x86Cl = path.join(msvcBase, ver, 'bin', 'Hostx86', 'x86', 'cl.exe');

          if (fs.existsSync(x64Cl)) {
            results.push({
              name: `MSVC ${ver} (x64) - ${inst.displayName ?? 'Visual Studio'}`,
              type: 'msvc',
              path: x64Cl,
              version: ver,
              is64Bit: true,
              msvcVersion: ver,
              msvcInstallDir: path.join(msvcBase, ver),
              windowsSdkVersion: sdkInfo?.version,
              windowsSdkDir: sdkInfo?.sdkDir
            });
          } else if (fs.existsSync(x86Cl)) {
            results.push({
              name: `MSVC ${ver} (x86) - ${inst.displayName ?? 'Visual Studio'}`,
              type: 'msvc',
              path: x86Cl,
              version: ver,
              is64Bit: false,
              msvcVersion: ver,
              msvcInstallDir: path.join(msvcBase, ver),
              windowsSdkVersion: sdkInfo?.version,
              windowsSdkDir: sdkInfo?.sdkDir
            });
          }
        }
      } catch {
        // Skip unreadable directories
      }
    }

    return results;
  }

  private detectWindowsSDK(): { version: string; sdkDir: string } | null {
    const sdkIncludeBase = path.join(
      process.env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)',
      'Windows Kits',
      '10',
      'Include'
    );
    if (!fs.existsSync(sdkIncludeBase)) return null;

    try {
      const sdks = fs.readdirSync(sdkIncludeBase).filter((v) => {
        return (
          fs.statSync(path.join(sdkIncludeBase, v)).isDirectory() &&
          fs.existsSync(path.join(sdkIncludeBase, v, 'ucrt'))
        );
      });

      if (sdks.length > 0) {
        sdks.sort().reverse();
        const latest = sdks[0];
        return {
          version: latest,
          sdkDir: path.join(sdkIncludeBase, latest)
        };
      }
    } catch {
      // Ignored
    }
    return null;
  }

  public detectClang(): CompilerInfo[] {
    const results: CompilerInfo[] = [];
    const binaryNames =
      process.platform === 'win32'
        ? ['clang++.exe', 'clang.exe', 'clang-cl.exe']
        : ['clang++', 'clang'];

    for (const bin of binaryNames) {
      try {
        const binPath = which.sync(bin);
        if (binPath && fs.existsSync(binPath)) {
          const isClangCl = bin.includes('clang-cl');
          let version = '';
          try {
            const out = cp.execFileSync(binPath, ['--version'], {
              encoding: 'utf8',
              timeout: 2000
            });
            const m = out.match(/clang version ([0-9.]+)/i);
            if (m) version = m[1];
          } catch {
            // Ignored
          }

          results.push({
            name: `${isClangCl ? 'Clang-CL' : 'Clang'} ${version ? `(${version})` : ''} - ${binPath}`,
            type: isClangCl ? 'clang-cl' : 'clang',
            path: binPath,
            version
          });
        }
      } catch {
        // Not found in PATH
      }
    }

    return results;
  }

  public detectGCC(): CompilerInfo[] {
    const results: CompilerInfo[] = [];
    const candidates: string[] = [];

    const binNames = process.platform === 'win32' ? ['g++.exe', 'gcc.exe'] : ['g++', 'gcc'];

    for (const bin of binNames) {
      try {
        const found = which.sync(bin);
        if (found) candidates.push(found);
      } catch {
        // Ignored
      }
    }

    if (process.platform === 'win32') {
      const mingwDirs = [
        'C:\\ProgramData\\mingw64\\mingw64\\bin',
        'C:\\msys64\\mingw64\\bin',
        'C:\\msys64\\ucrt64\\bin',
        'C:\\msys64\\clang64\\bin',
        'C:\\mingw64\\bin'
      ];
      for (const dir of mingwDirs) {
        for (const bin of ['g++.exe', 'gcc.exe']) {
          const full = path.join(dir, bin);
          if (fs.existsSync(full)) {
            candidates.push(full);
          }
        }
      }
    }

    if (process.platform !== 'win32') {
      for (const dir of ['/usr/bin', '/usr/local/bin']) {
        for (const bin of ['g++', 'gcc']) {
          const full = path.join(dir, bin);
          if (fs.existsSync(full)) {
            candidates.push(full);
          }
        }
      }
    }

    const uniqueCandidates = Array.from(new Set(candidates));

    for (const cPath of uniqueCandidates) {
      let version = '';
      try {
        const out = cp.execFileSync(cPath, ['--version'], {
          encoding: 'utf8',
          timeout: 2000
        });
        const m = out.match(/gcc(?:\.exe)?\s+\(.*?\) ([0-9.]+)/i) || out.match(/([0-9]+\.[0-9]+\.[0-9]+)/);
        if (m) version = m[1];
      } catch {
        // Ignored
      }

      results.push({
        name: `GCC / G++ ${version ? `(${version})` : ''} - ${cPath}`,
        type: 'gcc',
        path: cPath,
        version
      });
    }

    return results;
  }

  public detectWSL(): CompilerInfo[] {
    const results: CompilerInfo[] = [];
    if (process.platform !== 'win32') return results;

    try {
      const wslPath = which.sync('wsl.exe');
      if (!wslPath) return results;

      for (const bin of ['g++', 'gcc', 'clang++']) {
        try {
          const out = cp.execFileSync(wslPath, ['which', bin], {
            encoding: 'utf8',
            timeout: 1000
          }).trim();
          if (out && out.startsWith('/')) {
            results.push({
              name: `WSL: ${bin} (${out})`,
              type: bin.includes('clang') ? 'wsl-clang' : 'wsl-gcc',
              path: `wsl.exe ${bin}`
            });
          }
        } catch {
          // WSL binary not available or timed out
        }
      }
    } catch {
      // WSL not available
    }

    return results;
  }

  public async getPreferredCompiler(): Promise<CompilerInfo | null> {
    const all = await this.detectAllCompilers();
    if (all.length === 0) return null;

    const msvc64 = all.find((c) => c.type === 'msvc' && c.is64Bit);
    if (msvc64) return msvc64;

    const clang = all.find((c) => c.type === 'clang');
    if (clang) return clang;

    const gcc = all.find((c) => c.type === 'gcc');
    if (gcc) return gcc;

    return all[0];
  }
}
