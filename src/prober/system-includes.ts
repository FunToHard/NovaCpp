import * as path from 'path';
import * as fs from 'fs';
import * as cp from 'child_process';
import { CompilerInfo } from './compiler-detector';

export class SystemIncludeExtractor {
  private cache = new Map<string, string[]>();

  /**
   * Extracts implicit system include directories for the given compiler.
   */
  public async extractSystemIncludes(compiler: CompilerInfo): Promise<string[]> {
    if (this.cache.has(compiler.path)) {
      return this.cache.get(compiler.path)!;
    }

    let includes: string[] = [];

    if (compiler.type === 'msvc') {
      includes = this.extractMSVCIncludes(compiler);
    } else if (compiler.type === 'gcc' || compiler.type === 'clang') {
      includes = this.extractGccClangIncludes(compiler.path);
    } else if (compiler.type === 'clang-cl') {
      // clang-cl can use MSVC includes if available
      includes = this.extractMSVCIncludes(compiler);
      if (includes.length === 0) {
        includes = this.extractGccClangIncludes(compiler.path);
      }
    }

    // Filter valid directories only
    const valid = includes.filter((p) => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isDirectory();
      } catch {
        return false;
      }
    });

    this.cache.set(compiler.path, valid);
    return valid;
  }

  /**
   * Probes GCC or Clang using the standard preprocessor command.
   */
  public extractGccClangIncludes(compilerPath: string): string[] {
    const isWindows = process.platform === 'win32';
    const nullDevice = isWindows ? 'NUL' : '/dev/null';

    try {
      // Run: compiler -E -x c++ - -v < NUL
      let stderr = '';
      if (isWindows) {
        // cmd.exe handles '< NUL' redirection reliably on Windows
        stderr = cp.execSync(`cmd.exe /c ""${compilerPath}" -E -x c++ - -v < NUL"`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 5000
        });
      } else {
        stderr = cp.execSync(`"${compilerPath}" -E -x c++ - -v < /dev/null`, {
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: 5000
        });
      }

      return this.parseSearchList(stderr);
    } catch (err: any) {
      // The output of -v is printed to stderr by GCC/Clang
      if (err.stderr) {
        return this.parseSearchList(err.stderr.toString());
      }
      if (err.stdout) {
        return this.parseSearchList(err.stdout.toString());
      }
      return [];
    }
  }

  /**
   * Parses the include paths between:
   * #include <...> search starts here:
   * End of search list.
   */
  public parseSearchList(output: string): string[] {
    const includes: string[] = [];
    const lines = output.split(/\r?\n/);
    let collecting = false;

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.includes('#include <...> search starts here:')) {
        collecting = true;
        continue;
      }
      if (collecting && trimmed.includes('End of search list.')) {
        break;
      }
      if (collecting && trimmed.length > 0) {
        // Handle '(framework directory)' or similar annotations
        const cleaned = trimmed.replace(/\s*\(framework directory\)/, '');
        const normalized = path.normalize(cleaned);
        if (fs.existsSync(normalized)) {
          includes.push(normalized);
        }
      }
    }

    return includes;
  }

  /**
   * Resolves MSVC CRT, STL, and Windows SDK include paths.
   */
  public extractMSVCIncludes(compiler: CompilerInfo): string[] {
    const includes: string[] = [];

    // 1. MSVC STL and CRT
    if (compiler.msvcInstallDir) {
      const vcInclude = path.join(compiler.msvcInstallDir, 'include');
      if (fs.existsSync(vcInclude)) {
        includes.push(vcInclude);
      }
      const atlmfcInclude = path.join(compiler.msvcInstallDir, 'atlmfc', 'include');
      if (fs.existsSync(atlmfcInclude)) {
        includes.push(atlmfcInclude);
      }
    }

    // 2. Windows 10/11 SDK headers
    if (compiler.windowsSdkDir) {
      const subdirs = ['ucrt', 'shared', 'um', 'winrt', 'cppwinrt'];
      for (const sub of subdirs) {
        const full = path.join(compiler.windowsSdkDir, sub);
        if (fs.existsSync(full)) {
          includes.push(full);
        }
      }
    }

    return includes;
  }
}
