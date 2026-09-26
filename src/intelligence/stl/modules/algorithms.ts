import { StlDocEntry, StlHeaderModule } from '../types';

export const ALGORITHMS_ENTRIES: Record<string, StlDocEntry> = {
  "std::ranges::sort": {
    "symbol": "std::ranges::sort",
    "canonicalSignature": "template <std::random_access_iterator I, std::sentinel_for<I> S, typename Comp = ranges::less, typename Proj = std::identity>\nconstexpr I sort(I first, S last, Comp comp = {}, Proj proj = {});",
    "summary": "C++20 constrained range sort. Sorts elements in the range `[first, last)` in non-descending order using introsort ($O(N \\log N)$). Supports projections.",
    "header": "<algorithm>",
    "standard": "C++20",
    "parameters": {
      "first": "Iterator pointing to the beginning of the sequence to sort.",
      "last": "Sentinel or iterator pointing to the end of the sequence.",
      "comp": "Comparison predicate that returns `true` if first argument is ordered before second.",
      "proj": "Projection function applied to each element before comparison."
    },
    "returns": "An iterator equal to `last`.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/ranges/sort",
    "complexity": {
      "time": "O(N log N) comparisons, guaranteed worst-case via Introsort"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "struct Player { std::string name; int score; };\nstd::vector<Player> roster = {{\"Ada\", 90}, {\"Bob\", 99}};\nstd::ranges::sort(roster, std::greater<>{}, &Player::score); // Sorted by score descending",
    "seeAlso": [
      "std::sort",
      "std::ranges::stable_sort"
    ]
  },
  "std::sort": {
    "symbol": "std::sort",
    "canonicalSignature": "template <typename RandomIt, typename Compare = std::less<>>\nconstexpr void sort(RandomIt first, RandomIt last, Compare comp = {});",
    "summary": "Sorts elements in range `[first, last)` into ascending order using introsort ($O(N \\log N)$ average and worst-case).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Random access iterator to the beginning of the range.",
      "last": "Random access iterator to the end of the range.",
      "comp": "Comparison functor object."
    },
    "returns": "`void`",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/sort",
    "complexity": {
      "time": "O(N log N) comparisons"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {5, 2, 8, 1, 9};\nstd::sort(v.begin(), v.end());\n// v is now {1, 2, 5, 8, 9}",
    "seeAlso": [
      "std::ranges::sort",
      "std::stable_sort"
    ]
  },
  "std::find": {
    "symbol": "std::find",
    "canonicalSignature": "template <typename InputIt, typename T>\nconstexpr InputIt find(InputIt first, InputIt last, const T& value);",
    "summary": "Returns the first iterator in the range `[first, last)` that compares equal to `value`. Returns `last` if not found.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Iterator to the initial position in the sequence.",
      "last": "Iterator to the final position in the sequence.",
      "value": "Value to search for."
    },
    "returns": "Iterator to the first element comparing equal to `value`, or `last`.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/find",
    "complexity": {
      "time": "At most O(N) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> v = {10, 20, 30};\nauto it = std::find(v.begin(), v.end(), 20);\nif (it != v.end()) std::println(\"Found index {}\", std::distance(v.begin(), it));",
    "seeAlso": [
      "std::ranges::find",
      "std::find_if"
    ]
  },
  "std::ranges::find": {
    "symbol": "std::ranges::find",
    "canonicalSignature": "template <std::input_iterator I, std::sentinel_for<I> S, typename T, typename Proj = std::identity>\nconstexpr I find(I first, S last, const T& value, Proj proj = {});",
    "summary": "C++20 constrained range find. Finds the first element in `[first, last)` matching `value` after applying optional projection.",
    "header": "<algorithm>",
    "standard": "C++20",
    "parameters": {
      "first": "Iterator to the start of the range.",
      "last": "Sentinel or iterator to the end of the range.",
      "value": "Value to compare elements with.",
      "proj": "Projection function applied to elements before comparison."
    },
    "returns": "Iterator to the first element equal to `value`, or `last`.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/ranges/find",
    "complexity": {
      "time": "At most O(N) comparisons"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<std::string> names = {\"alice\", \"bob\", \"carol\"};\nauto it = std::ranges::find(names, \"bob\");",
    "seeAlso": [
      "std::find",
      "std::ranges::find_if"
    ]
  },
  "std::find_if": {
    "symbol": "std::find_if",
    "canonicalSignature": "template <typename InputIt, typename UnaryPredicate>\nconstexpr InputIt find_if(InputIt first, InputIt last, UnaryPredicate p);",
    "summary": "Returns the first iterator in the range `[first, last)` for which predicate `p` returns `true`. Returns `last` if not found.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Iterator to the start of the range.",
      "last": "Iterator to the end of the range.",
      "p": "Unary predicate which returns true for the required element."
    },
    "returns": "Iterator to the first matching element, or `last`.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/find_if",
    "complexity": {
      "time": "At most O(N) predicate evaluations"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 3, 4, 7};\nauto it = std::find_if(v.begin(), v.end(), [](int n) { return n % 2 == 0; });\nif (it != v.end()) std::println(\"First even: {}\", *it); // 4",
    "seeAlso": [
      "std::ranges::find_if",
      "std::find"
    ]
  },
  "std::transform": {
    "symbol": "std::transform",
    "canonicalSignature": "template <typename InputIt, typename OutputIt, typename UnaryOperation>\nconstexpr OutputIt transform(InputIt first1, InputIt last1, OutputIt d_first, UnaryOperation unary_op);",
    "summary": "Applies the given function `unary_op` to a range and stores the result in another range beginning at `d_first`.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Iterator to beginning of input range.",
      "last1": "Iterator to end of input range.",
      "d_first": "Beginning of destination range (can be same as input range for in-place transformation).",
      "unary_op": "Operation applied to each element."
    },
    "returns": "Output iterator to the element in destination range past the last element transformed.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/transform",
    "complexity": {
      "time": "Exactly O(N) applications of unary_op"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> src = {1, 2, 3};\nstd::vector<int> dst;\ndst.reserve(src.size());\nstd::transform(src.begin(), src.end(), std::back_inserter(dst), [](int x) { return x * x; });",
    "seeAlso": [
      "std::ranges::transform",
      "std::for_each"
    ]
  },
  "std::ranges::transform": {
    "symbol": "std::ranges::transform",
    "canonicalSignature": "template <std::input_iterator I, std::sentinel_for<I> S, std::weakly_incrementable O, typename F, typename Proj = std::identity>\nconstexpr ranges::transform_result<I, O> transform(I first1, S last1, O result, F op, Proj proj = {});",
    "summary": "C++20 constrained range transform. Applies function `op` to range `[first1, last1)` and writes output into `result`. Supports projections.",
    "header": "<algorithm>",
    "standard": "C++20",
    "parameters": {
      "first1": "Beginning of input range.",
      "last1": "Sentinel or end of input range.",
      "result": "Output iterator for transformed items.",
      "op": "Transforming function.",
      "proj": "Optional projection function."
    },
    "returns": "`ranges::transform_result` containing an input iterator equal to `last1` and output iterator past the last element written.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/ranges/transform",
    "complexity": {
      "time": "Exactly O(N) operations"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<std::string> words = {\"hi\", \"there\"};\nstd::vector<int> lengths;\nstd::ranges::transform(words, std::back_inserter(lengths), &std::string::length);",
    "seeAlso": [
      "std::transform"
    ]
  },
  "std::accumulate": {
    "symbol": "std::accumulate",
    "canonicalSignature": "template <typename InputIt, typename T, typename BinaryOperation = std::plus<>>\nconstexpr T accumulate(InputIt first, InputIt last, T init, BinaryOperation op = {});",
    "summary": "Computes the sum (or fold reduction using `op`) of the given value `init` and the elements in the range `[first, last)`.",
    "header": "<numeric>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range to accumulate.",
      "last": "End of range to accumulate.",
      "init": "Initial accumulator value.",
      "op": "Binary operation function taking accumulator and current element."
    },
    "returns": "The accumulated result value of type `T`.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/accumulate",
    "complexity": {
      "time": "Linear O(N) where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> nums = {1, 2, 3, 4};\nint sum = std::accumulate(nums.begin(), nums.end(), 0); // 10\nint prod = std::accumulate(nums.begin(), nums.end(), 1, std::multiplies<>{}); // 24",
    "seeAlso": [
      "std::reduce",
      "std::transform_reduce"
    ]
  },
  "std::binary_search": {
    "symbol": "std::binary_search",
    "canonicalSignature": "template <typename ForwardIt, typename T, typename Compare = std::less<>>\nconstexpr bool binary_search(ForwardIt first, ForwardIt last, const T& value, Compare comp = {});",
    "summary": "Checks if an element equivalent to `value` appears within the sorted range `[first, last)`. Range MUST be partitioned/sorted.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of sorted range.",
      "last": "End of sorted range.",
      "value": "Value to search for.",
      "comp": "Comparison function."
    },
    "returns": "`true` if an element equal to `value` is found, `false` otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/binary_search",
    "complexity": {
      "time": "O(log N) comparisons for random access iterators; O(N) iterator hops for forward iterators"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> sorted = {1, 3, 5, 7, 9};\nif (std::binary_search(sorted.begin(), sorted.end(), 5)) {\n    std::println(\"Found 5!\");\n}",
    "seeAlso": [
      "std::lower_bound",
      "std::upper_bound"
    ]
  },
  "std::lower_bound": {
    "symbol": "std::lower_bound",
    "canonicalSignature": "template <typename ForwardIt, typename T, typename Compare = std::less<>>\nconstexpr ForwardIt lower_bound(ForwardIt first, ForwardIt last, const T& value, Compare comp = {});",
    "summary": "Returns an iterator pointing to the first element in the sorted range `[first, last)` that does NOT compare less than `value` (i.e. `>= value`).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of sorted range.",
      "last": "End of sorted range.",
      "value": "Value to compare elements to.",
      "comp": "Comparison function."
    },
    "returns": "Iterator to the first element `>= value`, or `last`.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/lower_bound",
    "complexity": {
      "time": "O(log N) comparisons"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> data = {10, 20, 30, 30, 40};\nauto it = std::lower_bound(data.begin(), data.end(), 30);\n// *it is 30 at index 2",
    "seeAlso": [
      "std::upper_bound",
      "std::binary_search",
      "std::equal_range"
    ]
  },
  "std::clamp": {
    "symbol": "std::clamp",
    "canonicalSignature": "template <typename T, typename Compare = std::less<>>\nconstexpr const T& clamp(const T& v, const T& lo, const T& hi, Compare comp = {});",
    "summary": "Clamps `v` to the range `[lo, hi]`. If `v` is smaller than `lo`, returns `lo`; if `v` is greater than `hi`, returns `hi`; otherwise returns `v`.",
    "header": "<algorithm>",
    "standard": "C++17",
    "parameters": {
      "v": "Value to clamp.",
      "lo": "Lower boundary.",
      "hi": "Upper boundary."
    },
    "returns": "Reference to `lo` if `v < lo`, reference to `hi` if `hi < v`, otherwise reference to `v`.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/clamp",
    "complexity": {
      "time": "O(1) at most 2 comparisons"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "int health = 150;\nint clamped = std::clamp(health, 0, 100); // 100",
    "seeAlso": [
      "std::min",
      "std::max"
    ]
  }
};

export const algorithmsModule: StlHeaderModule = {
  id: 'algorithms',
  headers: ["<algorithm>","<numeric>"],
  entries: ALGORITHMS_ENTRIES
};
