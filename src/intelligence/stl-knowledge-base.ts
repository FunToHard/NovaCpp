/**
 * Curated knowledge base for ISO C++ Standard Library functions, types, and algorithms.
 * Emulates Rust Analyzer's depth by providing human-readable summaries, parameter descriptions,
 * standard version badges, canonical signatures, time/space complexity, iterator invalidation rules,
 * exception safety guarantees, and runnable modern C++ examples.
 */
import { StlRemoteProvider } from './stl-remote-provider';

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

export const STL_KNOWLEDGE_BASE: Record<string, StlDocEntry> = {
  // =========================================================================
  // --- Smart Pointers & Memory Management (<memory>) ---
  // =========================================================================
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
    docUrl: 'https://en.cppreference.com/w/cpp/memory/unique_ptr/make_unique',
    complexity: { time: 'O(1)', space: 'O(1)' },
    exceptionSafety: 'Strong guarantee: if an exception is thrown during object construction, no memory is leaked.',
    example:
      'auto ptr = std::make_unique<Widget>("nova", 42);\nptr->do_work();\n// Resource automatically freed when ptr exits scope',
    seeAlso: ['std::unique_ptr', 'std::make_shared']
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
    docUrl: 'https://en.cppreference.com/w/cpp/memory/shared_ptr/make_shared',
    complexity: { time: 'O(1)', space: 'O(1)' },
    exceptionSafety: 'Strong guarantee: if an exception is thrown by constructor, all allocated memory is released.',
    example:
      'auto shared = std::make_shared<Texture>("diffuse.png");\nassert(shared.use_count() == 1);\nauto copy = shared; // refcount increments to 2',
    seeAlso: ['std::shared_ptr', 'std::make_unique', 'std::weak_ptr']
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
    docUrl: 'https://en.cppreference.com/w/cpp/memory/unique_ptr',
    complexity: { time: 'O(1) construction, dereference, destruction', space: 'Zero memory overhead (same size as raw pointer if Deleter is empty)' },
    exceptionSafety: 'No-throw guarantee for move operations and destruction.',
    example:
      'std::unique_ptr<int> p1 = std::make_unique<int>(10);\n// std::unique_ptr<int> p2 = p1; // Compile error: non-copyable\nstd::unique_ptr<int> p2 = std::move(p1); // Ownership moved, p1 is now nullptr',
    seeAlso: ['std::make_unique', 'std::shared_ptr']
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
    docUrl: 'https://en.cppreference.com/w/cpp/memory/shared_ptr',
    complexity: { time: 'O(1) construction and dereference; atomic increment/decrement for reference counts', space: '2 pointers (managed object ptr + control block ptr)' },
    exceptionSafety: 'Strong guarantee for copy and assignment.',
    example:
      'std::shared_ptr<Node> n1 = std::make_shared<Node>();\nstd::shared_ptr<Node> n2 = n1;\nstd::cout << n1.use_count(); // Prints 2',
    seeAlso: ['std::make_shared', 'std::weak_ptr', 'std::unique_ptr']
  },
  'std::weak_ptr': {
    symbol: 'std::weak_ptr',
    canonicalSignature: 'template <typename T>\nclass weak_ptr;',
    summary:
      'Non-owning observer smart pointer that holds a weak reference to an object managed by `std::shared_ptr`. Used to break circular reference cycles and detect object lifetime expiry.',
    header: '<memory>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/weak_ptr',
    complexity: { time: 'O(1) lock and expired check', space: '2 pointers' },
    exceptionSafety: 'No-throw guarantee for copy and move constructors.',
    example:
      'std::weak_ptr<Widget> weak = shared;\nif (auto locked = weak.lock()) {\n    locked->render();\n} else {\n    // Object already destroyed\n}',
    seeAlso: ['std::shared_ptr']
  },

  // =========================================================================
  // --- Sequential Containers: std::vector (<vector>) ---
  // =========================================================================
  'std::vector': {
    symbol: 'std::vector',
    canonicalSignature: 'template <typename T, typename Allocator = std::allocator<T>>\nclass vector;',
    summary:
      'Sequence container that encapsulates dynamic size arrays with contiguous memory storage. Elements are stored contiguously, allowing $O(1)$ random access, cache locality, and pointer arithmetic compatibility.',
    header: '<vector>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector',
    complexity: { time: 'O(1) random access, amortized O(1) push_back/pop_back, O(N) arbitrary insert/erase', space: '3 pointers (begin, end, end_of_storage)' },
    invalidation: 'Reallocations invalidate all iterators and references. Insertions and erasures invalidate iterators at or after the modification point.',
    example:
      'std::vector<int> numbers = {1, 2, 3, 4};\nnumbers.push_back(5);\nfor (int n : numbers) {\n    std::println("Value: {}", n);\n}',
    seeAlso: ['std::vector::push_back', 'std::vector::emplace_back', 'std::vector::reserve', 'std::span']
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
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/push_back',
    complexity: { time: 'Amortized O(1); O(N) when vector reallocates capacity' },
    exceptionSafety: 'Strong guarantee: if an exception is thrown during push_back, the vector is unmodified.',
    invalidation: 'If new size() > capacity(), all iterators and references are invalidated. Otherwise, only end() is invalidated.',
    example:
      'std::vector<std::string> words;\nwords.push_back("hello");\nwords.push_back(std::string("world")); // invokes move overload',
    seeAlso: ['std::vector::emplace_back', 'std::vector::pop_back', 'std::vector::reserve']
  },
  'std::vector::emplace_back': {
    symbol: 'std::vector::emplace_back',
    canonicalSignature: 'template <typename... Args>\nreference emplace_back(Args&&... args);',
    summary:
      'Appends a new element to the end of the container by constructing it in-place at the storage location. Avoids redundant copy and move operations.',
    header: '<vector>',
    standard: 'C++11 / C++17',
    parameters: {
      args: 'Arguments directly forwarded to the constructor of the element.'
    },
    returns: 'A reference to the inserted element (since C++17; void in C++11).',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/emplace_back',
    complexity: { time: 'Amortized O(1); O(N) when vector reallocates capacity' },
    exceptionSafety: 'Strong guarantee: container remains intact if constructor throws.',
    invalidation: 'If new size() > capacity(), all iterators and references are invalidated. Otherwise, only end() is invalidated.',
    example:
      'struct Point { int x; int y; Point(int a, int b) : x(a), y(b) {} };\nstd::vector<Point> pts;\npts.emplace_back(10, 20); // Constructs Point in-place directly in buffer',
    seeAlso: ['std::vector::push_back', 'std::vector::reserve']
  },
  'std::vector::pop_back': {
    symbol: 'std::vector::pop_back',
    canonicalSignature: 'void pop_back() noexcept;',
    summary: 'Removes the last element of the container. Calling pop_back on an empty container is undefined behavior.',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {},
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/pop_back',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee (noexcept).',
    invalidation: 'Invalidates end() and the iterator pointing to the erased element.',
    example:
      'std::vector<int> v = {10, 20};\nv.pop_back();\nassert(v.size() == 1);',
    seeAlso: ['std::vector::push_back', 'std::vector::clear']
  },
  'std::vector::size': {
    symbol: 'std::vector::size',
    canonicalSignature: '[[nodiscard]] size_type size() const noexcept;',
    summary: 'Returns the number of active elements in the container.',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {},
    returns: 'The number of elements currently stored in the vector.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/size',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::vector<int> v = {1, 2, 3};\nstd::cout << v.size(); // 3',
    seeAlso: ['std::vector::capacity', 'std::vector::empty']
  },
  'std::vector::capacity': {
    symbol: 'std::vector::capacity',
    canonicalSignature: '[[nodiscard]] size_type capacity() const noexcept;',
    summary: 'Returns the number of elements that the container has currently allocated space for.',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {},
    returns: 'Capacity of the currently allocated internal buffer.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/capacity',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::vector<int> v;\nv.reserve(100);\nassert(v.capacity() >= 100);',
    seeAlso: ['std::vector::reserve', 'std::vector::shrink_to_fit']
  },
  'std::vector::empty': {
    symbol: 'std::vector::empty',
    canonicalSignature: '[[nodiscard]] bool empty() const noexcept;',
    summary: 'Checks if the container has no elements (i.e. whether `begin() == end()`).',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {},
    returns: '`true` if container is empty, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/empty',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::vector<int> v;\nif (v.empty()) {\n    std::println("Vector is empty");\n}',
    seeAlso: ['std::vector::size', 'std::vector::clear']
  },
  'std::vector::clear': {
    symbol: 'std::vector::clear',
    canonicalSignature: 'void clear() noexcept;',
    summary: 'Erases all elements from the container. Leaves `capacity()` unchanged to reuse allocated memory.',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {},
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/clear',
    complexity: { time: 'Linear in size of the container O(N) due to destructor calls' },
    exceptionSafety: 'No-throw guarantee.',
    invalidation: 'Invalidates all iterators, pointers and references related to the container.',
    example:
      'std::vector<int> v = {1, 2, 3};\nv.clear();\nassert(v.empty() && v.capacity() > 0);',
    seeAlso: ['std::vector::shrink_to_fit', 'std::vector::empty']
  },
  'std::vector::reserve': {
    symbol: 'std::vector::reserve',
    canonicalSignature: 'void reserve(size_type new_cap);',
    summary:
      'Increases the capacity of the vector to a value greater than or equal to `new_cap`. Prevents repeated reallocations when the final item count is known in advance.',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {
      new_cap: 'New capacity of the vector in number of elements.'
    },
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/reserve',
    complexity: { time: 'At most O(N) where N is size(), if reallocation takes place' },
    exceptionSafety: 'Strong guarantee: if an exception is thrown, state of container is unchanged.',
    invalidation: 'If new_cap > capacity(), all iterators and references are invalidated.',
    example:
      'std::vector<int> v;\nv.reserve(10000); // Pre-allocate storage for 10000 items to avoid 14 reallocations\nfor (int i = 0; i < 10000; ++i) v.push_back(i);',
    seeAlso: ['std::vector::capacity', 'std::vector::shrink_to_fit']
  },
  'std::vector::shrink_to_fit': {
    symbol: 'std::vector::shrink_to_fit',
    canonicalSignature: 'void shrink_to_fit();',
    summary: 'Requests the removal of unused capacity to reduce memory usage. It is a non-binding request to reduce capacity() to size().',
    header: '<vector>',
    standard: 'C++11 / C++20',
    parameters: {},
    returns: '`void`',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/shrink_to_fit',
    complexity: { time: 'At most linear in the size of the container O(N)' },
    exceptionSafety: 'Strong guarantee if T is CopyInsertable or nothrow MoveInsertable.',
    invalidation: 'Invalidates all iterators and references if reallocation takes place.',
    example:
      'std::vector<int> v(1000);\nv.erase(v.begin() + 10, v.end()); // size is 10, capacity is 1000\nv.shrink_to_fit(); // capacity reduced to ~10',
    seeAlso: ['std::vector::reserve', 'std::vector::capacity']
  },
  'std::vector::at': {
    symbol: 'std::vector::at',
    canonicalSignature: 'reference at(size_type pos);\nconst_reference at(size_type pos) const;',
    summary: 'Returns a reference to the element at specified location `pos`, with bounds checking. Throws `std::out_of_range` if `pos >= size()`.',
    header: '<vector>',
    standard: 'C++98 / C++20',
    parameters: {
      pos: 'Zero-based index of the element to return.'
    },
    returns: 'Reference to the requested element.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/at',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'Strong guarantee: throws std::out_of_range if pos is out of bounds.',
    example:
      'std::vector<int> v = {10, 20};\ntry {\n    int val = v.at(5);\n} catch (const std::out_of_range& e) {\n    std::println("Error: {}", e.what());\n}',
    seeAlso: ['std::vector::operator[]', 'std::vector::data']
  },
  'std::vector::data': {
    symbol: 'std::vector::data',
    canonicalSignature: 'T* data() noexcept;\nconst T* data() const noexcept;',
    summary: 'Returns pointer to the underlying array serving as element storage. Pointer is valid until the container is modified or reallocated.',
    header: '<vector>',
    standard: 'C++11 / C++20',
    parameters: {},
    returns: 'Direct raw pointer to the contiguous element buffer.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector/data',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::vector<float> verts = {0.0f, 1.0f, 2.0f};\nglBufferData(GL_ARRAY_BUFFER, verts.size() * sizeof(float), verts.data(), GL_STATIC_DRAW);',
    seeAlso: ['std::span', 'std::vector::size']
  },

  // =========================================================================
  // --- Strings & Views (<string>, <string_view>, <span>) ---
  // =========================================================================
  'std::string': {
    symbol: 'std::string',
    canonicalSignature: 'using string = std::basic_string<char>;',
    summary:
      'Instantiates `std::basic_string` for `char`. Manages dynamically-sized sequences of characters with Small String Optimization (SSO) for short strings without heap allocation.',
    header: '<string>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string',
    complexity: { time: 'O(1) random access, amortized O(1) push_back/append, O(N) search and substring' },
    example:
      'std::string msg = "Hello";\nmsg += " World!";\nstd::println("{}", msg);',
    seeAlso: ['std::string_view', 'std::format']
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
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string/substr',
    complexity: { time: 'Linear in count O(K)' },
    exceptionSafety: 'Strong guarantee: throws std::out_of_range if pos > size().',
    example:
      'std::string s = "NovaCpp Engine";\nstd::string sub = s.substr(0, 7); // "NovaCpp"',
    seeAlso: ['std::string_view::substr']
  },
  'std::string::c_str': {
    symbol: 'std::string::c_str',
    canonicalSignature: '[[nodiscard]] const char* c_str() const noexcept;',
    summary: 'Returns a pointer to a null-terminated character array with data equivalent to those stored in the string.',
    header: '<string>',
    standard: 'C++98 / C++20',
    parameters: {},
    returns: 'Pointer to the underlying null-terminated `const char` buffer.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string/c_str',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    invalidation: 'Invalidated on any mutable operation on the source string.',
    example:
      'std::string filename = "config.ini";\nFILE* f = fopen(filename.c_str(), "rb");',
    seeAlso: ['std::string::data', 'std::string_view']
  },
  'std::string::find': {
    symbol: 'std::string::find',
    canonicalSignature: 'size_type find(string_view sv, size_type pos = 0) const noexcept;',
    summary: 'Finds the first substring equal to the given character sequence starting at index `pos`. Returns `std::string::npos` if not found.',
    header: '<string>',
    standard: 'C++98 / C++20',
    parameters: {
      sv: 'String view or character sequence to search for.',
      pos: 'Index at which to start searching.'
    },
    returns: 'Position of the first character of found substring, or `std::string::npos`.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string/find',
    complexity: { time: 'O(N * M) worst-case; typically fast search' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::string text = "compiler discovery";\nif (auto pos = text.find("disco"); pos != std::string::npos) {\n    std::println("Found at index {}", pos);\n}',
    seeAlso: ['std::string::starts_with', 'std::string::ends_with']
  },
  'std::string::starts_with': {
    symbol: 'std::string::starts_with',
    canonicalSignature: 'constexpr bool starts_with(string_view sv) const noexcept;\nconstexpr bool starts_with(char c) const noexcept;',
    summary: 'Checks if the string starts with the specified prefix `sv` or character `c`.',
    header: '<string>',
    standard: 'C++20',
    parameters: {
      sv: 'Prefix string view or char to check against.'
    },
    returns: '`true` if the string starts with the prefix, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string/starts_with',
    complexity: { time: 'Linear in length of prefix O(M)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::string path = "/usr/local/bin";\nif (path.starts_with("/usr")) {\n    std::println("System path");\n}',
    seeAlso: ['std::string::ends_with', 'std::string_view::starts_with']
  },
  'std::string::ends_with': {
    symbol: 'std::string::ends_with',
    canonicalSignature: 'constexpr bool ends_with(string_view sv) const noexcept;\nconstexpr bool ends_with(char c) const noexcept;',
    summary: 'Checks if the string ends with the specified suffix `sv` or character `c`.',
    header: '<string>',
    standard: 'C++20',
    parameters: {
      sv: 'Suffix string view or char to check against.'
    },
    returns: '`true` if the string ends with the suffix, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string/ends_with',
    complexity: { time: 'Linear in length of suffix O(M)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::string file = "main.cpp";\nif (file.ends_with(".cpp")) {\n    std::println("C++ source file");\n}',
    seeAlso: ['std::string::starts_with', 'std::string_view::ends_with']
  },
  'std::string_view': {
    symbol: 'std::string_view',
    canonicalSignature: 'template <typename CharT, typename Traits = std::char_traits<CharT>>\nclass basic_string_view;',
    summary:
      'Non-owning, zero-copy constant reference to a character buffer. Consists of only a pointer and a length ($O(1)$ copy and slicing). Ideal replacement for `const std::string&` parameters.',
    header: '<string_view>',
    standard: 'C++17',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string_view',
    complexity: { time: 'O(1) construction, copy, prefix/suffix removal', space: '2 machine words (pointer + length)' },
    invalidation: 'Lifetime is tied to the underlying character storage. Do not access after source string is destroyed.',
    example:
      'void parse(std::string_view sv) {\n    if (sv.starts_with("DEBUG:")) {\n        std::println("Debug log: {}", sv.substr(6));\n    }\n}',
    seeAlso: ['std::string', 'std::span']
  },
  'std::span': {
    symbol: 'std::span',
    canonicalSignature: 'template <typename T, std::size_t Extent = std::dynamic_extent>\nclass span;',
    summary:
      'Non-owning view over a contiguous sequence of objects. Replaces raw pointer + length function parameters with bounds-safe access without heap allocation.',
    header: '<span>',
    standard: 'C++20',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/span',
    complexity: { time: 'O(1) construction, subspan, index access', space: '1 pointer if static extent; 2 words (pointer + size) for dynamic extent' },
    invalidation: 'Lifetime tied to the underlying contiguous container or array.',
    example:
      'void process_ints(std::span<const int> s) {\n    for (int x : s) std::println("{}", x);\n}\nint arr[] = {1, 2, 3};\nprocess_ints(arr);\nstd::vector<int> vec = {4, 5, 6};\nprocess_ints(vec);',
    seeAlso: ['std::string_view', 'std::vector']
  },
  'std::array': {
    symbol: 'std::array',
    canonicalSignature: 'template <typename T, std::size_t N>\nstruct array;',
    summary:
      'Fixed-size sequence container that wraps a native C-style array with standard container semantics (iterators, size(), at()). Zero overhead and stack-allocated.',
    header: '<array>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/array',
    complexity: { time: 'O(1) random access, size() is a compile-time constant', space: 'Exactly N * sizeof(T), zero allocator overhead' },
    example:
      'std::array<int, 4> rgba = {255, 128, 64, 255};\nfor (int channel : rgba) {\n    // process channel\n}',
    seeAlso: ['std::vector', 'std::span']
  },
  'std::deque': {
    symbol: 'std::deque',
    canonicalSignature: 'template <typename T, typename Allocator = std::allocator<T>>\nclass deque;',
    summary:
      'Double-ended queue that supports fast O(1) random access as well as O(1) insertion and deletion at both its beginning and its end. Implemented as segmented arrays.',
    header: '<deque>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/deque',
    complexity: { time: 'O(1) push_front, pop_front, push_back, pop_back, random access' },
    invalidation: 'Insertions at ends invalidate iterators but NOT references to existing elements.',
    example:
      'std::deque<int> dq;\ndq.push_back(10);\ndq.push_front(5);\nassert(dq.front() == 5 && dq.back() == 10);',
    seeAlso: ['std::vector', 'std::list', 'std::queue']
  },
  'std::list': {
    symbol: 'std::list',
    canonicalSignature: 'template <typename T, typename Allocator = std::allocator<T>>\nclass list;',
    summary:
      'Doubly-linked list that supports constant time O(1) insertion and removal of elements from anywhere in the container. Does not support random access.',
    header: '<list>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/list',
    complexity: { time: 'O(1) insertion and erasure given an iterator; O(N) search' },
    invalidation: 'Insertions and erasures do NOT invalidate iterators or references to other elements.',
    example:
      'std::list<int> l = {1, 2, 3};\nauto it = std::next(l.begin());\nl.insert(it, 42); // inserts before 2 without invalidating it',
    seeAlso: ['std::deque', 'std::vector']
  },

  // =========================================================================
  // --- Associative & Unordered Containers (<map>, <set>, <unordered_map>) ---
  // =========================================================================
  'std::map': {
    symbol: 'std::map',
    canonicalSignature: 'template <typename Key, typename T, typename Compare = std::less<Key>, typename Allocator = std::allocator<std::pair<const Key, T>>>\nclass map;',
    summary:
      'Sorted associative container that contains key-value pairs with unique keys. Search, removal, and insertion operations have logarithmic complexity. Implemented as a Red-Black Tree.',
    header: '<map>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/map',
    complexity: { time: 'O(log N) search, insertion, removal' },
    invalidation: 'Insertions do NOT invalidate any iterators. Erasures only invalidate iterators pointing to the erased element.',
    example:
      'std::map<std::string, int> scores;\nscores["Alice"] = 95;\nscores["Bob"] = 88;\nfor (const auto& [name, score] : scores) {\n    std::println("{}: {}", name, score);\n}',
    seeAlso: ['std::unordered_map', 'std::set']
  },
  'std::map::insert': {
    symbol: 'std::map::insert',
    canonicalSignature: 'std::pair<iterator, bool> insert(const value_type& value);\nstd::pair<iterator, bool> insert(value_type&& value);',
    summary: 'Inserts element into the container, if the container doesn\'t already contain an element with an equivalent key.',
    header: '<map>',
    standard: 'C++98 / C++11',
    parameters: {
      value: 'Key-value pair to insert.'
    },
    returns: 'Pair consisting of an iterator to the inserted element (or the element that prevented the insertion) and a bool denoting whether the insertion took place.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/map/insert',
    complexity: { time: 'Logarithmic in container size O(log N)' },
    exceptionSafety: 'Strong guarantee: if an exception is thrown, state is unmodified.',
    example:
      'std::map<int, std::string> m;\nauto [it, inserted] = m.insert({1, "one"});\nassert(inserted == true);',
    seeAlso: ['std::map::try_emplace', 'std::map::find']
  },
  'std::map::find': {
    symbol: 'std::map::find',
    canonicalSignature: 'iterator find(const Key& key);\nconst_iterator find(const Key& key) const;',
    summary: 'Finds an element with key equivalent to `key`. Returns `end()` iterator if key is not found.',
    header: '<map>',
    standard: 'C++98 / C++20',
    parameters: {
      key: 'Key value of the element to search for.'
    },
    returns: 'Iterator to an element with key equivalent to `key`. If no such element is found, past-the-end `end()` iterator is returned.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/map/find',
    complexity: { time: 'Logarithmic in container size O(log N)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::map<int, std::string> m = {{1, "one"}};\nif (auto it = m.find(1); it != m.end()) {\n    std::println("Found: {}", it->second);\n}',
    seeAlso: ['std::map::contains', 'std::map::count']
  },
  'std::map::contains': {
    symbol: 'std::map::contains',
    canonicalSignature: 'bool contains(const Key& key) const;',
    summary: 'Checks if there is an element with key equivalent to `key` in the container. Superior to `m.find(key) != m.end()`.',
    header: '<map>',
    standard: 'C++20',
    parameters: {
      key: 'Key value of the element to search for.'
    },
    returns: '`true` if an element with key equivalent to `key` is found, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/map/contains',
    complexity: { time: 'Logarithmic in container size O(log N)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::map<std::string, int> dict = {{"pi", 314}};\nif (dict.contains("pi")) {\n    std::println("Found pi");\n}',
    seeAlso: ['std::map::find', 'std::unordered_map::contains']
  },
  'std::unordered_map': {
    symbol: 'std::unordered_map',
    canonicalSignature: 'template <typename Key, typename T, typename Hash = std::hash<Key>, typename KeyEqual = std::equal_to<Key>, typename Allocator = std::allocator<std::pair<const Key, T>>>\nclass unordered_map;',
    summary:
      'Associative container that contains key-value pairs with unique keys. Search, insertion, and removal have average constant-time complexity. Implemented as a Hash Table.',
    header: '<unordered_map>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/unordered_map',
    complexity: { time: 'Average O(1) search/insert/erase; Worst-case O(N) on hash collisions' },
    invalidation: 'Rehash invalidates iterators, but pointers and references to elements remain valid.',
    example:
      'std::unordered_map<std::string, int> lookup = {{"alpha", 1}, {"beta", 2}};\nlookup["gamma"] = 3;\nif (lookup.contains("alpha")) {\n    std::println("Alpha = {}", lookup["alpha"]);\n}',
    seeAlso: ['std::map', 'std::unordered_set']
  },
  'std::unordered_map::find': {
    symbol: 'std::unordered_map::find',
    canonicalSignature: 'iterator find(const Key& key);\nconst_iterator find(const Key& key) const;',
    summary: 'Finds an element with key equivalent to `key`. Returns `end()` if not found.',
    header: '<unordered_map>',
    standard: 'C++11 / C++20',
    parameters: {
      key: 'Key value to search for.'
    },
    returns: 'Iterator to the found element, or `end()`.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/unordered_map/find',
    complexity: { time: 'Average case O(1); Worst-case O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::unordered_map<int, int> table = {{1, 100}};\nauto it = table.find(1);\nif (it != table.end()) std::println("{}", it->second);',
    seeAlso: ['std::unordered_map::contains']
  },
  'std::unordered_map::contains': {
    symbol: 'std::unordered_map::contains',
    canonicalSignature: 'bool contains(const Key& key) const;',
    summary: 'Checks if an element with key equivalent to `key` exists in the hash table.',
    header: '<unordered_map>',
    standard: 'C++20',
    parameters: {
      key: 'Key value to look for.'
    },
    returns: '`true` if an element with equivalent key is found, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/container/unordered_map/contains',
    complexity: { time: 'Average case O(1); Worst-case O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::unordered_map<int, int> cache;\nif (!cache.contains(req_id)) {\n    cache[req_id] = fetch_data(req_id);\n}',
    seeAlso: ['std::unordered_map::find']
  },
  'std::set': {
    symbol: 'std::set',
    canonicalSignature: 'template <typename Key, typename Compare = std::less<Key>, typename Allocator = std::allocator<Key>>\nclass set;',
    summary:
      'Associative container that contains a sorted set of unique objects of type `Key`. Search, removal, and insertion have logarithmic complexity. Implemented as Red-Black Tree.',
    header: '<set>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/set',
    complexity: { time: 'Logarithmic O(log N) search, insert, and erase' },
    example:
      'std::set<int> unique_ids = {3, 1, 4, 1, 5};\nfor (int id : unique_ids) {\n    std::print("{} ", id); // 1 3 4 5 (sorted and deduplicated)\n}',
    seeAlso: ['std::unordered_set', 'std::map']
  },
  'std::unordered_set': {
    symbol: 'std::unordered_set',
    canonicalSignature: 'template <typename Key, typename Hash = std::hash<Key>, typename KeyEqual = std::equal_to<Key>, typename Allocator = std::allocator<Key>>\nclass unordered_set;',
    summary:
      'Associative container that contains a set of unique objects of type `Key` stored in a hash table. Fast average O(1) membership lookup.',
    header: '<unordered_set>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/unordered_set',
    complexity: { time: 'Average O(1) lookup/insert/erase; worst-case O(N)' },
    example:
      'std::unordered_set<std::string> visited;\nvisited.insert("node_1");\nif (visited.contains("node_1")) {\n    std::println("Already visited");\n}',
    seeAlso: ['std::set', 'std::unordered_map']
  },

  // =========================================================================
  // --- Container Adaptors (<queue>, <stack>) ---
  // =========================================================================
  'std::queue': {
    symbol: 'std::queue',
    canonicalSignature: 'template <typename T, typename Container = std::deque<T>>\nclass queue;',
    summary:
      'Container adaptor that gives the programmer the functionality of a FIFO (First-In, First-Out) queue.',
    header: '<queue>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/queue',
    complexity: { time: 'O(1) push, pop, front, back' },
    example:
      'std::queue<int> q;\nq.push(1);\nq.push(2);\nwhile (!q.empty()) {\n    std::println("{}", q.front());\n    q.pop();\n}',
    seeAlso: ['std::stack', 'std::priority_queue', 'std::deque']
  },
  'std::stack': {
    symbol: 'std::stack',
    canonicalSignature: 'template <typename T, typename Container = std::deque<T>>\nclass stack;',
    summary:
      'Container adaptor that gives the programmer the functionality of a LIFO (Last-In, First-Out) stack.',
    header: '<stack>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/stack',
    complexity: { time: 'O(1) push, pop, top' },
    example:
      'std::stack<int> s;\ns.push(10);\ns.push(20);\nstd::println("Top: {}", s.top()); // 20\ns.pop();',
    seeAlso: ['std::queue', 'std::vector']
  },
  'std::priority_queue': {
    symbol: 'std::priority_queue',
    canonicalSignature: 'template <typename T, typename Container = std::vector<T>, typename Compare = std::less<typename Container::value_type>>\nclass priority_queue;',
    summary:
      'Container adaptor that provides constant time lookup of the largest (by default) element, at the expense of logarithmic insertion and extraction. Implemented as a Max-Heap.',
    header: '<queue>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/container/priority_queue',
    complexity: { time: 'O(1) top(), O(log N) push() and pop()' },
    example:
      'std::priority_queue<int> pq;\npq.push(30);\npq.push(10);\npq.push(50);\nwhile (!pq.empty()) {\n    std::println("{}", pq.top()); // 50, then 30, then 10\n    pq.pop();\n}',
    seeAlso: ['std::queue', 'std::make_heap']
  },

  // =========================================================================
  // --- Core Algorithms & Ranges (<algorithm>, <ranges>, <numeric>) ---
  // =========================================================================
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
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/ranges/sort',
    complexity: { time: 'O(N log N) comparisons, guaranteed worst-case via Introsort' },
    exceptionSafety: 'Basic guarantee.',
    example:
      'struct Player { std::string name; int score; };\nstd::vector<Player> roster = {{"Ada", 90}, {"Bob", 99}};\nstd::ranges::sort(roster, std::greater<>{}, &Player::score); // Sorted by score descending',
    seeAlso: ['std::sort', 'std::ranges::stable_sort']
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
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/sort',
    complexity: { time: 'O(N log N) comparisons' },
    exceptionSafety: 'Basic guarantee.',
    example:
      'std::vector<int> v = {5, 2, 8, 1, 9};\nstd::sort(v.begin(), v.end());\n// v is now {1, 2, 5, 8, 9}',
    seeAlso: ['std::ranges::sort', 'std::stable_sort']
  },
  'std::find': {
    symbol: 'std::find',
    canonicalSignature: 'template <typename InputIt, typename T>\nconstexpr InputIt find(InputIt first, InputIt last, const T& value);',
    summary: 'Returns the first iterator in the range `[first, last)` that compares equal to `value`. Returns `last` if not found.',
    header: '<algorithm>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Iterator to the initial position in the sequence.',
      last: 'Iterator to the final position in the sequence.',
      value: 'Value to search for.'
    },
    returns: 'Iterator to the first element comparing equal to `value`, or `last`.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/find',
    complexity: { time: 'At most O(N) comparisons where N = std::distance(first, last)' },
    exceptionSafety: 'No-throw guarantee if comparison does not throw.',
    example:
      'std::vector<int> v = {10, 20, 30};\nauto it = std::find(v.begin(), v.end(), 20);\nif (it != v.end()) std::println("Found index {}", std::distance(v.begin(), it));',
    seeAlso: ['std::ranges::find', 'std::find_if']
  },
  'std::ranges::find': {
    symbol: 'std::ranges::find',
    canonicalSignature: 'template <std::input_iterator I, std::sentinel_for<I> S, typename T, typename Proj = std::identity>\nconstexpr I find(I first, S last, const T& value, Proj proj = {});',
    summary: 'C++20 constrained range find. Finds the first element in `[first, last)` matching `value` after applying optional projection.',
    header: '<algorithm>',
    standard: 'C++20',
    parameters: {
      first: 'Iterator to the start of the range.',
      last: 'Sentinel or iterator to the end of the range.',
      value: 'Value to compare elements with.',
      proj: 'Projection function applied to elements before comparison.'
    },
    returns: 'Iterator to the first element equal to `value`, or `last`.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/ranges/find',
    complexity: { time: 'At most O(N) comparisons' },
    exceptionSafety: 'Basic guarantee.',
    example:
      'std::vector<std::string> names = {"alice", "bob", "carol"};\nauto it = std::ranges::find(names, "bob");',
    seeAlso: ['std::find', 'std::ranges::find_if']
  },
  'std::find_if': {
    symbol: 'std::find_if',
    canonicalSignature: 'template <typename InputIt, typename UnaryPredicate>\nconstexpr InputIt find_if(InputIt first, InputIt last, UnaryPredicate p);',
    summary: 'Returns the first iterator in the range `[first, last)` for which predicate `p` returns `true`. Returns `last` if not found.',
    header: '<algorithm>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Iterator to the start of the range.',
      last: 'Iterator to the end of the range.',
      p: 'Unary predicate which returns true for the required element.'
    },
    returns: 'Iterator to the first matching element, or `last`.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/find_if',
    complexity: { time: 'At most O(N) predicate evaluations' },
    exceptionSafety: 'Basic guarantee.',
    example:
      'std::vector<int> v = {1, 3, 4, 7};\nauto it = std::find_if(v.begin(), v.end(), [](int n) { return n % 2 == 0; });\nif (it != v.end()) std::println("First even: {}", *it); // 4',
    seeAlso: ['std::ranges::find_if', 'std::find']
  },
  'std::transform': {
    symbol: 'std::transform',
    canonicalSignature: 'template <typename InputIt, typename OutputIt, typename UnaryOperation>\nconstexpr OutputIt transform(InputIt first1, InputIt last1, OutputIt d_first, UnaryOperation unary_op);',
    summary: 'Applies the given function `unary_op` to a range and stores the result in another range beginning at `d_first`.',
    header: '<algorithm>',
    standard: 'C++98 / C++20',
    parameters: {
      first1: 'Iterator to beginning of input range.',
      last1: 'Iterator to end of input range.',
      d_first: 'Beginning of destination range (can be same as input range for in-place transformation).',
      unary_op: 'Operation applied to each element.'
    },
    returns: 'Output iterator to the element in destination range past the last element transformed.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/transform',
    complexity: { time: 'Exactly O(N) applications of unary_op' },
    exceptionSafety: 'Basic guarantee.',
    example:
      'std::vector<int> src = {1, 2, 3};\nstd::vector<int> dst;\ndst.reserve(src.size());\nstd::transform(src.begin(), src.end(), std::back_inserter(dst), [](int x) { return x * x; });',
    seeAlso: ['std::ranges::transform', 'std::for_each']
  },
  'std::ranges::transform': {
    symbol: 'std::ranges::transform',
    canonicalSignature: 'template <std::input_iterator I, std::sentinel_for<I> S, std::weakly_incrementable O, typename F, typename Proj = std::identity>\nconstexpr ranges::transform_result<I, O> transform(I first1, S last1, O result, F op, Proj proj = {});',
    summary: 'C++20 constrained range transform. Applies function `op` to range `[first1, last1)` and writes output into `result`. Supports projections.',
    header: '<algorithm>',
    standard: 'C++20',
    parameters: {
      first1: 'Beginning of input range.',
      last1: 'Sentinel or end of input range.',
      result: 'Output iterator for transformed items.',
      op: 'Transforming function.',
      proj: 'Optional projection function.'
    },
    returns: '`ranges::transform_result` containing an input iterator equal to `last1` and output iterator past the last element written.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/ranges/transform',
    complexity: { time: 'Exactly O(N) operations' },
    exceptionSafety: 'Basic guarantee.',
    example:
      'std::vector<std::string> words = {"hi", "there"};\nstd::vector<int> lengths;\nstd::ranges::transform(words, std::back_inserter(lengths), &std::string::length);',
    seeAlso: ['std::transform']
  },
  'std::accumulate': {
    symbol: 'std::accumulate',
    canonicalSignature: 'template <typename InputIt, typename T, typename BinaryOperation = std::plus<>>\nconstexpr T accumulate(InputIt first, InputIt last, T init, BinaryOperation op = {});',
    summary: 'Computes the sum (or fold reduction using `op`) of the given value `init` and the elements in the range `[first, last)`.',
    header: '<numeric>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Beginning of range to accumulate.',
      last: 'End of range to accumulate.',
      init: 'Initial accumulator value.',
      op: 'Binary operation function taking accumulator and current element.'
    },
    returns: 'The accumulated result value of type `T`.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/accumulate',
    complexity: { time: 'Linear O(N) where N = std::distance(first, last)' },
    exceptionSafety: 'Basic guarantee.',
    example:
      'std::vector<int> nums = {1, 2, 3, 4};\nint sum = std::accumulate(nums.begin(), nums.end(), 0); // 10\nint prod = std::accumulate(nums.begin(), nums.end(), 1, std::multiplies<>{}); // 24',
    seeAlso: ['std::reduce', 'std::transform_reduce']
  },
  'std::binary_search': {
    symbol: 'std::binary_search',
    canonicalSignature: 'template <typename ForwardIt, typename T, typename Compare = std::less<>>\nconstexpr bool binary_search(ForwardIt first, ForwardIt last, const T& value, Compare comp = {});',
    summary: 'Checks if an element equivalent to `value` appears within the sorted range `[first, last)`. Range MUST be partitioned/sorted.',
    header: '<algorithm>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Beginning of sorted range.',
      last: 'End of sorted range.',
      value: 'Value to search for.',
      comp: 'Comparison function.'
    },
    returns: '`true` if an element equal to `value` is found, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/binary_search',
    complexity: { time: 'O(log N) comparisons for random access iterators; O(N) iterator hops for forward iterators' },
    exceptionSafety: 'No-throw guarantee if comparison does not throw.',
    example:
      'std::vector<int> sorted = {1, 3, 5, 7, 9};\nif (std::binary_search(sorted.begin(), sorted.end(), 5)) {\n    std::println("Found 5!");\n}',
    seeAlso: ['std::lower_bound', 'std::upper_bound']
  },
  'std::lower_bound': {
    symbol: 'std::lower_bound',
    canonicalSignature: 'template <typename ForwardIt, typename T, typename Compare = std::less<>>\nconstexpr ForwardIt lower_bound(ForwardIt first, ForwardIt last, const T& value, Compare comp = {});',
    summary: 'Returns an iterator pointing to the first element in the sorted range `[first, last)` that does NOT compare less than `value` (i.e. `>= value`).',
    header: '<algorithm>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Beginning of sorted range.',
      last: 'End of sorted range.',
      value: 'Value to compare elements to.',
      comp: 'Comparison function.'
    },
    returns: 'Iterator to the first element `>= value`, or `last`.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/lower_bound',
    complexity: { time: 'O(log N) comparisons' },
    exceptionSafety: 'No-throw guarantee if comparison does not throw.',
    example:
      'std::vector<int> data = {10, 20, 30, 30, 40};\nauto it = std::lower_bound(data.begin(), data.end(), 30);\n// *it is 30 at index 2',
    seeAlso: ['std::upper_bound', 'std::binary_search', 'std::equal_range']
  },
  'std::clamp': {
    symbol: 'std::clamp',
    canonicalSignature: 'template <typename T, typename Compare = std::less<>>\nconstexpr const T& clamp(const T& v, const T& lo, const T& hi, Compare comp = {});',
    summary: 'Clamps `v` to the range `[lo, hi]`. If `v` is smaller than `lo`, returns `lo`; if `v` is greater than `hi`, returns `hi`; otherwise returns `v`.',
    header: '<algorithm>',
    standard: 'C++17',
    parameters: {
      v: 'Value to clamp.',
      lo: 'Lower boundary.',
      hi: 'Upper boundary.'
    },
    returns: 'Reference to `lo` if `v < lo`, reference to `hi` if `hi < v`, otherwise reference to `v`.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/clamp',
    complexity: { time: 'O(1) at most 2 comparisons' },
    exceptionSafety: 'No-throw guarantee if comparison does not throw.',
    example:
      'int health = 150;\nint clamped = std::clamp(health, 0, 100); // 100',
    seeAlso: ['std::min', 'std::max']
  },

  // =========================================================================
  // --- Formatting & I/O (<format>, <print>, <iostream>) ---
  // =========================================================================
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
    docUrl: 'https://en.cppreference.com/w/cpp/utility/format/format',
    complexity: { time: 'Linear in output string length O(N)' },
    exceptionSafety: 'Throws std::format_error on invalid format specification.',
    example:
      'std::string s = std::format("Thread {} processed {:.2f} MB", 4, 128.456);\n// Result: "Thread 4 processed 128.46 MB"',
    seeAlso: ['std::print', 'std::println']
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
    docUrl: 'https://en.cppreference.com/w/cpp/io/print',
    complexity: { time: 'Linear in output size O(N)' },
    exceptionSafety: 'Throws std::system_error on I/O write failure.',
    example:
      'std::print("Connecting to {}:{}...", host, port);',
    seeAlso: ['std::println', 'std::format']
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
    docUrl: 'https://en.cppreference.com/w/cpp/io/println',
    complexity: { time: 'Linear in output size O(N)' },
    exceptionSafety: 'Throws std::system_error on I/O write failure.',
    example:
      'std::println("Build completed in {} ms with {} errors.", duration, errors);',
    seeAlso: ['std::print', 'std::format']
  },

  // =========================================================================
  // --- Modern Utilities & Algebraic Types (<utility>, <optional>, <variant>, <expected>) ---
  // =========================================================================
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
    docUrl: 'https://en.cppreference.com/w/cpp/utility/move',
    complexity: { time: 'O(0) compile-time cast, zero runtime cost' },
    exceptionSafety: 'No-throw guarantee (noexcept).',
    example:
      'std::vector<int> v1 = {1, 2, 3};\nstd::vector<int> v2 = std::move(v1); // v1 memory stolen by v2 without allocation\nassert(v1.empty());',
    seeAlso: ['std::forward', 'std::as_const']
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
    docUrl: 'https://en.cppreference.com/w/cpp/utility/forward',
    complexity: { time: 'O(0) compile-time cast, zero runtime cost' },
    exceptionSafety: 'No-throw guarantee (noexcept).',
    example:
      'template <typename T>\nvoid wrapper(T&& arg) {\n    target(std::forward<T>(arg)); // Forwards lvalues as lvalues, rvalues as rvalues\n}',
    seeAlso: ['std::move']
  },
  'std::as_const': {
    symbol: 'std::as_const',
    canonicalSignature: 'template <typename T>\nconstexpr std::add_const_t<T>& as_const(T& t) noexcept;',
    summary: 'Forms an lvalue reference to `const` of the given object. Prevents accidental modifications.',
    header: '<utility>',
    standard: 'C++17',
    parameters: {
      t: 'The object to convert to a const lvalue reference.'
    },
    returns: '`const T&`',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/as_const',
    complexity: { time: 'O(0) zero runtime overhead' },
    exceptionSafety: 'No-throw guarantee.',
    example:
      'std::string s = "test";\nconst auto& cs = std::as_const(s);',
    seeAlso: ['std::move']
  },
  'std::optional': {
    symbol: 'std::optional',
    canonicalSignature: 'template <typename T>\nclass optional;',
    summary:
      'Manages an optional contained value (a value that may or may not be present). Contains the value in-place within its own storage without dynamic heap allocation. Similar to Rust\'s `Option<T>`.',
    header: '<optional>',
    standard: 'C++17',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/optional',
    complexity: { time: 'O(1) creation, check has_value(), and dereference', space: 'sizeof(T) + alignof(T) boolean flag' },
    example:
      'std::optional<int> find_id(std::string_view name) {\n    if (name == "root") return 0;\n    return std::nullopt;\n}\n\nauto id = find_id("nova");\nint value = id.value_or(-1);',
    seeAlso: ['std::expected', 'std::variant']
  },
  'std::variant': {
    symbol: 'std::variant',
    canonicalSignature: 'template <typename... Types>\nclass variant;',
    summary:
      'Type-safe discriminated union. An instance of `variant` at any given time either holds a value of one of its alternative types, or it is in an invalid state. Similar to Rust\'s `enum`.',
    header: '<variant>',
    standard: 'C++17',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/variant',
    complexity: { time: 'O(1) value access and index lookup; std::visit is O(1) jump table dispatch', space: 'Max sizeof(Types) + type index discriminator' },
    example:
      'std::variant<int, std::string> v = "hello";\nstd::visit([](const auto& val) {\n    std::println("Variant holds: {}", val);\n}, v);',
    seeAlso: ['std::holds_alternative', 'std::get', 'std::optional']
  },
  'std::expected': {
    symbol: 'std::expected',
    canonicalSignature: 'template <typename T, typename E>\nclass expected;',
    summary:
      'Provides a way to return either an expected value of type `T`, or an unexpected error of type `E`. Idiomatic error handling without exceptions, equivalent to Rust\'s `Result<T, E>`.',
    header: '<expected>',
    standard: 'C++23',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/expected',
    complexity: { time: 'O(1) value or error access', space: 'Max(sizeof(T), sizeof(E)) + bool discriminator' },
    example:
      'std::expected<double, std::string> divide(double a, double b) {\n    if (b == 0.0) return std::unexpected("Division by zero");\n    return a / b;\n}\n\nauto res = divide(10.0, 2.0);\nif (res) std::println("Result: {}", *res);',
    seeAlso: ['std::optional', 'std::unexpected']
  },
  'std::tuple': {
    symbol: 'std::tuple',
    canonicalSignature: 'template <typename... Types>\nclass tuple;',
    summary:
      'Fixed-size collection of heterogeneous values. Supports structured binding unpacking `auto [a, b, c] = t;`.',
    header: '<tuple>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/tuple',
    complexity: { time: 'O(1) std::get<I> compile-time element access' },
    example:
      'std::tuple<int, std::string, double> record{1, "Alice", 3.95};\nauto [id, name, gpa] = record;',
    seeAlso: ['std::pair', 'std::make_tuple']
  },

  // =========================================================================
  // --- Concurrency & Threading (<thread>, <mutex>, <atomic>) ---
  // =========================================================================
  'std::jthread': {
    symbol: 'std::jthread',
    canonicalSignature: 'class jthread;',
    summary:
      'Cooperative cancellation thread. Has the same behavior as `std::thread`, but automatically joins on destruction and supports cooperative stop tokens.',
    header: '<thread>',
    standard: 'C++20',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/jthread',
    complexity: { time: 'Thread spawning is an OS syscall' },
    exceptionSafety: 'Throws std::system_error if the thread could not be started.',
    example:
      'std::jthread worker([](std::stop_token stoken) {\n    while (!stoken.stop_requested()) {\n        // background processing\n    }\n});\n// worker automatically requests stop and joins when going out of scope',
    seeAlso: ['std::thread', 'std::stop_token']
  },
  'std::thread': {
    symbol: 'std::thread',
    canonicalSignature: 'class thread;',
    summary:
      'Represents a single thread of execution. Threads begin execution immediately upon construction. MUST call `join()` or `detach()` before destruction or `std::terminate` is called.',
    header: '<thread>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/thread',
    complexity: { time: 'Thread creation is an OS context allocation' },
    exceptionSafety: 'Destructor terminates the process if thread is joinable.',
    example:
      'std::thread t([]() { std::println("Worker running"); });\nt.join();',
    seeAlso: ['std::jthread', 'std::async']
  },
  'std::mutex': {
    symbol: 'std::mutex',
    canonicalSignature: 'class mutex;',
    summary:
      'Mutual exclusion primitive used to protect shared data from being simultaneously accessed by multiple threads. Non-recursive.',
    header: '<mutex>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/mutex',
    complexity: { time: 'Fast atomic lock/unlock in uncontended case; OS futex/kernel wait on contention' },
    example:
      'std::mutex mtx;\nint counter = 0;\nvoid increment() {\n    std::lock_guard<std::mutex> lock(mtx);\n    ++counter;\n}',
    seeAlso: ['std::lock_guard', 'std::unique_lock', 'std::scoped_lock']
  },
  'std::lock_guard': {
    symbol: 'std::lock_guard',
    canonicalSignature: 'template <typename Mutex>\nclass lock_guard;',
    summary:
      'RAII wrapper for mutexes. Acquires the given mutex on construction and releases it strictly on destruction when scope is exited.',
    header: '<mutex>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/lock_guard',
    complexity: { time: 'O(1) lock on enter, O(1) unlock on exit' },
    exceptionSafety: 'Guarantees mutex unlock even if an exception is thrown in the critical section.',
    example:
      'std::mutex mtx;\n{\n    std::lock_guard lock(mtx); // C++17 Class Template Argument Deduction (CTAD)\n    shared_resource.update();\n} // Automatically unlocked here',
    seeAlso: ['std::scoped_lock', 'std::unique_lock']
  },
  'std::scoped_lock': {
    symbol: 'std::scoped_lock',
    canonicalSignature: 'template <typename... MutexTypes>\nclass scoped_lock;',
    summary:
      'RAII wrapper that acquires multiple mutexes atomically using a deadlock-avoidance algorithm (similar to `std::lock`).',
    header: '<mutex>',
    standard: 'C++17',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/scoped_lock',
    complexity: { time: 'O(1) to O(K) deadlock avoidance' },
    example:
      'std::mutex m1, m2;\nvoid transfer() {\n    std::scoped_lock lock(m1, m2); // Locks both without deadlock\n}',
    seeAlso: ['std::lock_guard', 'std::unique_lock']
  },
  'std::atomic': {
    symbol: 'std::atomic',
    canonicalSignature: 'template <typename T>\nstruct atomic;',
    summary:
      'Provides lock-free, thread-safe atomic operations on types `T`. Guarantees well-defined memory orderings without data races.',
    header: '<atomic>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/atomic/atomic',
    complexity: { time: 'Hardware atomic instruction (LOCK CMPXCHG on x86, LDREX/STREX on ARM); wait-free when is_lock_free() is true' },
    example:
      'std::atomic<int> counter{0};\ncounter.fetch_add(1, std::memory_order_relaxed);',
    seeAlso: ['std::atomic_ref', 'std::mutex']
  },

  // =========================================================================
  // --- Filesystem (<filesystem>) ---
  // =========================================================================
  'std::filesystem::path': {
    symbol: 'std::filesystem::path',
    canonicalSignature: 'class path;',
    summary:
      'Cross-platform filesystem path object. Automatically normalizes directory separators (`/` vs `\\\\`), handles Unicode encodings, and provides path manipulation methods.',
    header: '<filesystem>',
    standard: 'C++17',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/filesystem/path',
    complexity: { time: 'O(N) path decomposition and string conversion' },
    example:
      'std::filesystem::path p = "src/main.cpp";\nstd::println("Extension: {}, Filename: {}", p.extension().string(), p.filename().string());',
    seeAlso: ['std::filesystem::exists', 'std::filesystem::copy']
  },
  'std::filesystem::exists': {
    symbol: 'std::filesystem::exists',
    canonicalSignature: 'bool exists(const std::filesystem::path& p);\nbool exists(const std::filesystem::path& p, std::error_code& ec) noexcept;',
    summary: 'Checks if the given filesystem path `p` refers to an existing file or directory.',
    header: '<filesystem>',
    standard: 'C++17',
    parameters: {
      p: 'Path to check for existence.'
    },
    returns: '`true` if path exists, `false` otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/filesystem/exists',
    complexity: { time: 'OS filesystem stat syscall' },
    example:
      'if (std::filesystem::exists("CMakeLists.txt")) {\n    std::println("Found CMake project!");\n}',
    seeAlso: ['std::filesystem::is_regular_file', 'std::filesystem::is_directory']
  },

  // =========================================================================
  // --- Chrono (<chrono>) ---
  // =========================================================================
  'std::chrono::duration': {
    symbol: 'std::chrono::duration',
    canonicalSignature: 'template <typename Rep, typename Period = std::ratio<1>>\nclass duration;',
    summary:
      'Represents a span of time (e.g. 5 seconds, 100 milliseconds). Type-safe against unit conversion errors.',
    header: '<chrono>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/duration',
    complexity: { time: 'O(0) compile-time dimensional analysis, zero runtime overhead' },
    example:
      'using namespace std::chrono_literals;\nauto timeout = 500ms;\nstd::this_thread::sleep_for(timeout);',
    seeAlso: ['std::chrono::time_point', 'std::chrono::steady_clock']
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

  // 2. Direct match with exact key
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

  // 4. Try stripping outer namespaces if multi-level (e.g. "chrono::duration" -> "std::chrono::duration")
  if (clean.includes('::')) {
    const prefixed = `std::${clean.replace(/^std::/, '')}`;
    if (STL_KNOWLEDGE_BASE[prefixed]) {
      return STL_KNOWLEDGE_BASE[prefixed];
    }
  }

  // 5. Fallback for bare function name (e.g. "make_unique")
  const bareMatch = `std::${clean.split('::').pop()}`;
  if (STL_KNOWLEDGE_BASE[bareMatch]) {
    return STL_KNOWLEDGE_BASE[bareMatch];
  }

  return null;
}

/**
 * Asynchronously searches both the bundled ISO C++ Knowledge Base and the
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
