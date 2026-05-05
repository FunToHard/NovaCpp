/**
 * Allowlist of standard library namespaces, classes, and free functions.
 * Strictly guarantees that non-STL user code or third-party libraries are never recorded.
 */

export const STL_NAMESPACE_PREFIXES = [
  'std::ranges::views::',
  'std::ranges::',
  'std::views::',
  'std::chrono::',
  'std::filesystem::',
  'std::this_thread::',
  'std::pmr::',
  'std::numbers::',
  'std::'
] as const;

export const KNOWN_STL_CONTAINERS = new Set([
  'vector',
  'string',
  'string_view',
  'span',
  'array',
  'deque',
  'list',
  'forward_list',
  'set',
  'map',
  'multiset',
  'multimap',
  'unordered_set',
  'unordered_map',
  'unordered_multiset',
  'unordered_multimap',
  'stack',
  'queue',
  'priority_queue',
  'unique_ptr',
  'shared_ptr',
  'weak_ptr',
  'optional',
  'variant',
  'any',
  'tuple',
  'pair',
  'complex'
]);

export const KNOWN_STL_GLOBAL_FUNCTIONS = new Set([
  'make_unique',
  'make_shared',
  'move',
  'forward',
  'format',
  'print',
  'println',
  'sort',
  'stable_sort',
  'find',
  'find_if',
  'find_if_not',
  'count',
  'count_if',
  'transform',
  'copy',
  'copy_if',
  'fill',
  'iota',
  'accumulate',
  'reduce',
  'min',
  'max',
  'clamp',
  'swap',
  'size',
  'empty',
  'data',
  'distance',
  'advance',
  'next',
  'prev',
  'to_string',
  'stoi',
  'stod',
  'stof'
]);

/**
 * Validates whether a fully qualified symbol belongs exclusively to the C++ Standard Library.
 */
export function isAllowedStlSymbol(symbol: string): boolean {
  if (!symbol) return false;
  const trimmed = symbol.trim();

  // Must match at least one approved std:: prefix
  return STL_NAMESPACE_PREFIXES.some((prefix) => trimmed.startsWith(prefix));
}

/**
 * Extracts a normalized, canonical STL symbol key (e.g., "std::vector::push_back" or "std::ranges::sort")
 * from a completion item or AST reference.
 * Returns null if the symbol is not an approved STL member or free function.
 */
export function extractStlSymbolKey(item: {
  label: string | { label: string };
  detail?: string;
  documentation?: any;
}): string | null {
  const labelStr = typeof item.label === 'string' ? item.label : item.label.label;
  if (!labelStr) return null;

  const trimmedLabel = labelStr.trim();

  // 1. Direct fully qualified std:: symbols (e.g. "std::format", "std::ranges::sort")
  if (isAllowedStlSymbol(trimmedLabel)) {
    return cleanSymbolSignature(trimmedLabel);
  }

  // 2. Qualified prefix without std:: explicitly in label (check detail)
  const detailStr = item.detail ? item.detail.trim() : '';
  if (detailStr) {
    // Check if detail specifies an STL class/namespace (e.g., "std::vector<int>", "std::__cxx11::basic_string")
    for (const container of KNOWN_STL_CONTAINERS) {
      const containerPattern = new RegExp(`\\bstd::(?:__\\w+::)?${container}\\b`);
      if (containerPattern.test(detailStr)) {
        return `std::${container}::${cleanSymbolSignature(trimmedLabel)}`;
      }
    }

    // Check if detail specifies std namespace for free functions
    if (detailStr.includes('std::') && KNOWN_STL_GLOBAL_FUNCTIONS.has(trimmedLabel)) {
      return `std::${cleanSymbolSignature(trimmedLabel)}`;
    }
  }

  return null;
}

/**
 * Strips parentheses, template arguments, and whitespace from symbol name.
 */
function cleanSymbolSignature(symbol: string): string {
  // Remove function call parentheses: push_back(...) -> push_back
  let cleaned = symbol.replace(/\(.*\)/g, '');
  // Remove trailing whitespace
  cleaned = cleaned.trim();
  return cleaned;
}
