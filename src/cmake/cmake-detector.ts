import * as fs from 'fs';
import * as path from 'path';

export class CMakeDetector {
  /**
   * Checks whether the workspace folder contains a CMakeLists.txt.
   */
  public static isCMakeWorkspace(workspaceRoot: string): boolean {
    if (!workspaceRoot) return false;
    try {
      const cmakeLists = path.join(workspaceRoot, 'CMakeLists.txt');
      return fs.existsSync(cmakeLists);
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
}
