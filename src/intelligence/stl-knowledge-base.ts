/**
 * Curated knowledge base for ISO C++ Standard Library functions, types, and algorithms.
 * Emulates Rust Analyzer's depth by providing human-readable summaries, parameter descriptions,
 * standard version badges, and canonical signatures for standard library hovers.
 */

export interface StlDocEntry {
  symbol: string;
  canonicalSignature: string;
  summary: string;
  header: string;
  standard: string;
  parameters: Record<string, string>;
  returns: string;
  docUrl: string;
}

export const STL_KNOWLEDGE_BASE: Record<string, StlDocEntry> = {
  // --- Smart Pointers (<memory>) ---
  'std::make_unique': {
    symbol: 'std::make_unique',
    canonicalSignature: 'template <typename T, typename... Args>\nstd::unique_ptr<T> make_unique(Args&&... args);',
    summary:
      'Constructs an object of type `T` on the heap and wraps it in a `std::unique_ptr` with exclusive ownership. Eliminates naked `new` and guarantees exception safety.',
    header: '<memory>',
    standard: 'C++14',
    parameters: {
      args: 'Arguments forwarded to the constructor of `T` via `std::forward<Args>(args)...`'
    },
    returns: '`std::unique_ptr<T>` with sole heap ownership of the newly constructed resource.',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/unique_ptr/make_unique'
  },
  'std::make_shared': {
    symbol: 'std::make_shared',
    canonicalSignature: 'template <typename T, typename... Args>\nstd::shared_ptr<T> make_shared(Args&&... args);',
    summary:
      'Allocates a single contiguous memory block holding both the control block (reference counters) and the object of type `T`. Faster and more cache-friendly than separate allocations.',
    header: '<memory>',
    standard: 'C++11',
    parameters: {
      args: 'Arguments forwarded to the constructor of `T` via `std::forward<Args>(args)...`'
    },
    returns: '`std::shared_ptr<T>` owning the newly allocated instance with reference counting.',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/shared_ptr/make_shared'
  },
  'std::unique_ptr': {
    symbol: 'std::unique_ptr',
    canonicalSignature: 'template <typename T, typename Deleter = std::default_delete<T>>\nclass unique_ptr;',
    summary:
      'Smart pointer that exclusively owns and manages another object through a pointer and disposes of that object when the `unique_ptr` goes out of scope.',
    header: '<memory>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/unique_ptr'
  },
  'std::shared_ptr': {
    symbol: 'std::shared_ptr',
    canonicalSignature: 'template <typename T>\nclass shared_ptr;',
    summary:
      'Smart pointer that retains shared ownership of an object through a pointer. Several `shared_ptr` objects may own the same object. The object is destroyed when the last remaining owner is destroyed.',
    header: '<memory>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/shared_ptr'
  },

  // --- Containers (<vector>, <string>, etc.) ---
  'std::vector': {
    symbol: 'std::vector',
    canonicalSignature: 'template <typename T, typename Allocator = std::allocator<T>>\nclass vector;',
    summary:
      'Sequence container that encapsulates dynamic size arrays with contiguous memory storage. Elements are stored contiguously, allowing $O(1)$ random access.',
    header: '<vector>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector'
  },
  'std::vector::push_back': {
    symbol: 'std::vector::push_back',
    canonicalSignature: 'void push_back(const T& value);\nvoid push_back(T&& value);',
    summary:
      'Appends the given element `value` to the end of the container. If the new `size()` exceeds `capacity()`, all elements are reallocated to a larger block.',
    header: '<vector>',
    standard: 'C++98 / C++11',
    parameters: {
      value: 'The value of the element to append (copied or moved).'
    },
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/push_back'
  },
  'std::vector::emplace_back': {
    symbol: 'std::vector::emplace_back',
    canonicalSignature: 'template <typename... Args>\nreference emplace_back(Args&&... args);',
    summary:
      'Appends a new element to the end of the container by constructing it in-place at the storage location. Avoids redundant copy and move operations.',
    header: '<vector>',
    standard: 'C++11',
    parameters: {
      args: 'Arguments directly forwarded to the constructor of the element.'
    },
    returns: 'A reference to the inserted element.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/emplace_back'
  },
  'std::vector::size': {
    symbol: 'std::vector::size',
    canonicalSignature: '[[nodiscard]] size_type size() const noexcept;',
    summary: 'Returns the number of active elements in the container.',
    header: '<vector>',
    standard: 'C++98',
    parameters: {},
    returns: 'The number of elements currently stored in the vector.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/size'
  },
  'std::vector::empty': {
    symbol: 'std::vector::empty',
    canonicalSignature: '[[nodiscard]] bool empty() const noexcept;',
    summary: 'Checks if the container has no elements (i.e. whether `begin() == end()`).',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {},
    returns: '`true` if container is empty, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/empty'
  },
  'std::vector::clear': {
    symbol: 'std::vector::clear',
    canonicalSignature: 'void clear() noexcept;',
    summary: 'Erases all elements from the container. Leaves `capacity()` unchanged.',
    header: '<vector>',
    standard: 'C++98',
    parameters: {},
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/clear'
  },
  'std::vector::reserve': {
    symbol: 'std::vector::reserve',
    canonicalSignature: 'void reserve(size_type new_cap);',
    summary:
      'Increases the capacity of the vector to a value greater than or equal to `new_cap`. Prevents repeated reallocations when the final item count is known in advance.',
    header: '<vector>',
    standard: 'C++98',
    parameters: {
      new_cap: 'New capacity of the vector in number of elements.'
    },
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/reserve'
  },

  // --- String & Views (<string>, <string_view>) ---
  'std::string': {
    symbol: 'std::string',
    canonicalSignature: 'using string = std::basic_string<char>;',
    summary:
      'Instantiates `std::basic_string` for `char`. Manages dynamically-sized sequences of characters with Small String Optimization (SSO).',
    header: '<string>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string'
  },
  'std::string::substr': {
    symbol: 'std::string::substr',
    canonicalSignature: '[[nodiscard]] string substr(size_type pos = 0, size_type count = npos) const;',
    summary: 'Returns a substring `[pos, pos + count)`. If requested count exceeds string length, returns characters to the end.',
    header: '<string>',
    standard: 'C++98 / C++20',
    parameters: {
      pos: 'Position of the first character to include.',
      count: 'Length of the substring to extract.'
    },
    returns: 'A newly allocated `std::string` containing the substring.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string/substr'
  },
  'std::string::c_str': {
    symbol: 'std::string::c_str',
    canonicalSignature: '[[nodiscard]] const char* c_str() const noexcept;',
    summary: 'Returns a pointer to a null-terminated character array with data equivalent to those stored in the string.',
    header: '<string>',
    standard: 'C++98',
    parameters: {},
    returns: 'Pointer to the underlying null-terminated `const char` buffer.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string/c_str'
  },
  'std::string_view': {
    symbol: 'std::string_view',
    canonicalSignature: 'template <typename CharT, typename Traits = std::char_traits<CharT>>\nclass basic_string_view;',
    summary:
      'Non-owning, zero-copy constant reference to a character buffer. Consists of only a pointer and a length ($O(1)$ copy and slicing).',
    header: '<string_view>',
    standard: 'C++17',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string_view'
  },
  'std::span': {
    symbol: 'std::span',
    canonicalSignature: 'template <typename T, std::size_t Extent = std::dynamic_extent>\nclass span;',
    summary:
      'Non-owning view over a contiguous sequence of objects. Replaces raw pointer + length function parameters with bounds-safe access.',
    header: '<span>',
    standard: 'C++20',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/span'
  },

  // --- Core Algorithms (<algorithm>, <ranges>) ---
  'std::ranges::sort': {
    symbol: 'std::ranges::sort',
    canonicalSignature: 'template <std::random_access_iterator I, std::sentinel_for<I> S, typename Comp = ranges::less, typename Proj = std::identity>\nconstexpr I sort(I first, S last, Comp comp = {}, Proj proj = {});',
    summary:
      'C++20 constrained range sort. Sorts elements in the range `[first, last)` in non-descending order using introsort ($O(N \\log N)$). Supports projections.',
    header: '<algorithm>',
    standard: 'C++20',
    parameters: {
      first: 'Iterator pointing to the beginning of the sequence to sort.',
      last: 'Sentinel or iterator pointing to the end of the sequence.',
      comp: 'Comparison predicate that returns `true` if first argument is ordered before second.',
      proj: 'Projection function applied to each element before comparison.'
    },
    returns: 'An iterator equal to `last`.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/ranges/sort'
  },
  'std::sort': {
    symbol: 'std::sort',
    canonicalSignature: 'template <typename RandomIt, typename Compare = std::less<>>\nconstexpr void sort(RandomIt first, RandomIt last, Compare comp = {});',
    summary: 'Sorts elements in range `[first, last)` into ascending order using introsort ($O(N \\log N)$ average and worst-case).',
    header: '<algorithm>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Random access iterator to the beginning of the range.',
      last: 'Random access iterator to the end of the range.',
      comp: 'Comparison functor object.'
    },
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/sort'
  },

  // --- Formatting & I/O (<format>, <print>) ---
  'std::format': {
    symbol: 'std::format',
    canonicalSignature: 'template <typename... Args>\n[[nodiscard]] std::string format(std::format_string<Args...> fmt, Args&&... args);',
    summary:
      'Type-safe, fast string formatting with compile-time format string validation. Combines the ergonomics of Python f-strings / `printf` with C++ type safety.',
    header: '<format>',
    standard: 'C++20',
    parameters: {
      fmt: 'Format string containing replacement fields `{}` and optional specifiers (e.g. `"{:.2f}"`).',
      args: 'Values to format into the replacement fields.'
    },
    returns: 'A newly constructed `std::string` containing the formatted text.',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/format/format'
  },
  'std::print': {
    symbol: 'std::print',
    canonicalSignature: 'template <typename... Args>\nvoid print(std::format_string<Args...> fmt, Args&&... args);',
    summary:
      'Prints formatted output directly to `stdout` in a single unbuffered, type-safe, Unicode-aware call. Superior to `std::cout` and `printf`.',
    header: '<print>',
    standard: 'C++23',
    parameters: {
      fmt: 'Format string containing replacement fields.',
      args: 'Values to format into the output.'
    },
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/io/print'
  },
  'std::println': {
    symbol: 'std::println',
    canonicalSignature: 'template <typename... Args>\nvoid println(std::format_string<Args...> fmt, Args&&... args);',
    summary:
      'Prints formatted output directly to `stdout` followed by a newline `\\n` in a single atomic Unicode call.',
    header: '<print>',
    standard: 'C++23',
    parameters: {
      fmt: 'Format string containing replacement fields.',
      args: 'Values to format into the output.'
    },
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/io/println'
  },

  // --- Utility Primitives (<utility>, <optional>) ---
  'std::move': {
    symbol: 'std::move',
    canonicalSignature: 'template <typename T>\nconstexpr std::remove_reference_t<T>&& move(T&& t) noexcept;',
    summary:
      'Unconditionally casts `t` to an rvalue reference `T&&`. Signals that the resource held by `t` may be moved from or pilfered.',
    header: '<utility>',
    standard: 'C++11',
    parameters: {
      t: 'The lvalue object to cast to an rvalue reference.'
    },
    returns: '`static_cast<std::remove_reference_t<T>&&>(t)`',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/move'
  },
  'std::forward': {
    symbol: 'std::forward',
    canonicalSignature: 'template <typename T>\nconstexpr T&& forward(std::remove_reference_t<T>& t) noexcept;',
    summary:
      'Conditionally casts `t` to an rvalue reference only if the original type argument `T` was an rvalue. Enables perfect forwarding in generic code.',
    header: '<utility>',
    standard: 'C++11',
    parameters: {
      t: 'The universal reference argument to forward.'
    },
    returns: '`static_cast<T&&>(t)` preserving the original value category.',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/forward'
  },
  'std::optional': {
    symbol: 'std::optional',
    canonicalSignature: 'template <typename T>\nclass optional;',
    summary:
      'Manages an optional contained value (a value that may or may not be present). Contains the value in-place without dynamic heap allocation.',
    header: '<optional>',
    standard: 'C++17',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/optional'
  }
};

