import * as vscode from 'vscode';
import { extractStlSymbolKey, isAllowedStlSymbol } from './allowlist';

/**
 * Manages anonymous in-memory usage counters for Standard Template Library (STL) symbols.
 * Strictly guarantees that no non-STL user code or private identifiers are stored.
 */
export class StlUsageCollector {
  private counts = new Map<string, number>();

  /**
   * Checks whether telemetry is permitted by both VS Code global policy and NovaCpp setting.
   */
  public isTelemetryAllowed(): boolean {
    // 1. VS Code global telemetry check
    if (vscode.env?.isTelemetryEnabled !== undefined && !vscode.env?.isTelemetryEnabled) {
      return false;
    }

    const vscodeConfig = vscode.workspace.getConfiguration('telemetry');
    const telemetryLevel = vscodeConfig.get<string>('telemetryLevel', 'all');
    if (telemetryLevel === 'off' || telemetryLevel === 'crash' || telemetryLevel === 'error') {
      return false;
    }

    // 2. NovaCpp explicit configuration toggle
    const novacppConfig = vscode.workspace.getConfiguration('novacpp');
    const enabled = novacppConfig.get<boolean>('telemetry.enabled', true);
    return enabled;
  }

  /**
   * Records usage when a user accepts an STL completion item in the editor.
   */
  public recordCompletionAccepted(item: vscode.CompletionItem): boolean {
    if (!this.isTelemetryAllowed()) {
      return false;
    }

    const symbolKey = extractStlSymbolKey(item);
    if (!symbolKey) {
      return false;
    }

    const current = this.counts.get(symbolKey) ?? 0;
    this.counts.set(symbolKey, current + 1);
    return true;
  }

  /**
   * Records usage when an AST scan detects an invocation of an approved standard library symbol.
   */
  public recordAstCall(symbolName: string): boolean {
    if (!this.isTelemetryAllowed()) {
      return false;
    }

    if (!isAllowedStlSymbol(symbolName)) {
      return false;
    }

    const current = this.counts.get(symbolName) ?? 0;
    this.counts.set(symbolName, current + 1);
    return true;
  }

  /**
   * Returns a read-only snapshot of all currently accumulated counters.
   */
  public getPendingCounts(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [key, count] of this.counts.entries()) {
      result[key] = count;
    }
    return result;
  }

  /**
   * Drains the in-memory histogram, applies k-anonymity filtering, and returns the batch.
   * Symbols with fewer than kAnonymityThreshold occurrences are discarded.
   */
  public flushCounts(kAnonymityThreshold: number = 3): Record<string, number> {
    const batch: Record<string, number> = {};
    for (const [key, count] of this.counts.entries()) {
      if (count >= kAnonymityThreshold) {
        batch[key] = count;
      }
    }
    this.counts.clear();
    return batch;
  }

  /**
   * Clears all accumulated in-memory counts.
   */
  public clear(): void {
    this.counts.clear();
  }

  /**
   * Returns the count of distinct symbols currently tracked in memory.
   */
  public size(): number {
    return this.counts.size;
  }
}
