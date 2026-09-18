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
    try {
      const res = cp.spawnSync(compilerPath, ['-E', '-x', 'c++', '-', '-v'], {
        input: '',
        encoding: 'utf8',
        timeout: 5000
      });

      const output = (res.stderr || '') + '\n' + (res.stdout || '');
      return this.parseSearchList(output);
    } catch {
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
