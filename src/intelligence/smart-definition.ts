import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export const HEADER_EXTENSIONS = ['.h', '.hpp', '.hxx', '.hh', '.inl', '.inc'];
export const SOURCE_EXTENSIONS = ['.cpp', '.cc', '.cxx', '.c'];

/**
 * Checks if a given file path resides in system SDK or compiler include directories.
 */
export function isSystemHeader(filePath: string): boolean {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  return (
    normalized.includes('vc/tools/msvc') ||
    normalized.includes('windows kits') ||
    normalized.includes('windowskits') ||
    normalized.includes('usr/include') ||
    normalized.includes('usr/local/include') ||
    normalized.includes('mingw64') ||
    normalized.includes('mingw32') ||
    normalized.includes('lib/clang') ||
    normalized.includes('llvm/include') ||
    normalized.includes('/include/c++/') ||
    normalized.includes('/bits/') ||
    normalized.includes('sdk') ||
    normalized.includes('include/ucrt')
  );
}

/**
 * Known mapping from standard library symbols to canonical cppreference documentation URLs.
 */
export const CPPREFERENCE_MAP: Record<string, string> = {
  vector: 'https://en.cppreference.com/w/cpp/container/vector',
  'vector::push_back': 'https://en.cppreference.com/w/cpp/container/vector/push_back',
  'vector::emplace_back': 'https://en.cppreference.com/w/cpp/container/vector/emplace_back',
  string: 'https://en.cppreference.com/w/cpp/string/basic_string',
  string_view: 'https://en.cppreference.com/w/cpp/string/basic_string_view',
  span: 'https://en.cppreference.com/w/cpp/container/span',
  unique_ptr: 'https://en.cppreference.com/w/cpp/memory/unique_ptr',
  shared_ptr: 'https://en.cppreference.com/w/cpp/memory/shared_ptr',
  make_unique: 'https://en.cppreference.com/w/cpp/memory/unique_ptr/make_unique',
  make_shared: 'https://en.cppreference.com/w/cpp/memory/shared_ptr/make_shared',
  format: 'https://en.cppreference.com/w/cpp/utility/format/format',
  print: 'https://en.cppreference.com/w/cpp/io/print',
  println: 'https://en.cppreference.com/w/cpp/io/println',
  ranges: 'https://en.cppreference.com/w/cpp/ranges',
  views: 'https://en.cppreference.com/w/cpp/ranges',
  cout: 'https://en.cppreference.com/w/cpp/io/cout',
  cin: 'https://en.cppreference.com/w/cpp/io/cin',
  endl: 'https://en.cppreference.com/w/cpp/io/manip/endl',
  printf: 'https://en.cppreference.com/w/cpp/io/c/fprintf',
  malloc: 'https://en.cppreference.com/w/cpp/memory/c/malloc',
  free: 'https://en.cppreference.com/w/cpp/memory/c/free',
  memcpy: 'https://en.cppreference.com/w/cpp/string/byte/memcpy',
  sort: 'https://en.cppreference.com/w/cpp/algorithm/sort',
  find: 'https://en.cppreference.com/w/cpp/algorithm/find',
  optional: 'https://en.cppreference.com/w/cpp/utility/optional',
  variant: 'https://en.cppreference.com/w/cpp/utility/variant',
  any: 'https://en.cppreference.com/w/cpp/utility/any',
  tuple: 'https://en.cppreference.com/w/cpp/utility/tuple',
  map: 'https://en.cppreference.com/w/cpp/container/map',
  unordered_map: 'https://en.cppreference.com/w/cpp/container/unordered_map',
  set: 'https://en.cppreference.com/w/cpp/container/set',
  unordered_set: 'https://en.cppreference.com/w/cpp/container/unordered_set'
};

/**
 * Resolves a C++ symbol name to its corresponding cppreference documentation URL.
 */
export function getCppReferenceUrl(symbolName: string): string | null {
  if (!symbolName || symbolName.trim().length === 0) {
    return null;
  }

  // Clean symbol name (e.g. std::vector<int> -> vector, std::ranges::views::filter -> views)
  let clean = symbolName.replace(/<.*>$/, '').trim();
  clean = clean.replace(/^::/, '');
  clean = clean.replace(/^std::(?:ranges::)?(?:views::)?/, '');

  if (CPPREFERENCE_MAP[clean]) {
    return CPPREFERENCE_MAP[clean];
  }

  // Check top-level token (e.g. vector from vector::iterator)
  const baseToken = clean.split('::')[0];
  if (CPPREFERENCE_MAP[baseToken]) {
    return CPPREFERENCE_MAP[baseToken];
  }

  // General cppreference search fallback
  return `https://en.cppreference.com/mwiki/index.php?search=${encodeURIComponent(clean)}`;
}

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
      parts[parts.length - 1] = 'src';
      alternateDir = parts.join(path.sep);
    }
  } else {
    if (lastDir === 'src' || lastDir === 'source') {
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
      const aPath = a.targetUri.fsPath;
      const bPath = b.targetUri.fsPath;
      const aExt = path.extname(aPath).toLowerCase();
      const bExt = path.extname(bPath).toLowerCase();
      const aIsSource = SOURCE_EXTENSIONS.includes(aExt) && !isSystemHeader(aPath) ? 1 : 0;
      const bIsSource = SOURCE_EXTENSIONS.includes(bExt) && !isSystemHeader(bPath) ? 1 : 0;
      return bIsSource - aIsSource;
    });
    return sorted;
  } else {
    const locs = locations as vscode.Location[];
    const sorted = [...locs].sort((a, b) => {
      const aPath = a.uri.fsPath;
      const bPath = b.uri.fsPath;
      const aExt = path.extname(aPath).toLowerCase();
      const bExt = path.extname(bPath).toLowerCase();
      const aIsSource = SOURCE_EXTENSIONS.includes(aExt) && !isSystemHeader(aPath) ? 1 : 0;
      const bIsSource = SOURCE_EXTENSIONS.includes(bExt) && !isSystemHeader(bPath) ? 1 : 0;
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

  /**
   * Opens official C++ Reference documentation for a symbol or direct URL.
   */
  public static async openDocumentation(urlOrSymbol?: string): Promise<boolean> {
    let targetUrl: string | null = null;

    if (urlOrSymbol && (urlOrSymbol.startsWith('http://') || urlOrSymbol.startsWith('https://'))) {
      targetUrl = urlOrSymbol;
    } else if (urlOrSymbol) {
      targetUrl = getCppReferenceUrl(urlOrSymbol);
    } else {
      // Look up word at active cursor
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor) {
        const range = activeEditor.document.getWordRangeAtPosition(
          activeEditor.selection.active
        );
        if (range) {
          const word = activeEditor.document.getText(range);
          targetUrl = getCppReferenceUrl(word);
        }
      }
    }

    if (!targetUrl) {
      targetUrl = 'https://en.cppreference.com';
    }

    await vscode.env.openExternal(vscode.Uri.parse(targetUrl));
    return true;
  }
}
