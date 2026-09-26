/**
 * Curated knowledge base for ISO C++ Standard Library functions, types, and algorithms.
 * Emulates Rust Analyzer's depth by providing human-readable summaries, parameter descriptions,
 * standard version badges, canonical signatures, time/space complexity, iterator invalidation rules,
 * exception safety guarantees, and runnable modern C++ examples.
 *
 * This file serves as the unified facade and backward-compatible entry point, delegating to the
 * modular decoupled STL registry architecture in src/intelligence/stl/.
 */
import {
  stlRegistry,
  findStlDocumentation,
  findStlDocumentationAsync,
  registerStlModule,
  registerStlEntries,
  getStlEntriesByHeader,
  StlComplexity,
  StlDocEntry,
  StlHeaderModule
} from './stl';

export {
  stlRegistry,
  findStlDocumentation,
  findStlDocumentationAsync,
  registerStlModule,
  registerStlEntries,
  getStlEntriesByHeader,
  StlComplexity,
  StlDocEntry,
  StlHeaderModule
};

/**
 * Global dictionary representation of all registered STL and C Standard Library documentation entries.
 * Kept for full backward-compatibility with callers accessing the static record.
 */
export const STL_KNOWLEDGE_BASE: Record<string, StlDocEntry> = stlRegistry.getAllEntries();
