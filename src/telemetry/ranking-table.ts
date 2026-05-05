import * as vscode from 'vscode';
import { extractStlSymbolKey } from './allowlist';

/**
 * Baseline empirical weights for standard C++ library symbols based on large-scale open-source analysis.
 * Values are normalized in range [0.0, 1.0].
 */
export const DEFAULT_STL_EMPIRICAL_WEIGHTS: Readonly<Record<string, number>> = {
  // std::vector
  'std::vector::push_back': 0.98,
  'std::vector::emplace_back': 0.95,
  'std::vector::size': 0.92,
  'std::vector::empty': 0.90,
  'std::vector::begin': 0.88,
  'std::vector::end': 0.88,
  'std::vector::clear': 0.82,
  'std::vector::front': 0.80,
  'std::vector::back': 0.80,
  'std::vector::reserve': 0.78,
  'std::vector::pop_back': 0.75,
  'std::vector::capacity': 0.70,
  'std::vector::shrink_to_fit': 0.50,
  'std::vector::get_allocator': 0.10,
  'std::vector::max_size': 0.08,

  // std::string & std::string_view
  'std::string::substr': 0.95,
  'std::string::c_str': 0.93,
  'std::string::size': 0.91,
  'std::string::length': 0.90,
  'std::string::empty': 0.90,
  'std::string::find': 0.88,
  'std::string::append': 0.82,
  'std::string::push_back': 0.80,
  'std::string::compare': 0.75,
  'std::string::starts_with': 0.85,
  'std::string::ends_with': 0.85,
  'std::string_view::substr': 0.94,
  'std::string_view::starts_with': 0.92,
  'std::string_view::ends_with': 0.92,
  'std::string_view::data': 0.88,

  // std::unique_ptr & std::shared_ptr
  'std::unique_ptr::get': 0.92,
  'std::unique_ptr::reset': 0.88,
  'std::unique_ptr::release': 0.85,
  'std::shared_ptr::get': 0.92,
  'std::shared_ptr::reset': 0.88,
  'std::shared_ptr::use_count': 0.80,

  // std::map & std::unordered_map
  'std::map::find': 0.93,
  'std::map::contains': 0.92,
  'std::map::insert': 0.88,
  'std::map::emplace': 0.88,
  'std::map::size': 0.87,
  'std::map::empty': 0.85,
  'std::unordered_map::find': 0.94,
  'std::unordered_map::contains': 0.93,
  'std::unordered_map::insert': 0.89,
  'std::unordered_map::emplace': 0.89,

  // Global Free Functions & Utilities
  'std::make_unique': 0.98,
  'std::make_shared': 0.95,
  'std::format': 0.96,
  'std::print': 0.94,
  'std::println': 0.94,
  'std::move': 0.95,
  'std::forward': 0.90,
  'std::ranges::sort': 0.92,
  'std::sort': 0.90,
  'std::min': 0.89,
  'std::max': 0.89,
  'std::clamp': 0.85,
  'std::to_string': 0.88
};

/**
 * Manages empirical weight mappings and ranks Clangd completion items.
 */
export class StlRankingTable {
  private weights = new Map<string, number>();

  constructor(initialWeights: Record<string, number> = DEFAULT_STL_EMPIRICAL_WEIGHTS) {
    this.updateWeights(initialWeights);
  }

  /**
   * Updates in-memory weights with newly fetched telemetry-derived model weights.
   */
  public updateWeights(newWeights: Record<string, number>): void {
    for (const [key, value] of Object.entries(newWeights)) {
      this.weights.set(key, Math.max(0.0, Math.min(1.0, value)));
    }
  }

  /**
   * Retrieves weight for a normalized symbol key.
   */
  public getWeight(symbolKey: string): number | undefined {
    return this.weights.get(symbolKey);
  }

  /**
   * Adjusts Clangd sortText on the completion item if it matches an empirical STL symbol.
   * Boosts high-frequency methods to the top of the autocomplete widget.
   */
  public applyStlRanking(item: vscode.CompletionItem): boolean {
    const symbolKey = extractStlSymbolKey(item);
    if (!symbolKey) {
      return false;
    }

    const weight = this.weights.get(symbolKey);
    // Ignore low-frequency or unweighted symbols
    if (weight === undefined || weight < 0.20) {
      return false;
    }

    // Invert weight so highest weight maps to lowest numerical prefix
    // E.g., weight 0.98 -> rank 002; weight 0.80 -> rank 020
    const rankPriority = Math.round((1.0 - weight) * 100);
    const priorityPrefix = rankPriority.toString().padStart(3, '0');

    const baseSort = item.sortText ?? (typeof item.label === 'string' ? item.label : item.label.label);
    item.sortText = `0_${priorityPrefix}_${baseSort}`;
    return true;
  }
}
