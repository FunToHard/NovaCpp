import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export const HEADER_EXTENSIONS = ['.h', '.hpp', '.hxx', '.hh', '.inl', '.inc'];
export const SOURCE_EXTENSIONS = ['.cpp', '.cc', '.cxx', '.c'];

/**
 * Discovers the matching header or source file for a given C/C++ file path.
 */
export function findCounterpartFile(
  filePath: string,
  workspaceRoot?: string
): string | null {
  const parsed = path.parse(filePath);
  const ext = parsed.ext.toLowerCase();
  const dir = parsed.dir;
  const baseName = parsed.name;

  const isHeader = HEADER_EXTENSIONS.includes(ext);
  const targetExtensions = isHeader ? SOURCE_EXTENSIONS : HEADER_EXTENSIONS;

  // 1. Check in the same directory
  for (const candidateExt of targetExtensions) {
    const candidatePath = path.join(dir, baseName + candidateExt);
    if (fs.existsSync(candidatePath)) {
      return candidatePath;
    }
  }

  // 2. Check in conventional mirrored folders: src <-> include
  const parts = dir.split(path.sep);
  const lastDir = parts[parts.length - 1];

  let alternateDir: string | null = null;
  if (isHeader) {
    if (lastDir === 'include' || lastDir === 'inc') {
      // Replace include with src
      parts[parts.length - 1] = 'src';
      alternateDir = parts.join(path.sep);
    }
  } else {
    if (lastDir === 'src' || lastDir === 'source') {
      // Replace src with include
      parts[parts.length - 1] = 'include';
      alternateDir = parts.join(path.sep);
    }
  }

  if (alternateDir) {
    for (const candidateExt of targetExtensions) {
      const candidatePath = path.join(alternateDir, baseName + candidateExt);
      if (fs.existsSync(candidatePath)) {
        return candidatePath;
      }
    }
  }

  // 3. Search in workspace root if provided
  if (workspaceRoot && fs.existsSync(workspaceRoot)) {
    const searchDirs = isHeader
      ? [path.join(workspaceRoot, 'src'), path.join(workspaceRoot, 'source')]
      : [path.join(workspaceRoot, 'include'), path.join(workspaceRoot, 'inc')];

    for (const searchDir of searchDirs) {
      if (fs.existsSync(searchDir)) {
        for (const candidateExt of targetExtensions) {
          const candidatePath = path.join(searchDir, baseName + candidateExt);
          if (fs.existsSync(candidatePath)) {
            return candidatePath;
          }
        }
      }
    }
  }

  return null;
}

/**
 * Disambiguates and prioritizes definition locations, ordering .cpp implementations ahead of .h declarations.
 */
export function prioritizeDefinitionLocations(
  locations: vscode.Location | vscode.Location[] | vscode.LocationLink[]
): vscode.Location | vscode.Location[] | vscode.LocationLink[] {
  if (!Array.isArray(locations) || locations.length <= 1) {
    return locations;
  }

  // Check if Location or LocationLink
  const isLocationLink = 'targetUri' in locations[0];

  if (isLocationLink) {
    const links = locations as vscode.LocationLink[];
    const sorted = [...links].sort((a, b) => {
      const aExt = path.extname(a.targetUri.fsPath).toLowerCase();
      const bExt = path.extname(b.targetUri.fsPath).toLowerCase();
      const aIsSource = SOURCE_EXTENSIONS.includes(aExt) ? 1 : 0;
      const bIsSource = SOURCE_EXTENSIONS.includes(bExt) ? 1 : 0;
      return bIsSource - aIsSource;
    });
    return sorted;
  } else {
    const locs = locations as vscode.Location[];
    const sorted = [...locs].sort((a, b) => {
      const aExt = path.extname(a.uri.fsPath).toLowerCase();
      const bExt = path.extname(b.uri.fsPath).toLowerCase();
      const aIsSource = SOURCE_EXTENSIONS.includes(aExt) ? 1 : 0;
      const bIsSource = SOURCE_EXTENSIONS.includes(bExt) ? 1 : 0;
      return bIsSource - aIsSource;
    });
    return sorted;
  }
}

/**
 * Smart Definition and Source/Header Navigation Manager.
 */
export class SmartDefinitionManager {
  /**
   * Switches to the corresponding header or source file for the active editor.
   */
  public static async switchSourceHeader(): Promise<boolean> {
    const activeEditor = vscode.window.activeTextEditor;
    if (!activeEditor) {
      return false;
    }

    const currentDoc = activeEditor.document;
    const currentPath = currentDoc.uri.fsPath;
    const workspaceRoot = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    // Try filesystem counterpart resolution
    const counterpart = findCounterpartFile(currentPath, workspaceRoot);
    if (counterpart) {
      const doc = await vscode.workspace.openTextDocument(counterpart);
      await vscode.window.showTextDocument(doc);
      return true;
    }

    vscode.window.showInformationMessage(
      `NovaCpp: No matching counterpart file found for ${path.basename(currentPath)}`
    );
    return false;
  }
}