/**
 * Searches the Curated STL Knowledge Base for a given symbol name or method key.
 * Handles unqualified member lookups (e.g. "push_back" on "vector") and bare names.
 */
export function findStlDocumentation(symbolKey: string, scope?: string): StlDocEntry | null {
  if (!symbolKey) return null;
  const clean = symbolKey.trim().replace(/^::/, '');

  // 1. Check with scope if available (e.g. scope = "std::vector<int>", clean = "push_back")
  if (scope) {
    const cleanScope = scope.replace(/<.*>$/, '').replace(/^::/, '').trim();
    const scopeParts = cleanScope.split('::');
    const className = scopeParts[scopeParts.length - 1];
    const candidateWithScope = `std::${className}::${clean}`;
    if (STL_KNOWLEDGE_BASE[candidateWithScope]) {
      return STL_KNOWLEDGE_BASE[candidateWithScope];
    }
  }

  // 2. Direct match with std:: prefix
  if (STL_KNOWLEDGE_BASE[clean]) {
    return STL_KNOWLEDGE_BASE[clean];
  }

  // 3. Try prefixing std:: if not present
  if (!clean.startsWith('std::')) {
    const withStd = `std::${clean}`;
    if (STL_KNOWLEDGE_BASE[withStd]) {
      return STL_KNOWLEDGE_BASE[withStd];
    }
  }

  // 4. Fallback for bare function name (e.g. "make_unique")
  const bareMatch = `std::${clean.split('::').pop()}`;
  if (STL_KNOWLEDGE_BASE[bareMatch]) {
    return STL_KNOWLEDGE_BASE[bareMatch];
  }

  return null;
}

