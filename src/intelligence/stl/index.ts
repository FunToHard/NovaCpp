/**
 * Decoupled ISO C++ Standard Library & C Standard Library Intelligence Subsystem.
 */
import { StlRegistry } from './registry';
import { BUILTIN_STL_MODULES } from './modules';
import { StlDocEntry, StlHeaderModule } from './types';
import { StlRemoteProvider } from '../stl-remote-provider';

// Create and initialize the central STL registry with all modular built-in headers
export const stlRegistry = new StlRegistry();
for (const mod of BUILTIN_STL_MODULES) {
  stlRegistry.registerModule(mod);
}

/**
 * Searches the Curated STL Knowledge Base for a given symbol name or method key.
 * Handles unqualified member lookups (e.g. "push_back" on "vector") and bare names.
 */
export function findStlDocumentation(symbolKey: string, scope?: string): StlDocEntry | null {
  return stlRegistry.lookup(symbolKey, scope);
}

/**
 * Asynchronously searches both the bundled ISO C++ / C Knowledge Base and the
 * remote/system header provider (Windows Win32, POSIX headers).
 */
export async function findStlDocumentationAsync(
  symbolKey: string,
  scope?: string
): Promise<StlDocEntry | null> {
  const local = findStlDocumentation(symbolKey, scope);
  if (local) {
    return local;
  }
  return StlRemoteProvider.getInstance().lookup(symbolKey);
}

/**
 * Registers an additional header module dynamically.
 */
export function registerStlModule(module: StlHeaderModule): void {
  stlRegistry.registerModule(module);
}

/**
 * Registers additional arbitrary documentation entries.
 */
export function registerStlEntries(entries: Record<string, StlDocEntry>): void {
  stlRegistry.registerEntries(entries);
}

/**
 * Returns all symbols documentation entries belonging to a given header.
 */
export function getStlEntriesByHeader(headerName: string): StlDocEntry[] {
  return stlRegistry.getByHeader(headerName);
}

export * from './types';
export * from './registry';
export * from './modules';
