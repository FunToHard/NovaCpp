import * as path from 'path';
import * as fs from 'fs';
import * as which from 'which';

export interface DebuggerExecutable {
  type: 'lldb-dap' | 'gdb';
  path: string;
  args: string[];
}

export class LldbDapLocator {
  /**
   * Finds lldb-dap or lldb-vscode executable on the host system.
   */
  public static findLldbDap(customPath?: string): string | null {
    if (customPath && customPath.trim().length > 0) {
      const trimmed = customPath.trim();
      if (fs.existsSync(trimmed)) return trimmed;
      try {
        const found = which.sync(trimmed);
        if (found) return found;
      } catch {
        // Ignored
      }
      return null;
    }

    const binaryNames =
      process.platform === 'win32'
        ? ['lldb-dap.exe', 'lldb-vscode.exe']
        : ['lldb-dap', 'lldb-vscode'];

    // 1. Search PATH
    for (const bin of binaryNames) {
      try {
        const found = which.sync(bin);
        if (found && fs.existsSync(found)) {
          return found;
        }
      } catch {
        // Ignored
      }
    }

    // 2. Search standard LLVM directories on Windows
    if (process.platform === 'win32') {
      const candidates = [
        'C:\\Program Files\\LLVM\\bin',
        'C:\\Program Files (x86)\\LLVM\\bin',
        'C:\\ProgramData\\chocolatey\\bin'
      ];

      // Add Visual Studio bundled LLVM directories
      const vsBase = 'C:\\Program Files\\Microsoft Visual Studio';
      if (fs.existsSync(vsBase)) {
        try {
          const vsDirs = fs.readdirSync(vsBase);
          for (const d of vsDirs) {
            const fullD = path.join(vsBase, d);
            if (fs.existsSync(fullD)) {
              for (const edition of ['Enterprise', 'Professional', 'Community']) {
                const llvmDir = path.join(fullD, edition, 'VC', 'Tools', 'Llvm', 'bin');
                const llvmX64Dir = path.join(fullD, edition, 'VC', 'Tools', 'Llvm', 'x64', 'bin');
                if (fs.existsSync(llvmDir)) candidates.push(llvmDir);
                if (fs.existsSync(llvmX64Dir)) candidates.push(llvmX64Dir);
              }
            }
          }
        } catch {
          // Ignored
        }
      }

      for (const dir of candidates) {
        for (const bin of binaryNames) {
          const full = path.join(dir, bin);
          if (fs.existsSync(full)) {
            return full;
          }
        }
      }
    }

    // 3. Search standard Linux/Unix paths
    if (process.platform !== 'win32') {
      const unixDirs = ['/usr/bin', '/usr/local/bin', '/opt/homebrew/bin'];
      for (const dir of unixDirs) {
        for (const bin of binaryNames) {
          const full = path.join(dir, bin);
          if (fs.existsSync(full)) {
            return full;
          }
        }
      }
    }

    return null;
  }

  /**
   * Finds GDB executable on the host system.
   */
  public static findGdb(customPath?: string): string | null {
    if (customPath && customPath.trim().length > 0) {
      const trimmed = customPath.trim();
      if (fs.existsSync(trimmed)) return trimmed;
      try {
        const found = which.sync(trimmed);
        if (found) return found;
      } catch {
        // Ignored
      }
      return null;
    }

    const binaryNames = process.platform === 'win32' ? ['gdb.exe'] : ['gdb'];

    // 1. Search PATH
    for (const bin of binaryNames) {
      try {
        const found = which.sync(bin);
        if (found && fs.existsSync(found)) {
          return found;
        }
      } catch {
        // Ignored
      }
    }

    // 2. MinGW / MSYS2 standard locations on Windows
    if (process.platform === 'win32') {
      const mingwDirs = [
        'C:\\ProgramData\\mingw64\\mingw64\\bin',
        'C:\\msys64\\mingw64\\bin',
        'C:\\msys64\\ucrt64\\bin',
        'C:\\msys64\\clang64\\bin',
        'C:\\mingw64\\bin'
      ];
      for (const dir of mingwDirs) {
        for (const bin of binaryNames) {
          const full = path.join(dir, bin);
          if (fs.existsSync(full)) {
            return full;
          }
        }
      }
    }

    return null;
  }

  /**
   * Resolves the preferred debugger executable.
   * Priority:
   * 1. lldb-dap if available
   * 2. gdb with DAP mode
   */
  public static resolvePreferredDebugger(
    preference: 'auto' | 'lldb-dap' | 'gdb' = 'auto',
    customPath?: string
  ): DebuggerExecutable | null {
    if (preference === 'lldb-dap') {
      const lldb = this.findLldbDap(customPath);
      if (lldb) return { type: 'lldb-dap', path: lldb, args: [] };
      return null;
    }

    if (preference === 'gdb') {
      const gdb = this.findGdb(customPath);
      if (gdb) return { type: 'gdb', path: gdb, args: ['-q', '--interpreter=dap'] };
      return null;
    }

    // Auto resolution:
    // 1. Check custom path first if specified
    if (customPath) {
      const lldb = this.findLldbDap(customPath);
      if (lldb) return { type: 'lldb-dap', path: lldb, args: [] };
      const gdb = this.findGdb(customPath);
      if (gdb) return { type: 'gdb', path: gdb, args: ['-q', '--interpreter=dap'] };
    }

    // 2. Check for lldb-dap
    const lldb = this.findLldbDap();
    if (lldb) {
      return { type: 'lldb-dap', path: lldb, args: [] };
    }

    // 3. Check for gdb
    const gdb = this.findGdb();
    if (gdb) {
      return { type: 'gdb', path: gdb, args: ['-q', '--interpreter=dap'] };
    }

    return null;
  }
}
