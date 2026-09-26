import { StlDocEntry, StlHeaderModule } from '../types';

export const CONTAINERS_ENTRIES: Record<string, StlDocEntry> = {
  "std::vector": {
    "symbol": "std::vector",
    "canonicalSignature": "template <typename T, typename Allocator = std::allocator<T>>\nclass vector;",
    "summary": "Sequence container that encapsulates dynamic size arrays with contiguous memory storage. Elements are stored contiguously, allowing $O(1)$ random access, cache locality, and pointer arithmetic compatibility.",
    "header": "<vector>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector",
    "complexity": {
      "time": "O(1) random access, amortized O(1) push_back/pop_back, O(N) arbitrary insert/erase",
      "space": "3 pointers (begin, end, end_of_storage)"
    },
    "invalidation": "Reallocations invalidate all iterators and references. Insertions and erasures invalidate iterators at or after the modification point.",
    "example": "std::vector<int> numbers = {1, 2, 3, 4};\nnumbers.push_back(5);\nfor (int n : numbers) {\n    std::println(\"Value: {}\", n);\n}",
    "seeAlso": [
      "std::vector::push_back",
      "std::vector::emplace_back",
      "std::vector::reserve",
      "std::span"
    ]
  },
  "std::vector::push_back": {
    "symbol": "std::vector::push_back",
    "canonicalSignature": "void push_back(const T& value);\nvoid push_back(T&& value);",
    "summary": "Appends the given element `value` to the end of the container. If the new `size()` exceeds `capacity()`, all elements are reallocated to a larger block.",
    "header": "<vector>",
    "standard": "C++98 / C++11",
    "parameters": {
      "value": "The value of the element to append (copied or moved)."
    },
    "returns": "`void`",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/push_back",
    "complexity": {
      "time": "Amortized O(1); O(N) when vector reallocates capacity"
    },
    "exceptionSafety": "Strong guarantee: if an exception is thrown during push_back, the vector is unmodified.",
    "invalidation": "If new size() > capacity(), all iterators and references are invalidated. Otherwise, only end() is invalidated.",
    "example": "std::vector<std::string> words;\nwords.push_back(\"hello\");\nwords.push_back(std::string(\"world\")); // invokes move overload",
    "seeAlso": [
      "std::vector::emplace_back",
      "std::vector::pop_back",
      "std::vector::reserve"
    ]
  },
  "std::vector::emplace_back": {
    "symbol": "std::vector::emplace_back",
    "canonicalSignature": "template <typename... Args>\nreference emplace_back(Args&&... args);",
    "summary": "Appends a new element to the end of the container by constructing it in-place at the storage location. Avoids redundant copy and move operations.",
    "header": "<vector>",
    "standard": "C++11 / C++17",
    "parameters": {
      "args": "Arguments directly forwarded to the constructor of the element."
    },
    "returns": "A reference to the inserted element (since C++17; void in C++11).",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/emplace_back",
    "complexity": {
      "time": "Amortized O(1); O(N) when vector reallocates capacity"
    },
    "exceptionSafety": "Strong guarantee: container remains intact if constructor throws.",
    "invalidation": "If new size() > capacity(), all iterators and references are invalidated. Otherwise, only end() is invalidated.",
    "example": "struct Point { int x; int y; Point(int a, int b) : x(a), y(b) {} };\nstd::vector<Point> pts;\npts.emplace_back(10, 20); // Constructs Point in-place directly in buffer",
    "seeAlso": [
      "std::vector::push_back",
      "std::vector::reserve"
    ]
  },
  "std::vector::pop_back": {
    "symbol": "std::vector::pop_back",
    "canonicalSignature": "void pop_back() noexcept;",
    "summary": "Removes the last element of the container. Calling pop_back on an empty container is undefined behavior.",
    "header": "<vector>",
    "standard": "C++98 / C++20",
    "parameters": {},
    "returns": "`void`",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/pop_back",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee (noexcept).",
    "invalidation": "Invalidates end() and the iterator pointing to the erased element.",
    "example": "std::vector<int> v = {10, 20};\nv.pop_back();\nassert(v.size() == 1);",
    "seeAlso": [
      "std::vector::push_back",
      "std::vector::clear"
    ]
  },
  "std::vector::size": {
    "symbol": "std::vector::size",
    "canonicalSignature": "[[nodiscard]] size_type size() const noexcept;",
    "summary": "Returns the number of active elements in the container.",
    "header": "<vector>",
    "standard": "C++98 / C++20",
    "parameters": {},
    "returns": "The number of elements currently stored in the vector.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/size",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {1, 2, 3};\nstd::cout << v.size(); // 3",
    "seeAlso": [
      "std::vector::capacity",
      "std::vector::empty"
    ]
  },
  "std::vector::capacity": {
    "symbol": "std::vector::capacity",
    "canonicalSignature": "[[nodiscard]] size_type capacity() const noexcept;",
    "summary": "Returns the number of elements that the container has currently allocated space for.",
    "header": "<vector>",
    "standard": "C++98 / C++20",
    "parameters": {},
    "returns": "Capacity of the currently allocated internal buffer.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/capacity",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v;\nv.reserve(100);\nassert(v.capacity() >= 100);",
    "seeAlso": [
      "std::vector::reserve",
      "std::vector::shrink_to_fit"
    ]
  },
  "std::vector::empty": {
    "symbol": "std::vector::empty",
    "canonicalSignature": "[[nodiscard]] bool empty() const noexcept;",
    "summary": "Checks if the container has no elements (i.e. whether `begin() == end()`).",
    "header": "<vector>",
    "standard": "C++98 / C++20",
    "parameters": {},
    "returns": "`true` if container is empty, `false` otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/empty",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v;\nif (v.empty()) {\n    std::println(\"Vector is empty\");\n}",
    "seeAlso": [
      "std::vector::size",
      "std::vector::clear"
    ]
  },
  "std::vector::clear": {
    "symbol": "std::vector::clear",
    "canonicalSignature": "void clear() noexcept;",
    "summary": "Erases all elements from the container. Leaves `capacity()` unchanged to reuse allocated memory.",
    "header": "<vector>",
    "standard": "C++98 / C++20",
    "parameters": {},
    "returns": "`void`",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/clear",
    "complexity": {
      "time": "Linear in size of the container O(N) due to destructor calls"
    },
    "exceptionSafety": "No-throw guarantee.",
    "invalidation": "Invalidates all iterators, pointers and references related to the container.",
    "example": "std::vector<int> v = {1, 2, 3};\nv.clear();\nassert(v.empty() && v.capacity() > 0);",
    "seeAlso": [
      "std::vector::shrink_to_fit",
      "std::vector::empty"
    ]
  },
  "std::vector::reserve": {
    "symbol": "std::vector::reserve",
    "canonicalSignature": "void reserve(size_type new_cap);",
    "summary": "Increases the capacity of the vector to a value greater than or equal to `new_cap`. Prevents repeated reallocations when the final item count is known in advance.",
    "header": "<vector>",
    "standard": "C++98 / C++20",
    "parameters": {
      "new_cap": "New capacity of the vector in number of elements."
    },
    "returns": "`void`",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/reserve",
    "complexity": {
      "time": "At most O(N) where N is size(), if reallocation takes place"
    },
    "exceptionSafety": "Strong guarantee: if an exception is thrown, state of container is unchanged.",
    "invalidation": "If new_cap > capacity(), all iterators and references are invalidated.",
    "example": "std::vector<int> v;\nv.reserve(10000); // Pre-allocate storage for 10000 items to avoid 14 reallocations\nfor (int i = 0; i < 10000; ++i) v.push_back(i);",
    "seeAlso": [
      "std::vector::capacity",
      "std::vector::shrink_to_fit"
    ]
  },
  "std::vector::shrink_to_fit": {
    "symbol": "std::vector::shrink_to_fit",
    "canonicalSignature": "void shrink_to_fit();",
    "summary": "Requests the removal of unused capacity to reduce memory usage. It is a non-binding request to reduce capacity() to size().",
    "header": "<vector>",
    "standard": "C++11 / C++20",
    "parameters": {},
    "returns": "`void`",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/shrink_to_fit",
    "complexity": {
      "time": "At most linear in the size of the container O(N)"
    },
    "exceptionSafety": "Strong guarantee if T is CopyInsertable or nothrow MoveInsertable.",
    "invalidation": "Invalidates all iterators and references if reallocation takes place.",
    "example": "std::vector<int> v(1000);\nv.erase(v.begin() + 10, v.end()); // size is 10, capacity is 1000\nv.shrink_to_fit(); // capacity reduced to ~10",
    "seeAlso": [
      "std::vector::reserve",
      "std::vector::capacity"
    ]
  },
  "std::vector::at": {
    "symbol": "std::vector::at",
    "canonicalSignature": "reference at(size_type pos);\nconst_reference at(size_type pos) const;",
    "summary": "Returns a reference to the element at specified location `pos`, with bounds checking. Throws `std::out_of_range` if `pos >= size()`.",
    "header": "<vector>",
    "standard": "C++98 / C++20",
    "parameters": {
      "pos": "Zero-based index of the element to return."
    },
    "returns": "Reference to the requested element.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/at",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "Strong guarantee: throws std::out_of_range if pos is out of bounds.",
    "example": "std::vector<int> v = {10, 20};\ntry {\n    int val = v.at(5);\n} catch (const std::out_of_range& e) {\n    std::println(\"Error: {}\", e.what());\n}",
    "seeAlso": [
      "std::vector::operator[]",
      "std::vector::data"
    ]
  },
  "std::vector::data": {
    "symbol": "std::vector::data",
    "canonicalSignature": "T* data() noexcept;\nconst T* data() const noexcept;",
    "summary": "Returns pointer to the underlying array serving as element storage. Pointer is valid until the container is modified or reallocated.",
    "header": "<vector>",
    "standard": "C++11 / C++20",
    "parameters": {},
    "returns": "Direct raw pointer to the contiguous element buffer.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/vector/data",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<float> verts = {0.0f, 1.0f, 2.0f};\nglBufferData(GL_ARRAY_BUFFER, verts.size() * sizeof(float), verts.data(), GL_STATIC_DRAW);",
    "seeAlso": [
      "std::span",
      "std::vector::size"
    ]
  },
  "std::string": {
    "symbol": "std::string",
    "canonicalSignature": "using string = std::basic_string<char>;",
    "summary": "Instantiates `std::basic_string` for `char`. Manages dynamically-sized sequences of characters with Small String Optimization (SSO) for short strings without heap allocation.",
    "header": "<string>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/string/basic_string",
    "complexity": {
      "time": "O(1) random access, amortized O(1) push_back/append, O(N) search and substring"
    },
    "example": "std::string msg = \"Hello\";\nmsg += \" World!\";\nstd::println(\"{}\", msg);",
    "seeAlso": [
      "std::string_view",
      "std::format"
    ]
  },
  "std::string::substr": {
    "symbol": "std::string::substr",
    "canonicalSignature": "[[nodiscard]] string substr(size_type pos = 0, size_type count = npos) const;",
    "summary": "Returns a substring `[pos, pos + count)`. If requested count exceeds string length, returns characters to the end.",
    "header": "<string>",
    "standard": "C++98 / C++20",
    "parameters": {
      "pos": "Position of the first character to include.",
      "count": "Length of the substring to extract."
    },
    "returns": "A newly allocated `std::string` containing the substring.",
    "docUrl": "https://en.cppreference.com/w/cpp/string/basic_string/substr",
    "complexity": {
      "time": "Linear in count O(K)"
    },
    "exceptionSafety": "Strong guarantee: throws std::out_of_range if pos > size().",
    "example": "std::string s = \"NovaCpp Engine\";\nstd::string sub = s.substr(0, 7); // \"NovaCpp\"",
    "seeAlso": [
      "std::string_view::substr"
    ]
  },
  "std::string::c_str": {
    "symbol": "std::string::c_str",
    "canonicalSignature": "[[nodiscard]] const char* c_str() const noexcept;",
    "summary": "Returns a pointer to a null-terminated character array with data equivalent to those stored in the string.",
    "header": "<string>",
    "standard": "C++98 / C++20",
    "parameters": {},
    "returns": "Pointer to the underlying null-terminated `const char` buffer.",
    "docUrl": "https://en.cppreference.com/w/cpp/string/basic_string/c_str",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "invalidation": "Invalidated on any mutable operation on the source string.",
    "example": "std::string filename = \"config.ini\";\nFILE* f = fopen(filename.c_str(), \"rb\");",
    "seeAlso": [
      "std::string::data",
      "std::string_view"
    ]
  },
  "std::string::find": {
    "symbol": "std::string::find",
    "canonicalSignature": "size_type find(string_view sv, size_type pos = 0) const noexcept;",
    "summary": "Finds the first substring equal to the given character sequence starting at index `pos`. Returns `std::string::npos` if not found.",
    "header": "<string>",
    "standard": "C++98 / C++20",
    "parameters": {
      "sv": "String view or character sequence to search for.",
      "pos": "Index at which to start searching."
    },
    "returns": "Position of the first character of found substring, or `std::string::npos`.",
    "docUrl": "https://en.cppreference.com/w/cpp/string/basic_string/find",
    "complexity": {
      "time": "O(N * M) worst-case; typically fast search"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::string text = \"compiler discovery\";\nif (auto pos = text.find(\"disco\"); pos != std::string::npos) {\n    std::println(\"Found at index {}\", pos);\n}",
    "seeAlso": [
      "std::string::starts_with",
      "std::string::ends_with"
    ]
  },
  "std::string::starts_with": {
    "symbol": "std::string::starts_with",
    "canonicalSignature": "constexpr bool starts_with(string_view sv) const noexcept;\nconstexpr bool starts_with(char c) const noexcept;",
    "summary": "Checks if the string starts with the specified prefix `sv` or character `c`.",
    "header": "<string>",
    "standard": "C++20",
    "parameters": {
      "sv": "Prefix string view or char to check against."
    },
    "returns": "`true` if the string starts with the prefix, `false` otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/string/basic_string/starts_with",
    "complexity": {
      "time": "Linear in length of prefix O(M)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::string path = \"/usr/local/bin\";\nif (path.starts_with(\"/usr\")) {\n    std::println(\"System path\");\n}",
    "seeAlso": [
      "std::string::ends_with",
      "std::string_view::starts_with"
    ]
  },
  "std::string::ends_with": {
    "symbol": "std::string::ends_with",
    "canonicalSignature": "constexpr bool ends_with(string_view sv) const noexcept;\nconstexpr bool ends_with(char c) const noexcept;",
    "summary": "Checks if the string ends with the specified suffix `sv` or character `c`.",
    "header": "<string>",
    "standard": "C++20",
    "parameters": {
      "sv": "Suffix string view or char to check against."
    },
    "returns": "`true` if the string ends with the suffix, `false` otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/string/basic_string/ends_with",
    "complexity": {
      "time": "Linear in length of suffix O(M)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::string file = \"main.cpp\";\nif (file.ends_with(\".cpp\")) {\n    std::println(\"C++ source file\");\n}",
    "seeAlso": [
      "std::string::starts_with",
      "std::string_view::ends_with"
    ]
  },
  "std::string_view": {
    "symbol": "std::string_view",
    "canonicalSignature": "template <typename CharT, typename Traits = std::char_traits<CharT>>\nclass basic_string_view;",
    "summary": "Non-owning, zero-copy constant reference to a character buffer. Consists of only a pointer and a length ($O(1)$ copy and slicing). Ideal replacement for `const std::string&` parameters.",
    "header": "<string_view>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/string/basic_string_view",
    "complexity": {
      "time": "O(1) construction, copy, prefix/suffix removal",
      "space": "2 machine words (pointer + length)"
    },
    "invalidation": "Lifetime is tied to the underlying character storage. Do not access after source string is destroyed.",
    "example": "void parse(std::string_view sv) {\n    if (sv.starts_with(\"DEBUG:\")) {\n        std::println(\"Debug log: {}\", sv.substr(6));\n    }\n}",
    "seeAlso": [
      "std::string",
      "std::span"
    ]
  },
  "std::span": {
    "symbol": "std::span",
    "canonicalSignature": "template <typename T, std::size_t Extent = std::dynamic_extent>\nclass span;",
    "summary": "Non-owning view over a contiguous sequence of objects. Replaces raw pointer + length function parameters with bounds-safe access without heap allocation.",
    "header": "<span>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/span",
    "complexity": {
      "time": "O(1) construction, subspan, index access",
      "space": "1 pointer if static extent; 2 words (pointer + size) for dynamic extent"
    },
    "invalidation": "Lifetime tied to the underlying contiguous container or array.",
    "example": "void process_ints(std::span<const int> s) {\n    for (int x : s) std::println(\"{}\", x);\n}\nint arr[] = {1, 2, 3};\nprocess_ints(arr);\nstd::vector<int> vec = {4, 5, 6};\nprocess_ints(vec);",
    "seeAlso": [
      "std::string_view",
      "std::vector"
    ]
  },
  "std::array": {
    "symbol": "std::array",
    "canonicalSignature": "template <typename T, std::size_t N>\nstruct array;",
    "summary": "Fixed-size sequence container that wraps a native C-style array with standard container semantics (iterators, size(), at()). Zero overhead and stack-allocated.",
    "header": "<array>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/array",
    "complexity": {
      "time": "O(1) random access, size() is a compile-time constant",
      "space": "Exactly N * sizeof(T), zero allocator overhead"
    },
    "example": "std::array<int, 4> rgba = {255, 128, 64, 255};\nfor (int channel : rgba) {\n    // process channel\n}",
    "seeAlso": [
      "std::vector",
      "std::span"
    ]
  },
  "std::deque": {
    "symbol": "std::deque",
    "canonicalSignature": "template <typename T, typename Allocator = std::allocator<T>>\nclass deque;",
    "summary": "Double-ended queue that supports fast O(1) random access as well as O(1) insertion and deletion at both its beginning and its end. Implemented as segmented arrays.",
    "header": "<deque>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/deque",
    "complexity": {
      "time": "O(1) push_front, pop_front, push_back, pop_back, random access"
    },
    "invalidation": "Insertions at ends invalidate iterators but NOT references to existing elements.",
    "example": "std::deque<int> dq;\ndq.push_back(10);\ndq.push_front(5);\nassert(dq.front() == 5 && dq.back() == 10);",
    "seeAlso": [
      "std::vector",
      "std::list",
      "std::queue"
    ]
  },
  "std::list": {
    "symbol": "std::list",
    "canonicalSignature": "template <typename T, typename Allocator = std::allocator<T>>\nclass list;",
    "summary": "Doubly-linked list that supports constant time O(1) insertion and removal of elements from anywhere in the container. Does not support random access.",
    "header": "<list>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/list",
    "complexity": {
      "time": "O(1) insertion and erasure given an iterator; O(N) search"
    },
    "invalidation": "Insertions and erasures do NOT invalidate iterators or references to other elements.",
    "example": "std::list<int> l = {1, 2, 3};\nauto it = std::next(l.begin());\nl.insert(it, 42); // inserts before 2 without invalidating it",
    "seeAlso": [
      "std::deque",
      "std::vector"
    ]
  },
  "std::map": {
    "symbol": "std::map",
    "canonicalSignature": "template <typename Key, typename T, typename Compare = std::less<Key>, typename Allocator = std::allocator<std::pair<const Key, T>>>\nclass map;",
    "summary": "Sorted associative container that contains key-value pairs with unique keys. Search, removal, and insertion operations have logarithmic complexity. Implemented as a Red-Black Tree.",
    "header": "<map>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/map",
    "complexity": {
      "time": "O(log N) search, insertion, removal"
    },
    "invalidation": "Insertions do NOT invalidate any iterators. Erasures only invalidate iterators pointing to the erased element.",
    "example": "std::map<std::string, int> scores;\nscores[\"Alice\"] = 95;\nscores[\"Bob\"] = 88;\nfor (const auto& [name, score] : scores) {\n    std::println(\"{}: {}\", name, score);\n}",
    "seeAlso": [
      "std::unordered_map",
      "std::set"
    ]
  },
  "std::map::insert": {
    "symbol": "std::map::insert",
    "canonicalSignature": "std::pair<iterator, bool> insert(const value_type& value);\nstd::pair<iterator, bool> insert(value_type&& value);",
    "summary": "Inserts element into the container, if the container doesn't already contain an element with an equivalent key.",
    "header": "<map>",
    "standard": "C++98 / C++11",
    "parameters": {
      "value": "Key-value pair to insert."
    },
    "returns": "Pair consisting of an iterator to the inserted element (or the element that prevented the insertion) and a bool denoting whether the insertion took place.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/map/insert",
    "complexity": {
      "time": "Logarithmic in container size O(log N)"
    },
    "exceptionSafety": "Strong guarantee: if an exception is thrown, state is unmodified.",
    "example": "std::map<int, std::string> m;\nauto [it, inserted] = m.insert({1, \"one\"});\nassert(inserted == true);",
    "seeAlso": [
      "std::map::try_emplace",
      "std::map::find"
    ]
  },
  "std::map::find": {
    "symbol": "std::map::find",
    "canonicalSignature": "iterator find(const Key& key);\nconst_iterator find(const Key& key) const;",
    "summary": "Finds an element with key equivalent to `key`. Returns `end()` iterator if key is not found.",
    "header": "<map>",
    "standard": "C++98 / C++20",
    "parameters": {
      "key": "Key value of the element to search for."
    },
    "returns": "Iterator to an element with key equivalent to `key`. If no such element is found, past-the-end `end()` iterator is returned.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/map/find",
    "complexity": {
      "time": "Logarithmic in container size O(log N)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::map<int, std::string> m = {{1, \"one\"}};\nif (auto it = m.find(1); it != m.end()) {\n    std::println(\"Found: {}\", it->second);\n}",
    "seeAlso": [
      "std::map::contains",
      "std::map::count"
    ]
  },
  "std::map::contains": {
    "symbol": "std::map::contains",
    "canonicalSignature": "bool contains(const Key& key) const;",
    "summary": "Checks if there is an element with key equivalent to `key` in the container. Superior to `m.find(key) != m.end()`.",
    "header": "<map>",
    "standard": "C++20",
    "parameters": {
      "key": "Key value of the element to search for."
    },
    "returns": "`true` if an element with key equivalent to `key` is found, `false` otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/map/contains",
    "complexity": {
      "time": "Logarithmic in container size O(log N)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::map<std::string, int> dict = {{\"pi\", 314}};\nif (dict.contains(\"pi\")) {\n    std::println(\"Found pi\");\n}",
    "seeAlso": [
      "std::map::find",
      "std::unordered_map::contains"
    ]
  },
  "std::unordered_map": {
    "symbol": "std::unordered_map",
    "canonicalSignature": "template <typename Key, typename T, typename Hash = std::hash<Key>, typename KeyEqual = std::equal_to<Key>, typename Allocator = std::allocator<std::pair<const Key, T>>>\nclass unordered_map;",
    "summary": "Associative container that contains key-value pairs with unique keys. Search, insertion, and removal have average constant-time complexity. Implemented as a Hash Table.",
    "header": "<unordered_map>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/unordered_map",
    "complexity": {
      "time": "Average O(1) search/insert/erase; Worst-case O(N) on hash collisions"
    },
    "invalidation": "Rehash invalidates iterators, but pointers and references to elements remain valid.",
    "example": "std::unordered_map<std::string, int> lookup = {{\"alpha\", 1}, {\"beta\", 2}};\nlookup[\"gamma\"] = 3;\nif (lookup.contains(\"alpha\")) {\n    std::println(\"Alpha = {}\", lookup[\"alpha\"]);\n}",
    "seeAlso": [
      "std::map",
      "std::unordered_set"
    ]
  },
  "std::unordered_map::find": {
    "symbol": "std::unordered_map::find",
    "canonicalSignature": "iterator find(const Key& key);\nconst_iterator find(const Key& key) const;",
    "summary": "Finds an element with key equivalent to `key`. Returns `end()` if not found.",
    "header": "<unordered_map>",
    "standard": "C++11 / C++20",
    "parameters": {
      "key": "Key value to search for."
    },
    "returns": "Iterator to the found element, or `end()`.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/unordered_map/find",
    "complexity": {
      "time": "Average case O(1); Worst-case O(N)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::unordered_map<int, int> table = {{1, 100}};\nauto it = table.find(1);\nif (it != table.end()) std::println(\"{}\", it->second);",
    "seeAlso": [
      "std::unordered_map::contains"
    ]
  },
  "std::unordered_map::contains": {
    "symbol": "std::unordered_map::contains",
    "canonicalSignature": "bool contains(const Key& key) const;",
    "summary": "Checks if an element with key equivalent to `key` exists in the hash table.",
    "header": "<unordered_map>",
    "standard": "C++20",
    "parameters": {
      "key": "Key value to look for."
    },
    "returns": "`true` if an element with equivalent key is found, `false` otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/container/unordered_map/contains",
    "complexity": {
      "time": "Average case O(1); Worst-case O(N)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::unordered_map<int, int> cache;\nif (!cache.contains(req_id)) {\n    cache[req_id] = fetch_data(req_id);\n}",
    "seeAlso": [
      "std::unordered_map::find"
    ]
  },
  "std::set": {
    "symbol": "std::set",
    "canonicalSignature": "template <typename Key, typename Compare = std::less<Key>, typename Allocator = std::allocator<Key>>\nclass set;",
    "summary": "Associative container that contains a sorted set of unique objects of type `Key`. Search, removal, and insertion have logarithmic complexity. Implemented as Red-Black Tree.",
    "header": "<set>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/set",
    "complexity": {
      "time": "Logarithmic O(log N) search, insert, and erase"
    },
    "example": "std::set<int> unique_ids = {3, 1, 4, 1, 5};\nfor (int id : unique_ids) {\n    std::print(\"{} \", id); // 1 3 4 5 (sorted and deduplicated)\n}",
    "seeAlso": [
      "std::unordered_set",
      "std::map"
    ]
  },
  "std::unordered_set": {
    "symbol": "std::unordered_set",
    "canonicalSignature": "template <typename Key, typename Hash = std::hash<Key>, typename KeyEqual = std::equal_to<Key>, typename Allocator = std::allocator<Key>>\nclass unordered_set;",
    "summary": "Associative container that contains a set of unique objects of type `Key` stored in a hash table. Fast average O(1) membership lookup.",
    "header": "<unordered_set>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/unordered_set",
    "complexity": {
      "time": "Average O(1) lookup/insert/erase; worst-case O(N)"
    },
    "example": "std::unordered_set<std::string> visited;\nvisited.insert(\"node_1\");\nif (visited.contains(\"node_1\")) {\n    std::println(\"Already visited\");\n}",
    "seeAlso": [
      "std::set",
      "std::unordered_map"
    ]
  },
  "std::queue": {
    "symbol": "std::queue",
    "canonicalSignature": "template <typename T, typename Container = std::deque<T>>\nclass queue;",
    "summary": "Container adaptor that gives the programmer the functionality of a FIFO (First-In, First-Out) queue.",
    "header": "<queue>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/queue",
    "complexity": {
      "time": "O(1) push, pop, front, back"
    },
    "example": "std::queue<int> q;\nq.push(1);\nq.push(2);\nwhile (!q.empty()) {\n    std::println(\"{}\", q.front());\n    q.pop();\n}",
    "seeAlso": [
      "std::stack",
      "std::priority_queue",
      "std::deque"
    ]
  },
  "std::stack": {
    "symbol": "std::stack",
    "canonicalSignature": "template <typename T, typename Container = std::deque<T>>\nclass stack;",
    "summary": "Container adaptor that gives the programmer the functionality of a LIFO (Last-In, First-Out) stack.",
    "header": "<stack>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/stack",
    "complexity": {
      "time": "O(1) push, pop, top"
    },
    "example": "std::stack<int> s;\ns.push(10);\ns.push(20);\nstd::println(\"Top: {}\", s.top()); // 20\ns.pop();",
    "seeAlso": [
      "std::queue",
      "std::vector"
    ]
  },
  "std::priority_queue": {
    "symbol": "std::priority_queue",
    "canonicalSignature": "template <typename T, typename Container = std::vector<T>, typename Compare = std::less<typename Container::value_type>>\nclass priority_queue;",
    "summary": "Container adaptor that provides constant time lookup of the largest (by default) element, at the expense of logarithmic insertion and extraction. Implemented as a Max-Heap.",
    "header": "<queue>",
    "standard": "C++98",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/container/priority_queue",
    "complexity": {
      "time": "O(1) top(), O(log N) push() and pop()"
    },
    "example": "std::priority_queue<int> pq;\npq.push(30);\npq.push(10);\npq.push(50);\nwhile (!pq.empty()) {\n    std::println(\"{}\", pq.top()); // 50, then 30, then 10\n    pq.pop();\n}",
    "seeAlso": [
      "std::queue",
      "std::make_heap"
    ]
  }
};

export const containersModule: StlHeaderModule = {
  id: 'containers',
  headers: ["<vector>","<string>","<string_view>","<span>","<array>","<deque>","<list>","<map>","<unordered_map>","<set>","<unordered_set>","<queue>","<stack>"],
  entries: CONTAINERS_ENTRIES
};
