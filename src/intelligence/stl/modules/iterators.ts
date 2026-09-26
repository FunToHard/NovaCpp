import { StlDocEntry, StlHeaderModule } from '../types';

export const ITERATORS_ENTRIES: Record<string, StlDocEntry> = {
  "std::begin": {
    "symbol": "std::begin",
    "canonicalSignature": "template <typename C>\nconstexpr auto begin(C& c) -> decltype(c.begin());\ntemplate <typename C>\nconstexpr auto begin(const C& c) -> decltype(c.begin());\ntemplate <typename T, std::size_t N>\nconstexpr T* begin(T (&array)[N]) noexcept;",
    "summary": "Returns an iterator to the beginning of the given container, native raw array, or range.",
    "header": "<iterator>",
    "standard": "C++11 / C++14",
    "parameters": {
      "c": "A container or native array with a begin member or free function."
    },
    "returns": "Iterator pointing to the first element in the sequence.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/begin",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee if the underlying container begin() does not throw.",
    "example": "std::vector<int> v = {10, 20, 30};\nauto it = std::begin(v);\nassert(*it == 10);",
    "seeAlso": [
      "std::end",
      "std::cbegin",
      "std::ranges::begin"
    ]
  },
  "std::end": {
    "symbol": "std::end",
    "canonicalSignature": "template <typename C>\nconstexpr auto end(C& c) -> decltype(c.end());\ntemplate <typename C>\nconstexpr auto end(const C& c) -> decltype(c.end());\ntemplate <typename T, std::size_t N>\nconstexpr T* end(T (&array)[N]) noexcept;",
    "summary": "Returns an iterator to the past-the-end element of the given container, native raw array, or range.",
    "header": "<iterator>",
    "standard": "C++11 / C++14",
    "parameters": {
      "c": "A container or native array with an end member or free function."
    },
    "returns": "Iterator pointing past the last element in the sequence.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/end",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee if the underlying container end() does not throw.",
    "example": "int arr[] = {1, 2, 3};\nfor (auto it = std::begin(arr); it != std::end(arr); ++it) {\n    std::println(\"{}\", *it);\n}",
    "seeAlso": [
      "std::begin",
      "std::cend",
      "std::ranges::end"
    ]
  },
  "std::cbegin": {
    "symbol": "std::cbegin",
    "canonicalSignature": "template <typename C>\nconstexpr auto cbegin(const C& c) noexcept(noexcept(std::begin(c))) -> decltype(std::begin(c));",
    "summary": "Returns a read-only const_iterator pointing to the beginning of the given container, array, or range.",
    "header": "<iterator>",
    "standard": "C++14",
    "parameters": {
      "c": "A container or array to obtain a const_iterator from."
    },
    "returns": "Constant iterator pointing to the first element in the sequence.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/begin",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee if std::begin(c) does not throw.",
    "example": "std::vector<int> v = {1, 2, 3};\nauto it = std::cbegin(v);\n// *it = 10; // Read-only access prevents mutation",
    "seeAlso": [
      "std::cend",
      "std::begin"
    ]
  },
  "std::cend": {
    "symbol": "std::cend",
    "canonicalSignature": "template <typename C>\nconstexpr auto cend(const C& c) noexcept(noexcept(std::end(c))) -> decltype(std::end(c));",
    "summary": "Returns a read-only const_iterator pointing to the past-the-end element of the given container, array, or range.",
    "header": "<iterator>",
    "standard": "C++14",
    "parameters": {
      "c": "A container or array to obtain a const past-the-end iterator from."
    },
    "returns": "Constant iterator pointing past the last element in the sequence.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/end",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee if std::end(c) does not throw.",
    "example": "std::vector<int> v = {1, 2, 3};\nfor (auto it = std::cbegin(v); it != std::cend(v); ++it) {\n    std::println(\"{}\", *it);\n}",
    "seeAlso": [
      "std::cbegin",
      "std::end"
    ]
  },
  "std::rbegin": {
    "symbol": "std::rbegin",
    "canonicalSignature": "template <typename C>\nconstexpr auto rbegin(C& c) -> decltype(c.rbegin());\ntemplate <typename C>\nconstexpr auto rbegin(const C& c) -> decltype(c.rbegin());\ntemplate <typename T, std::size_t N>\nconstexpr std::reverse_iterator<T*> rbegin(T (&array)[N]);",
    "summary": "Returns a reverse iterator pointing to the reverse beginning (last element) of the container or native array.",
    "header": "<iterator>",
    "standard": "C++14",
    "parameters": {
      "c": "A container or array supporting reverse iteration."
    },
    "returns": "Reverse iterator pointing to the last element in the sequence.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/rbegin",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee if the underlying container rbegin() does not throw.",
    "example": "std::vector<int> v = {1, 2, 3};\nauto rit = std::rbegin(v);\nassert(*rit == 3);",
    "seeAlso": [
      "std::rend",
      "std::begin",
      "std::reverse_iterator"
    ]
  },
  "std::rend": {
    "symbol": "std::rend",
    "canonicalSignature": "template <typename C>\nconstexpr auto rend(C& c) -> decltype(c.rend());\ntemplate <typename C>\nconstexpr auto rend(const C& c) -> decltype(c.rend());\ntemplate <typename T, std::size_t N>\nconstexpr std::reverse_iterator<T*> rend(T (&array)[N]);",
    "summary": "Returns a reverse iterator pointing to the reverse end (element preceding the first element) of the container or native array.",
    "header": "<iterator>",
    "standard": "C++14",
    "parameters": {
      "c": "A container or array supporting reverse iteration."
    },
    "returns": "Reverse iterator pointing before the first element in the sequence.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/rend",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee if the underlying container rend() does not throw.",
    "example": "std::vector<int> v = {1, 2, 3};\nfor (auto it = std::rbegin(v); it != std::rend(v); ++it) {\n    std::println(\"{}\", *it); // 3, 2, 1\n}",
    "seeAlso": [
      "std::rbegin",
      "std::end",
      "std::reverse_iterator"
    ]
  },
  "std::size": {
    "symbol": "std::size",
    "canonicalSignature": "template <typename C>\nconstexpr auto size(const C& c) -> decltype(c.size());\ntemplate <typename T, std::size_t N>\nconstexpr std::size_t size(const T (&array)[N]) noexcept;",
    "summary": "Returns the number of elements in a container or native raw array as an unsigned size type.",
    "header": "<iterator>",
    "standard": "C++17",
    "parameters": {
      "c": "A container with a .size() member or a native C-style array."
    },
    "returns": "The number of elements in the container or array.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/size",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "int arr[] = {1, 2, 3, 4};\nstd::size_t count = std::size(arr); // 4",
    "seeAlso": [
      "std::ssize",
      "std::empty"
    ]
  },
  "std::ssize": {
    "symbol": "std::ssize",
    "canonicalSignature": "template <typename C>\nconstexpr auto ssize(const C& c);\ntemplate <typename T, std::ptrdiff_t N>\nconstexpr std::ptrdiff_t ssize(const T (&array)[N]) noexcept;",
    "summary": "Returns the size of the container or native array as a signed integer (std::ptrdiff_t). Eliminates signed/unsigned comparison warnings in index loops.",
    "header": "<iterator>",
    "standard": "C++20",
    "parameters": {
      "c": "A container or native C-style array."
    },
    "returns": "Signed size of type std::ptrdiff_t representing element count.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/size",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {10, 20, 30};\nfor (std::ptrdiff_t i = 0; i < std::ssize(v); ++i) {\n    std::println(\"Index {}: {}\", i, v[i]);\n}",
    "seeAlso": [
      "std::size",
      "std::empty"
    ]
  },
  "std::empty": {
    "symbol": "std::empty",
    "canonicalSignature": "template <typename C>\n[[nodiscard]] constexpr auto empty(const C& c) -> decltype(c.empty());\ntemplate <typename T, std::size_t N>\n[[nodiscard]] constexpr bool empty(const T (&array)[N]) noexcept;\ntemplate <typename E>\n[[nodiscard]] constexpr bool empty(std::initializer_list<E> il) noexcept;",
    "summary": "Returns whether the given container, native raw array, or initializer list is empty.",
    "header": "<iterator>",
    "standard": "C++17",
    "parameters": {
      "c": "A container with an .empty() member, array, or initializer list."
    },
    "returns": "true if the sequence has zero elements, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/empty",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v;\nif (std::empty(v)) {\n    std::println(\"Vector is empty\");\n}",
    "seeAlso": [
      "std::size",
      "std::data"
    ]
  },
  "std::data": {
    "symbol": "std::data",
    "canonicalSignature": "template <typename C>\nconstexpr auto data(C& c) -> decltype(c.data());\ntemplate <typename C>\nconstexpr auto data(const C& c) -> decltype(c.data());\ntemplate <typename T, std::size_t N>\nconstexpr T* data(T (&array)[N]) noexcept;",
    "summary": "Returns a pointer to the contiguous block of memory storing the elements of the container or native array.",
    "header": "<iterator>",
    "standard": "C++17",
    "parameters": {
      "c": "A contiguous container with a .data() member or native array."
    },
    "returns": "Pointer to the underlying array buffer, or nullptr if empty.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/data",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {1, 2, 3};\nint* raw = std::data(v);\nassert(raw[0] == 1);",
    "seeAlso": [
      "std::size",
      "std::empty"
    ]
  },
  "std::advance": {
    "symbol": "std::advance",
    "canonicalSignature": "template <typename InputIt, typename Distance>\nconstexpr void advance(InputIt& it, Distance n);",
    "summary": "Increments the given iterator it by n element positions. If negative for bidirectional iterators, decrements it.",
    "header": "<iterator>",
    "standard": "C++98 / C++17",
    "parameters": {
      "it": "Iterator to advance passed by reference.",
      "n": "Number of element positions to advance."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/advance",
    "complexity": {
      "time": "O(1) for random access iterators, linear O(n) for input/forward/bidirectional iterators"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::list<int> l = {10, 20, 30, 40};\nauto it = l.begin();\nstd::advance(it, 2);\nassert(*it == 30);",
    "seeAlso": [
      "std::next",
      "std::prev",
      "std::distance"
    ]
  },
  "std::distance": {
    "symbol": "std::distance",
    "canonicalSignature": "template <typename InputIt>\nconstexpr typename std::iterator_traits<InputIt>::difference_type distance(InputIt first, InputIt last);",
    "summary": "Returns the number of hops (increments) required to traverse from first to last.",
    "header": "<iterator>",
    "standard": "C++98 / C++17",
    "parameters": {
      "first": "Iterator pointing to the initial element.",
      "last": "Iterator pointing to the final element."
    },
    "returns": "The number of increments needed to reach last from first.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/distance",
    "complexity": {
      "time": "O(1) for random access iterators, linear O(N) for other iterators"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4};\nauto dist = std::distance(v.begin(), v.end()); // 4",
    "seeAlso": [
      "std::advance",
      "std::next"
    ]
  },
  "std::next": {
    "symbol": "std::next",
    "canonicalSignature": "template <typename InputIt>\nconstexpr InputIt next(InputIt it, typename std::iterator_traits<InputIt>::difference_type n = 1);",
    "summary": "Returns the nth successor of iterator it without mutating the original iterator.",
    "header": "<iterator>",
    "standard": "C++11 / C++17",
    "parameters": {
      "it": "Base input iterator.",
      "n": "Number of positions to advance forward (defaults to 1)."
    },
    "returns": "The nth successor iterator.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/next",
    "complexity": {
      "time": "O(1) for random access iterators, linear O(n) otherwise"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {10, 20, 30};\nauto second = std::next(v.begin());\nassert(*second == 20);",
    "seeAlso": [
      "std::prev",
      "std::advance"
    ]
  },
  "std::prev": {
    "symbol": "std::prev",
    "canonicalSignature": "template <typename BidirIt>\nconstexpr BidirIt prev(BidirIt it, typename std::iterator_traits<BidirIt>::difference_type n = 1);",
    "summary": "Returns the nth predecessor of bidirectional iterator it without mutating the original iterator.",
    "header": "<iterator>",
    "standard": "C++11 / C++17",
    "parameters": {
      "it": "Base bidirectional iterator.",
      "n": "Number of positions to step back (defaults to 1)."
    },
    "returns": "The nth predecessor iterator.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/prev",
    "complexity": {
      "time": "O(1) for random access iterators, linear O(n) otherwise"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {10, 20, 30};\nauto last = std::prev(v.end());\nassert(*last == 30);",
    "seeAlso": [
      "std::next",
      "std::advance"
    ]
  },
  "std::back_inserter": {
    "symbol": "std::back_inserter",
    "canonicalSignature": "template <typename Container>\nconstexpr std::back_insert_iterator<Container> back_inserter(Container& c);",
    "summary": "Constructs a std::back_insert_iterator that inserts new elements at the end of container c via c.push_back().",
    "header": "<iterator>",
    "standard": "C++98 / C++20",
    "parameters": {
      "c": "Target container supporting push_back."
    },
    "returns": "A std::back_insert_iterator<Container> wrapping container c.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/back_inserter",
    "complexity": {
      "time": "O(1) iterator construction"
    },
    "exceptionSafety": "No-throw guarantee during iterator construction.",
    "example": "std::vector<int> src = {1, 2, 3};\nstd::vector<int> dst;\nstd::copy(src.begin(), src.end(), std::back_inserter(dst));",
    "seeAlso": [
      "std::front_inserter",
      "std::inserter"
    ]
  },
  "std::front_inserter": {
    "symbol": "std::front_inserter",
    "canonicalSignature": "template <typename Container>\nconstexpr std::front_insert_iterator<Container> front_inserter(Container& c);",
    "summary": "Constructs a std::front_insert_iterator that inserts new elements at the beginning of container c via c.push_front().",
    "header": "<iterator>",
    "standard": "C++98 / C++20",
    "parameters": {
      "c": "Target container supporting push_front (such as std::deque or std::list)."
    },
    "returns": "A std::front_insert_iterator<Container> wrapping container c.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/front_inserter",
    "complexity": {
      "time": "O(1) iterator construction"
    },
    "exceptionSafety": "No-throw guarantee during iterator construction.",
    "example": "std::deque<int> d;\nstd::vector<int> v = {1, 2, 3};\nstd::copy(v.begin(), v.end(), std::front_inserter(d));\n// d is now {3, 2, 1}",
    "seeAlso": [
      "std::back_inserter",
      "std::inserter"
    ]
  },
  "std::inserter": {
    "symbol": "std::inserter",
    "canonicalSignature": "template <typename Container>\nconstexpr std::insert_iterator<Container> inserter(Container& c, typename Container::iterator it);",
    "summary": "Constructs a std::insert_iterator that inserts new elements into container c at position it via c.insert().",
    "header": "<iterator>",
    "standard": "C++98 / C++20",
    "parameters": {
      "c": "Target container supporting insert.",
      "it": "Iterator to the position before which elements will be inserted."
    },
    "returns": "A std::insert_iterator<Container> wrapping container c and insertion iterator it.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/inserter",
    "complexity": {
      "time": "O(1) iterator construction"
    },
    "exceptionSafety": "No-throw guarantee during iterator construction.",
    "example": "std::set<int> s = {1, 4};\nstd::vector<int> v = {2, 3};\nstd::copy(v.begin(), v.end(), std::inserter(s, s.end()));",
    "seeAlso": [
      "std::back_inserter",
      "std::front_inserter"
    ]
  },
  "std::reverse_iterator": {
    "symbol": "std::reverse_iterator",
    "canonicalSignature": "template <typename Iter>\nclass reverse_iterator;",
    "summary": "Iterator adaptor that reverses the direction of a given bidirectional or random-access iterator. Pre-incrementing steps backward.",
    "header": "<iterator>",
    "standard": "C++98 / C++20",
    "parameters": {
      "Iter": "Underlying bidirectional or random access iterator type."
    },
    "returns": "Reverse iterator adaptor object.",
    "docUrl": "https://en.cppreference.com/w/cpp/iterator/reverse_iterator",
    "complexity": {
      "time": "O(1) construction and iterator stepping"
    },
    "exceptionSafety": "No-throw guarantee if underlying iterator operations do not throw.",
    "example": "std::vector<int> v = {1, 2, 3};\nstd::reverse_iterator<decltype(v.end())> r_first(v.end());\nassert(*r_first == 3);",
    "seeAlso": [
      "std::rbegin",
      "std::rend"
    ]
  }
};

export const iteratorsModule: StlHeaderModule = {
  id: 'iterators',
  headers: ['<iterator>'],
  entries: ITERATORS_ENTRIES
};
