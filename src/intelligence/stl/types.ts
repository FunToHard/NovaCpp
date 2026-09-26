/**
 * Core types for the decoupled ISO C++ and C Standard Library documentation subsystem.
 */

export interface StlComplexity {
  time: string;
  space?: string;
}

export interface StlDocEntry {
  symbol: string;
  canonicalSignature: string;
  summary: string;
  header: string;
  standard: string;
  parameters: Record<string, string>;
  returns: string;
  docUrl: string;
  complexity?: StlComplexity;
  exceptionSafety?: string;
  invalidation?: string;
  example?: string;
  seeAlso?: string[];
}

export interface StlHeaderModule {
  id: string;
  headers: string[];
  entries: Record<string, StlDocEntry>;
}
