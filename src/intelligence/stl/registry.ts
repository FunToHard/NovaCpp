/**
 * Decoupled registry for ISO C++ Standard Library and C Standard Library documentation.
 * Enables modular addition of symbols per header and library group.
 */
import { StlDocEntry, StlHeaderModule } from './types';

export class StlRegistry {
  private readonly entries = new Map<string, StlDocEntry>();
  private readonly headerIndex = new Map<string, Set<string>>();

  /**
   * Registers a single documentation entry into the registry.
   */
  public registerEntry(entry: StlDocEntry): void {
    this.entries.set(entry.symbol, entry);

    const normHeader = entry.header.trim().toLowerCase();
    let headerSet = this.headerIndex.get(normHeader);
    if (!headerSet) {
      headerSet = new Set<string>();
      this.headerIndex.set(normHeader, headerSet);
    }
    headerSet.add(entry.symbol);

    // Also index under C header counterpart if <c...> (e.g. <cstdio> -> <stdio.h>)
    const cMatch = normHeader.match(/^<c([a-z0-9_]+)>$/);
    if (cMatch) {
      const cHeader = `<${cMatch[1]}.h>`;
      let cSet = this.headerIndex.get(cHeader);
      if (!cSet) {
        cSet = new Set<string>();
        this.headerIndex.set(cHeader, cSet);
      }
      cSet.add(entry.symbol);
    }

    // Also register bare C function name if it starts with std:: and belongs to a C library header (<c...>)
    if (entry.symbol.startsWith('std::') && normHeader.startsWith('<c') && normHeader.endsWith('>')) {
      const bareName = entry.symbol.replace(/^std::/, '');
      if (!this.entries.has(bareName)) {
        this.entries.set(bareName, entry);
      }
    }
  }

  /**
   * Registers a collection of documentation entries.
   */
  public registerEntries(entries: Record<string, StlDocEntry>): void {
    for (const key of Object.keys(entries)) {
      this.registerEntry(entries[key]);
    }
  }

  /**
   * Registers an entire header module.
   */
  public registerModule(module: StlHeaderModule): void {
    this.registerEntries(module.entries);
  }

  /**
   * Searches the registry for documentation matching the symbol or scope.
   */
  public lookup(symbolKey: string, scope?: string): StlDocEntry | null {
    if (!symbolKey) {
      return null;
    }

    const clean = symbolKey.trim().replace(/^::/, '');

    // 1. Check with scope if available (e.g. scope = "std::vector<int>", clean = "push_back")
    if (scope) {
      const cleanScope = scope.replace(/<.*>$/, '').replace(/^::/, '').trim();
      const scopeParts = cleanScope.split('::');
      const className = scopeParts[scopeParts.length - 1];
      const candidateWithScope = `std::${className}::${clean}`;
      const found = this.entries.get(candidateWithScope);
      if (found) {
        return found;
      }
    }

    // 2. Direct match with exact key
    const direct = this.entries.get(clean);
    if (direct) {
      return direct;
    }

    // 3. Try prefixing std:: if not present
    if (!clean.startsWith('std::')) {
      const withStd = `std::${clean}`;
      const found = this.entries.get(withStd);
      if (found) {
        return found;
      }
    }

    // 4. Try stripping outer namespaces if multi-level (e.g. "chrono::duration" -> "std::chrono::duration")
    if (clean.includes('::')) {
      const prefixed = `std::${clean.replace(/^std::/, '')}`;
      const found = this.entries.get(prefixed);
      if (found) {
        return found;
      }
    }

    // 5. Fallback for bare function name (e.g. "make_unique" -> "std::make_unique")
    const bareMatch = `std::${clean.split('::').pop()}`;
    const foundBare = this.entries.get(bareMatch);
    if (foundBare) {
      return foundBare;
    }

    return null;
  }

  /**
   * Retrieves all entries registered as a dictionary map.
   */
  public getAllEntries(): Record<string, StlDocEntry> {
    const result: Record<string, StlDocEntry> = {};
    for (const [key, val] of this.entries.entries()) {
      result[key] = val;
    }
    return result;
  }

  /**
   * Returns all documentation entries associated with a specific header (e.g. "<cmath>" or "cmath").
   */
  public getByHeader(headerName: string): StlDocEntry[] {
    let norm = headerName.trim().toLowerCase();
    if (!norm.startsWith('<')) norm = `<${norm}>`;

    const candidateHeaders = [norm];
    const cMatch = norm.match(/^<c([a-z0-9_]+)>$/);
    if (cMatch) {
      candidateHeaders.push(`<${cMatch[1]}.h>`);
    } else {
      const hMatch = norm.match(/^<([a-z0-9_]+)\.h>$/);
      if (hMatch) {
        candidateHeaders.push(`<c${hMatch[1]}>`);
      }
    }

    const seenSymbols = new Set<string>();
    const list: StlDocEntry[] = [];

    for (const h of candidateHeaders) {
      const symbols = this.headerIndex.get(h);
      if (symbols) {
        for (const sym of symbols) {
          if (!seenSymbols.has(sym)) {
            seenSymbols.add(sym);
            const entry = this.entries.get(sym);
            if (entry) list.push(entry);
          }
        }
      }
    }

    return list;
  }

  /**
   * Returns total number of registered unique symbols.
   */
  public size(): number {
    return this.entries.size;
  }
}
