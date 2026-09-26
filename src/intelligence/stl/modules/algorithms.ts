import { StlDocEntry, StlHeaderModule } from '../types';

export const ALGORITHMS_ENTRIES: Record<string, StlDocEntry> = {
  // --- Non-modifying sequence operations ---
  "std::all_of": {
    "symbol": "std::all_of",
    "canonicalSignature": "template <typename InputIt, typename UnaryPredicate>\nconstexpr bool all_of(InputIt first, InputIt last, UnaryPredicate p);",
    "summary": "Checks if unary predicate p returns true for all elements in the range [first, last). Returns true if the range is empty.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Beginning of the range to examine.",
      "last": "End of the range to examine.",
      "p": "Unary predicate returning true for elements satisfying the condition."
    },
    "returns": "true if p returns true for all elements in the range, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/all_any_none_of",
    "complexity": {
      "time": "At most O(N) predicate evaluations, short-circuiting on the first false"
    },
    "exceptionSafety": "Basic guarantee: if predicate throws, state of sequence is preserved.",
    "example": "std::vector<int> v = {2, 4, 6, 8};\nbool all_even = std::all_of(v.begin(), v.end(), [](int n) { return n % 2 == 0; });\nassert(all_even);",
    "seeAlso": [
      "std::any_of",
      "std::none_of",
      "std::ranges::all_of"
    ]
  },
  "std::any_of": {
    "symbol": "std::any_of",
    "canonicalSignature": "template <typename InputIt, typename UnaryPredicate>\nconstexpr bool any_of(InputIt first, InputIt last, UnaryPredicate p);",
    "summary": "Checks if unary predicate p returns true for at least one element in the range [first, last). Returns false if range is empty.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Beginning of the range to examine.",
      "last": "End of the range to examine.",
      "p": "Unary predicate returning true for elements satisfying the condition."
    },
    "returns": "true if p returns true for at least one element, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/all_any_none_of",
    "complexity": {
      "time": "At most O(N) predicate evaluations, short-circuiting on the first true"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 3, 5, 6};\nbool has_even = std::any_of(v.begin(), v.end(), [](int n) { return n % 2 == 0; });\nassert(has_even);",
    "seeAlso": [
      "std::all_of",
      "std::none_of"
    ]
  },
  "std::none_of": {
    "symbol": "std::none_of",
    "canonicalSignature": "template <typename InputIt, typename UnaryPredicate>\nconstexpr bool none_of(InputIt first, InputIt last, UnaryPredicate p);",
    "summary": "Checks if unary predicate p returns true for no elements in the range [first, last). Returns true if range is empty.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Beginning of the range to examine.",
      "last": "End of the range to examine.",
      "p": "Unary predicate returning true for elements satisfying the condition."
    },
    "returns": "true if p returns false for all elements, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/all_any_none_of",
    "complexity": {
      "time": "At most O(N) predicate evaluations, short-circuiting on the first true"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 3, 5, 7};\nbool none_even = std::none_of(v.begin(), v.end(), [](int n) { return n % 2 == 0; });\nassert(none_even);",
    "seeAlso": [
      "std::all_of",
      "std::any_of"
    ]
  },
  "std::for_each": {
    "symbol": "std::for_each",
    "canonicalSignature": "template <typename InputIt, typename UnaryFunction>\nconstexpr UnaryFunction for_each(InputIt first, InputIt last, UnaryFunction f);",
    "summary": "Applies the given function object f to the result of dereferencing every iterator in the range [first, last), in order.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of the range to apply the function to.",
      "last": "End of the range to apply the function to.",
      "f": "Function object to be applied to the dereferenced iterators."
    },
    "returns": "The function object f.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/for_each",
    "complexity": {
      "time": "Exactly O(N) applications of f where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> nums = {1, 2, 3, 4};\nstd::for_each(nums.begin(), nums.end(), [](int& n) { n *= 2; });\n// nums is now {2, 4, 6, 8}",
    "seeAlso": [
      "std::for_each_n",
      "std::transform"
    ]
  },
  "std::for_each_n": {
    "symbol": "std::for_each_n",
    "canonicalSignature": "template <typename InputIt, typename Size, typename UnaryFunction>\nconstexpr InputIt for_each_n(InputIt first, Size n, UnaryFunction f);",
    "summary": "Applies the given function object f to the first n elements of the sequence starting at first.",
    "header": "<algorithm>",
    "standard": "C++17 / C++20",
    "parameters": {
      "first": "Beginning of the sequence to iterate.",
      "n": "Number of elements to process.",
      "f": "Function object applied to each element."
    },
    "returns": "An iterator equal to first + n.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/for_each_n",
    "complexity": {
      "time": "Exactly O(n) applications of f"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {10, 20, 30, 40};\nstd::for_each_n(v.begin(), 2, [](int& x) { x += 1; });\n// v is now {11, 21, 30, 40}",
    "seeAlso": [
      "std::for_each"
    ]
  },
  "std::count": {
    "symbol": "std::count",
    "canonicalSignature": "template <typename InputIt, typename T>\nconstexpr typename std::iterator_traits<InputIt>::difference_type count(InputIt first, InputIt last, const T& value);",
    "summary": "Counts the number of elements in the range [first, last) that compare equal to value.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of the range.",
      "last": "End of the range.",
      "value": "Value to compare each element against."
    },
    "returns": "The number of elements equal to value.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/count",
    "complexity": {
      "time": "Exactly O(N) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> v = {1, 2, 3, 2, 4, 2};\nauto c = std::count(v.begin(), v.end(), 2); // 3",
    "seeAlso": [
      "std::count_if",
      "std::find"
    ]
  },
  "std::count_if": {
    "symbol": "std::count_if",
    "canonicalSignature": "template <typename InputIt, typename UnaryPredicate>\nconstexpr typename std::iterator_traits<InputIt>::difference_type count_if(InputIt first, InputIt last, UnaryPredicate p);",
    "summary": "Counts elements in the range [first, last) for which the unary predicate p returns true.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of the range.",
      "last": "End of the range.",
      "p": "Unary predicate returning true for matched elements."
    },
    "returns": "The number of elements satisfying the predicate.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/count",
    "complexity": {
      "time": "Exactly O(N) predicate evaluations"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4, 5, 6};\nauto evens = std::count_if(v.begin(), v.end(), [](int x) { return x % 2 == 0; }); // 3",
    "seeAlso": [
      "std::count",
      "std::find_if"
    ]
  },
  "std::mismatch": {
    "symbol": "std::mismatch",
    "canonicalSignature": "template <typename InputIt1, typename InputIt2>\nconstexpr std::pair<InputIt1, InputIt2> mismatch(InputIt1 first1, InputIt1 last1, InputIt2 first2);",
    "summary": "Returns the first mismatching pair of elements from two sequences: one starting at first1 and the other at first2.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Start of the first range.",
      "last1": "End of the first range.",
      "first2": "Start of the second range."
    },
    "returns": "std::pair with iterators to the first mismatched elements in both ranges.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/mismatch",
    "complexity": {
      "time": "At most O(N) comparisons where N = std::distance(first1, last1)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::string s1 = \"apple\";\nstd::string s2 = \"apply\";\nauto [it1, it2] = std::mismatch(s1.begin(), s1.end(), s2.begin());\n// *it1 == 'e', *it2 == 'y'",
    "seeAlso": [
      "std::equal",
      "std::lexicographical_compare"
    ]
  },
  "std::equal": {
    "symbol": "std::equal",
    "canonicalSignature": "template <typename InputIt1, typename InputIt2>\nconstexpr bool equal(InputIt1 first1, InputIt1 last1, InputIt2 first2);",
    "summary": "Returns true if the range [first1, last1) and the range starting at first2 are equal according to element-wise comparison.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Start of the first range.",
      "last1": "End of the first range.",
      "first2": "Start of the second range."
    },
    "returns": "true if both ranges are element-wise equal, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/equal",
    "complexity": {
      "time": "At most O(N) comparisons where N = std::distance(first1, last1)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> a = {1, 2, 3};\nstd::vector<int> b = {1, 2, 3};\nbool eq = std::equal(a.begin(), a.end(), b.begin());\nassert(eq);",
    "seeAlso": [
      "std::mismatch",
      "std::lexicographical_compare"
    ]
  },
  "std::search": {
    "symbol": "std::search",
    "canonicalSignature": "template <typename ForwardIt1, typename ForwardIt2>\nconstexpr ForwardIt1 search(ForwardIt1 first, ForwardIt1 last, ForwardIt2 s_first, ForwardIt2 s_last);",
    "summary": "Searches for the first occurrence of the subsequence [s_first, s_last) in the range [first, last).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range to examine.",
      "last": "End of range to examine.",
      "s_first": "Start of subsequence to search for.",
      "s_last": "End of subsequence to search for."
    },
    "returns": "Iterator to the beginning of the first occurrence of subsequence, or last if not found.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/search",
    "complexity": {
      "time": "O(S * N) worst case, where S = std::distance(s_first, s_last) and N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if element comparison does not throw.",
    "example": "std::string text = \"hello world\";\nstd::string sub = \"world\";\nauto it = std::search(text.begin(), text.end(), sub.begin(), sub.end());\nassert(it != text.end());",
    "seeAlso": [
      "std::find",
      "std::adjacent_find"
    ]
  },
  "std::adjacent_find": {
    "symbol": "std::adjacent_find",
    "canonicalSignature": "template <typename ForwardIt>\nconstexpr ForwardIt adjacent_find(ForwardIt first, ForwardIt last);",
    "summary": "Searches the range [first, last) for the first occurrence of two consecutive equal (or predicate-satisfying) elements.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of the range.",
      "last": "End of the range."
    },
    "returns": "Iterator to the first of the two adjacent equal elements, or last if none found.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/adjacent_find",
    "complexity": {
      "time": "At most O(N) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> v = {1, 3, 3, 5, 7};\nauto it = std::adjacent_find(v.begin(), v.end());\n// *it is 3 at index 1",
    "seeAlso": [
      "std::unique",
      "std::search"
    ]
  },
  "std::find": {
    "symbol": "std::find",
    "canonicalSignature": "template <typename InputIt, typename T>\nconstexpr InputIt find(InputIt first, InputIt last, const T& value);",
    "summary": "Returns the first iterator in the range [first, last) that compares equal to value. Returns last if not found.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Iterator to the initial position in the sequence.",
      "last": "Iterator to the final position in the sequence.",
      "value": "Value to search for."
    },
    "returns": "Iterator to the first element comparing equal to value, or last.",
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
    "summary": "C++20 constrained range find. Finds the first element in [first, last) matching value after applying optional projection.",
    "header": "<algorithm>",
    "standard": "C++20",
    "parameters": {
      "first": "Iterator to the start of the range.",
      "last": "Sentinel or iterator to the end of the range.",
      "value": "Value to compare elements with.",
      "proj": "Projection function applied to elements before comparison."
    },
    "returns": "Iterator to the first element equal to value, or last.",
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
    "summary": "Returns the first iterator in the range [first, last) for which predicate p returns true. Returns last if not found.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Iterator to the start of the range.",
      "last": "Iterator to the end of the range.",
      "p": "Unary predicate which returns true for the required element."
    },
    "returns": "Iterator to the first matching element, or last.",
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

  // --- Modifying sequence operations ---
  "std::copy": {
    "symbol": "std::copy",
    "canonicalSignature": "template <typename InputIt, typename OutputIt>\nconstexpr OutputIt copy(InputIt first, InputIt last, OutputIt d_first);",
    "summary": "Copies the elements in the range [first, last) to another range beginning at d_first.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range to copy.",
      "last": "End of range to copy.",
      "d_first": "Start of destination range."
    },
    "returns": "Output iterator to the element in the destination range past the last copied element.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/copy",
    "complexity": {
      "time": "Exactly O(N) assignments where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> from = {1, 2, 3};\nstd::vector<int> to(3);\nstd::copy(from.begin(), from.end(), to.begin());",
    "seeAlso": [
      "std::copy_if",
      "std::copy_n",
      "std::copy_backward"
    ]
  },
  "std::copy_if": {
    "symbol": "std::copy_if",
    "canonicalSignature": "template <typename InputIt, typename OutputIt, typename UnaryPredicate>\nconstexpr OutputIt copy_if(InputIt first, InputIt last, OutputIt d_first, UnaryPredicate pred);",
    "summary": "Copies elements in the range [first, last) for which pred returns true to destination starting at d_first.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Start of input range.",
      "last": "End of input range.",
      "d_first": "Start of destination range.",
      "pred": "Unary predicate returning true for elements to copy."
    },
    "returns": "Output iterator to the element in the destination range past the last copied element.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/copy",
    "complexity": {
      "time": "Exactly O(N) predicate evaluations and at most O(N) assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> src = {1, 2, 3, 4, 5};\nstd::vector<int> evens;\nstd::copy_if(src.begin(), src.end(), std::back_inserter(evens), [](int n) { return n % 2 == 0; });",
    "seeAlso": [
      "std::copy",
      "std::remove_copy_if"
    ]
  },
  "std::copy_n": {
    "symbol": "std::copy_n",
    "canonicalSignature": "template <typename InputIt, typename Size, typename OutputIt>\nconstexpr OutputIt copy_n(InputIt first, Size count, OutputIt result);",
    "summary": "Copies count elements from range beginning at first to destination starting at result.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Start of range to copy.",
      "count": "Number of elements to copy.",
      "result": "Start of destination range."
    },
    "returns": "Output iterator to the element in the destination range past the last copied element.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/copy_n",
    "complexity": {
      "time": "Exactly O(count) assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> src = {10, 20, 30, 40};\nstd::vector<int> dst;\nstd::copy_n(src.begin(), 2, std::back_inserter(dst)); // {10, 20}",
    "seeAlso": [
      "std::copy"
    ]
  },
  "std::copy_backward": {
    "symbol": "std::copy_backward",
    "canonicalSignature": "template <typename BidirIt1, typename BidirIt2>\nconstexpr BidirIt2 copy_backward(BidirIt1 first, BidirIt1 last, BidirIt2 d_last);",
    "summary": "Copies elements from the range [first, last) into the range ending at d_last in reverse order. Safe for overlapping ranges where destination is to the right.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of source range.",
      "last": "End of source range.",
      "d_last": "End of destination range."
    },
    "returns": "Iterator to the last element copied into the destination range.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/copy_backward",
    "complexity": {
      "time": "Exactly O(N) assignments where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 0, 0};\nstd::copy_backward(v.begin(), v.begin() + 3, v.end());\n// v is now {1, 2, 1, 2, 3}",
    "seeAlso": [
      "std::copy",
      "std::move_backward"
    ]
  },
  "std::move (algorithm)": {
    "symbol": "std::move (algorithm)",
    "canonicalSignature": "template <typename InputIt, typename OutputIt>\nconstexpr OutputIt move(InputIt first, InputIt last, OutputIt d_first);",
    "summary": "Moves elements from the range [first, last) into the destination range beginning at d_first using std::move on each element.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Start of range to move.",
      "last": "End of range to move.",
      "d_first": "Start of destination range."
    },
    "returns": "Output iterator to the element in destination range past the last element moved.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/move",
    "complexity": {
      "time": "Exactly O(N) move assignments where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<std::string> src = {\"alpha\", \"beta\"};\nstd::vector<std::string> dst(2);\nstd::move(src.begin(), src.end(), dst.begin());",
    "seeAlso": [
      "std::copy",
      "std::ranges::move"
    ]
  },
  "std::ranges::move": {
    "symbol": "std::ranges::move",
    "canonicalSignature": "template <std::input_iterator I, std::sentinel_for<I> S, std::weakly_incrementable O>\nconstexpr ranges::move_result<I, O> move(I first, S last, O result);",
    "summary": "C++20 constrained range move algorithm. Moves elements from [first, last) into result.",
    "header": "<algorithm>",
    "standard": "C++20",
    "parameters": {
      "first": "Start of range to move.",
      "last": "Sentinel or end of input range.",
      "result": "Start of destination range."
    },
    "returns": "ranges::move_result with iterator equal to last and output iterator past the last moved element.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/ranges/move",
    "complexity": {
      "time": "Exactly O(N) move assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<std::unique_ptr<int>> src, dst;\nsrc.push_back(std::make_unique<int>(42));\nstd::ranges::move(src, std::back_inserter(dst));",
    "seeAlso": [
      "std::move (algorithm)",
      "std::copy"
    ]
  },
  "std::fill": {
    "symbol": "std::fill",
    "canonicalSignature": "template <typename ForwardIt, typename T>\nconstexpr void fill(ForwardIt first, ForwardIt last, const T& value);",
    "summary": "Assigns the given value to every element in the range [first, last).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range to fill.",
      "last": "End of range to fill.",
      "value": "Value to assign to each element."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/fill",
    "complexity": {
      "time": "Exactly O(N) assignments where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v(5);\nstd::fill(v.begin(), v.end(), -1); // {-1, -1, -1, -1, -1}",
    "seeAlso": [
      "std::fill_n",
      "std::generate"
    ]
  },
  "std::fill_n": {
    "symbol": "std::fill_n",
    "canonicalSignature": "template <typename OutputIt, typename Size, typename T>\nconstexpr OutputIt fill_n(OutputIt first, Size count, const T& value);",
    "summary": "Assigns the given value to the first count elements of the sequence starting at first.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of sequence.",
      "count": "Number of elements to assign.",
      "value": "Value to assign."
    },
    "returns": "Output iterator to the element past the last assigned value.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/fill_n",
    "complexity": {
      "time": "Exactly O(count) assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {0, 0, 0, 0};\nstd::fill_n(v.begin(), 2, 7); // {7, 7, 0, 0}",
    "seeAlso": [
      "std::fill",
      "std::generate"
    ]
  },
  "std::generate": {
    "symbol": "std::generate",
    "canonicalSignature": "template <typename ForwardIt, typename Generator>\nconstexpr void generate(ForwardIt first, ForwardIt last, Generator g);",
    "summary": "Assigns each element in the range [first, last) a value generated by successive invocations of generator function object g.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range.",
      "last": "End of range.",
      "g": "Generator function object callable with no arguments."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/generate",
    "complexity": {
      "time": "Exactly O(N) invocations of g and assignments where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v(5);\nint n = 1;\nstd::generate(v.begin(), v.end(), [&n]() { return n++; }); // {1, 2, 3, 4, 5}",
    "seeAlso": [
      "std::fill",
      "std::accumulate"
    ]
  },
  "std::remove": {
    "symbol": "std::remove",
    "canonicalSignature": "template <typename ForwardIt, typename T>\nconstexpr ForwardIt remove(ForwardIt first, ForwardIt last, const T& value);",
    "summary": "Removes all elements that compare equal to value from the range [first, last) by shifting retained elements left. Does not resize container (use erase-remove idiom or std::erase).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range.",
      "last": "End of range.",
      "value": "Value to remove."
    },
    "returns": "Past-the-end iterator for the new range of retained elements.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/remove",
    "complexity": {
      "time": "Exactly O(N) comparisons and at most O(N) move assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 2, 4};\nv.erase(std::remove(v.begin(), v.end(), 2), v.end()); // {1, 3, 4}",
    "seeAlso": [
      "std::remove_if",
      "std::unique"
    ]
  },
  "std::remove_if": {
    "symbol": "std::remove_if",
    "canonicalSignature": "template <typename ForwardIt, typename UnaryPredicate>\nconstexpr ForwardIt remove_if(ForwardIt first, ForwardIt last, UnaryPredicate p);",
    "summary": "Removes all elements in [first, last) for which predicate p returns true by shifting remaining elements left.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range.",
      "last": "End of range.",
      "p": "Unary predicate returning true for elements to remove."
    },
    "returns": "Past-the-end iterator for the new range of retained elements.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/remove",
    "complexity": {
      "time": "Exactly O(N) predicate evaluations and at most O(N) move assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4, 5};\nv.erase(std::remove_if(v.begin(), v.end(), [](int n) { return n % 2 == 0; }), v.end()); // {1, 3, 5}",
    "seeAlso": [
      "std::remove",
      "std::unique"
    ]
  },
  "std::replace": {
    "symbol": "std::replace",
    "canonicalSignature": "template <typename ForwardIt, typename T>\nconstexpr void replace(ForwardIt first, ForwardIt last, const T& old_value, const T& new_value);",
    "summary": "Replaces all elements in [first, last) that compare equal to old_value with new_value.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range.",
      "last": "End of range.",
      "old_value": "Value to be replaced.",
      "new_value": "Value to write."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/replace",
    "complexity": {
      "time": "Exactly O(N) comparisons and at most O(N) assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 2};\nstd::replace(v.begin(), v.end(), 2, 99); // {1, 99, 3, 99}",
    "seeAlso": [
      "std::replace_if"
    ]
  },
  "std::replace_if": {
    "symbol": "std::replace_if",
    "canonicalSignature": "template <typename ForwardIt, typename UnaryPredicate, typename T>\nconstexpr void replace_if(ForwardIt first, ForwardIt last, UnaryPredicate p, const T& new_value);",
    "summary": "Replaces all elements in [first, last) for which predicate p returns true with new_value.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range.",
      "last": "End of range.",
      "p": "Unary predicate returning true for elements to replace.",
      "new_value": "Value to write."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/replace",
    "complexity": {
      "time": "Exactly O(N) predicate evaluations and at most O(N) assignments"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4};\nstd::replace_if(v.begin(), v.end(), [](int n) { return n < 3; }, 0); // {0, 0, 3, 4}",
    "seeAlso": [
      "std::replace"
    ]
  },
  "std::reverse": {
    "symbol": "std::reverse",
    "canonicalSignature": "template <typename BidirIt>\nconstexpr void reverse(BidirIt first, BidirIt last);",
    "summary": "Reverses the order of the elements in the range [first, last) in place.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Start of range to reverse.",
      "last": "End of range to reverse."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/reverse",
    "complexity": {
      "time": "Exactly O(N / 2) swaps where N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if element swap does not throw.",
    "example": "std::vector<int> v = {1, 2, 3, 4};\nstd::reverse(v.begin(), v.end()); // {4, 3, 2, 1}",
    "seeAlso": [
      "std::rotate"
    ]
  },
  "std::rotate": {
    "symbol": "std::rotate",
    "canonicalSignature": "template <typename ForwardIt>\nconstexpr ForwardIt rotate(ForwardIt first, ForwardIt middle, ForwardIt last);",
    "summary": "Performs a left rotation on a range of elements. Swaps elements such that middle becomes the first element and first becomes the last element.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of the original range.",
      "middle": "Element that should become the first element in the rotated range.",
      "last": "End of the original range."
    },
    "returns": "An iterator pointing to the new position of the first element (first + (last - middle)).",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/rotate",
    "complexity": {
      "time": "At most linear O(N) swaps where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4, 5};\nstd::rotate(v.begin(), v.begin() + 2, v.end()); // {3, 4, 5, 1, 2}",
    "seeAlso": [
      "std::reverse"
    ]
  },
  "std::shuffle": {
    "symbol": "std::shuffle",
    "canonicalSignature": "template <typename RandomIt, typename URBG>\nvoid shuffle(RandomIt first, RandomIt last, URBG&& g);",
    "summary": "Reorders the elements in the given range [first, last) such that each possible permutation of those elements has equal probability of appearance, using uniform random bit generator g.",
    "header": "<algorithm>",
    "standard": "C++11",
    "parameters": {
      "first": "Start of range.",
      "last": "End of range.",
      "g": "Uniform random bit generator (e.g. std::mt19937)."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/random_shuffle",
    "complexity": {
      "time": "Linear O(N) swaps where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4, 5};\nstd::random_device rd;\nstd::mt19937 g(rd());\nstd::shuffle(v.begin(), v.end(), g);",
    "seeAlso": [
      "std::rotate",
      "std::reverse"
    ]
  },
  "std::unique": {
    "symbol": "std::unique",
    "canonicalSignature": "template <typename ForwardIt>\nconstexpr ForwardIt unique(ForwardIt first, ForwardIt last);",
    "summary": "Eliminates all except the first element from every consecutive group of equivalent elements from the range [first, last). Commonly used on sorted ranges with erase-remove idiom.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "last": "End of range."
    },
    "returns": "Forward iterator past the new end of the unique elements range.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/unique",
    "complexity": {
      "time": "At most O(N) comparisons and move assignments where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 1, 2, 2, 3, 3, 3, 4};\nv.erase(std::unique(v.begin(), v.end()), v.end()); // {1, 2, 3, 4}",
    "seeAlso": [
      "std::adjacent_find",
      "std::remove"
    ]
  },
  "std::transform": {
    "symbol": "std::transform",
    "canonicalSignature": "template <typename InputIt, typename OutputIt, typename UnaryOperation>\nconstexpr OutputIt transform(InputIt first1, InputIt last1, OutputIt d_first, UnaryOperation unary_op);",
    "summary": "Applies the given function unary_op to a range and stores the result in another range beginning at d_first.",
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
    "summary": "C++20 constrained range transform. Applies function op to range [first1, last1) and writes output into result. Supports projections.",
    "header": "<algorithm>",
    "standard": "C++20",
    "parameters": {
      "first1": "Beginning of input range.",
      "last1": "Sentinel or end of input range.",
      "result": "Output iterator for transformed items.",
      "op": "Transforming function.",
      "proj": "Optional projection function."
    },
    "returns": "ranges::transform_result containing an input iterator equal to last1 and output iterator past the last element written.",
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

  // --- Partitioning & Sorting operations ---
  "std::is_partitioned": {
    "symbol": "std::is_partitioned",
    "canonicalSignature": "template <typename InputIt, typename UnaryPredicate>\nconstexpr bool is_partitioned(InputIt first, InputIt last, UnaryPredicate p);",
    "summary": "Returns true if all elements in the range [first, last) that satisfy the predicate p appear before all elements that do not.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "last": "End of range.",
      "p": "Unary predicate."
    },
    "returns": "true if the range is partitioned according to p, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/is_partitioned",
    "complexity": {
      "time": "At most O(N) predicate evaluations where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {2, 4, 1, 3};\nbool part = std::is_partitioned(v.begin(), v.end(), [](int n) { return n % 2 == 0; });\nassert(part);",
    "seeAlso": [
      "std::partition"
    ]
  },
  "std::partition": {
    "symbol": "std::partition",
    "canonicalSignature": "template <typename ForwardIt, typename UnaryPredicate>\nconstexpr ForwardIt partition(ForwardIt first, ForwardIt last, UnaryPredicate p);",
    "summary": "Reorders the elements in the range [first, last) in such a way that all elements for which predicate p returns true precede elements for which p returns false.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range to partition.",
      "last": "End of range.",
      "p": "Unary predicate."
    },
    "returns": "Iterator to the first element of the second group (where p returns false).",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/partition",
    "complexity": {
      "time": "Linear O(N) predicate applications and at most O(N) swaps"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4, 5, 6};\nauto it = std::partition(v.begin(), v.end(), [](int n) { return n % 2 == 0; });\n// v has all even numbers before it, all odd numbers from it to end",
    "seeAlso": [
      "std::is_partitioned",
      "std::stable_sort"
    ]
  },
  "std::is_sorted": {
    "symbol": "std::is_sorted",
    "canonicalSignature": "template <typename ForwardIt>\nconstexpr bool is_sorted(ForwardIt first, ForwardIt last);",
    "summary": "Checks whether the elements in range [first, last) are sorted in non-descending order.",
    "header": "<algorithm>",
    "standard": "C++11 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "last": "End of range."
    },
    "returns": "true if the range is sorted, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/is_sorted",
    "complexity": {
      "time": "Linear O(N) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> v = {1, 2, 3, 5};\nassert(std::is_sorted(v.begin(), v.end()));",
    "seeAlso": [
      "std::sort",
      "std::partial_sort"
    ]
  },
  "std::sort": {
    "symbol": "std::sort",
    "canonicalSignature": "template <typename RandomIt, typename Compare = std::less<>>\nconstexpr void sort(RandomIt first, RandomIt last, Compare comp = {});",
    "summary": "Sorts elements in range [first, last) into ascending order using introsort (O(N log N) average and worst-case).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Random access iterator to the beginning of the range.",
      "last": "Random access iterator to the end of the range.",
      "comp": "Comparison functor object."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/sort",
    "complexity": {
      "time": "O(N log N) comparisons"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {5, 2, 8, 1, 9};\nstd::sort(v.begin(), v.end());\n// v is now {1, 2, 5, 8, 9}",
    "seeAlso": [
      "std::ranges::sort",
      "std::stable_sort",
      "std::partial_sort"
    ]
  },
  "std::ranges::sort": {
    "symbol": "std::ranges::sort",
    "canonicalSignature": "template <std::random_access_iterator I, std::sentinel_for<I> S, typename Comp = ranges::less, typename Proj = std::identity>\nconstexpr I sort(I first, S last, Comp comp = {}, Proj proj = {});",
    "summary": "C++20 constrained range sort. Sorts elements in the range [first, last) in non-descending order using introsort (O(N log N)). Supports projections.",
    "header": "<algorithm>",
    "standard": "C++20",
    "parameters": {
      "first": "Iterator pointing to the beginning of the sequence to sort.",
      "last": "Sentinel or iterator pointing to the end of the sequence.",
      "comp": "Comparison predicate that returns true if first argument is ordered before second.",
      "proj": "Projection function applied to each element before comparison."
    },
    "returns": "An iterator equal to last.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/ranges/sort",
    "complexity": {
      "time": "O(N log N) comparisons, guaranteed worst-case via Introsort"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "struct Player { std::string name; int score; };\nstd::vector<Player> roster = {{\"Ada\", 90}, {\"Bob\", 99}};\nstd::ranges::sort(roster, std::greater<>{}, &Player::score); // Sorted by score descending",
    "seeAlso": [
      "std::sort",
      "std::stable_sort"
    ]
  },
  "std::partial_sort": {
    "symbol": "std::partial_sort",
    "canonicalSignature": "template <typename RandomIt>\nconstexpr void partial_sort(RandomIt first, RandomIt middle, RandomIt last);",
    "summary": "Rearranges elements such that the range [first, middle) contains the sorted middle - first smallest elements of the entire range [first, last).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "middle": "Iterator defining the boundary up to which elements will be sorted.",
      "last": "End of range."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/partial_sort",
    "complexity": {
      "time": "O(N log K) comparisons where N = std::distance(first, last) and K = std::distance(first, middle)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {9, 1, 5, 3, 7, 2};\nstd::partial_sort(v.begin(), v.begin() + 3, v.end());\n// v[0..2] is {1, 2, 3}",
    "seeAlso": [
      "std::nth_element",
      "std::sort"
    ]
  },
  "std::stable_sort": {
    "symbol": "std::stable_sort",
    "canonicalSignature": "template <typename RandomIt>\nvoid stable_sort(RandomIt first, RandomIt last);",
    "summary": "Sorts the elements in the range [first, last) in non-descending order, while preserving the relative order of equivalent elements.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "last": "End of range."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/stable_sort",
    "complexity": {
      "time": "O(N log N) if extra memory available, O(N log^2 N) otherwise",
      "space": "O(N) temporary buffer"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "struct Task { int priority; std::string name; };\nstd::vector<Task> tasks = {{1, \"t1\"}, {2, \"t2\"}, {1, \"t3\"}};\nstd::stable_sort(tasks.begin(), tasks.end(), [](const auto& a, const auto& b) { return a.priority < b.priority; });\n// t1 remains before t3",
    "seeAlso": [
      "std::sort",
      "std::partial_sort"
    ]
  },
  "std::nth_element": {
    "symbol": "std::nth_element",
    "canonicalSignature": "template <typename RandomIt>\nconstexpr void nth_element(RandomIt first, RandomIt nth, RandomIt last);",
    "summary": "Rearranges elements in [first, last) such that the element pointed at by nth is changed to whatever element would occur in that position if the range were fully sorted.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "nth": "Iterator to position to be placed correctly.",
      "last": "End of range."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/nth_element",
    "complexity": {
      "time": "Linear O(N) average comparisons (Introselect algorithm)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {5, 6, 4, 3, 2, 6, 7, 9, 3};\nauto m = v.begin() + v.size() / 2;\nstd::nth_element(v.begin(), m, v.end());\n// *m is the median element",
    "seeAlso": [
      "std::partial_sort",
      "std::sort"
    ]
  },
  "std::binary_search": {
    "symbol": "std::binary_search",
    "canonicalSignature": "template <typename ForwardIt, typename T, typename Compare = std::less<>>\nconstexpr bool binary_search(ForwardIt first, ForwardIt last, const T& value, Compare comp = {});",
    "summary": "Checks if an element equivalent to value appears within the sorted range [first, last). Range MUST be partitioned/sorted.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of sorted range.",
      "last": "End of sorted range.",
      "value": "Value to search for.",
      "comp": "Comparison function."
    },
    "returns": "true if an element equal to value is found, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/binary_search",
    "complexity": {
      "time": "O(log N) comparisons for random access iterators; O(N) iterator hops for forward iterators"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> sorted = {1, 3, 5, 7, 9};\nif (std::binary_search(sorted.begin(), sorted.end(), 5)) {\n    std::println(\"Found 5!\");\n}",
    "seeAlso": [
      "std::lower_bound",
      "std::upper_bound",
      "std::equal_range"
    ]
  },
  "std::lower_bound": {
    "symbol": "std::lower_bound",
    "canonicalSignature": "template <typename ForwardIt, typename T, typename Compare = std::less<>>\nconstexpr ForwardIt lower_bound(ForwardIt first, ForwardIt last, const T& value, Compare comp = {});",
    "summary": "Returns an iterator pointing to the first element in the sorted range [first, last) that does NOT compare less than value (i.e. >= value).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of sorted range.",
      "last": "End of sorted range.",
      "value": "Value to compare elements to.",
      "comp": "Comparison function."
    },
    "returns": "Iterator to the first element >= value, or last.",
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
  "std::upper_bound": {
    "symbol": "std::upper_bound",
    "canonicalSignature": "template <typename ForwardIt, typename T, typename Compare = std::less<>>\nconstexpr ForwardIt upper_bound(ForwardIt first, ForwardIt last, const T& value, Compare comp = {});",
    "summary": "Returns an iterator pointing to the first element in the sorted range [first, last) that compares greater than value (i.e. > value).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of sorted range.",
      "last": "End of sorted range.",
      "value": "Value to compare elements against.",
      "comp": "Comparison function."
    },
    "returns": "Iterator to the first element > value, or last.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/upper_bound",
    "complexity": {
      "time": "O(log N) comparisons"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> data = {10, 20, 30, 30, 40};\nauto it = std::upper_bound(data.begin(), data.end(), 30);\n// *it is 40 at index 4",
    "seeAlso": [
      "std::lower_bound",
      "std::equal_range",
      "std::binary_search"
    ]
  },
  "std::equal_range": {
    "symbol": "std::equal_range",
    "canonicalSignature": "template <typename ForwardIt, typename T>\nconstexpr std::pair<ForwardIt, ForwardIt> equal_range(ForwardIt first, ForwardIt last, const T& value);",
    "summary": "Returns a range containing all elements equivalent to value in the sorted range [first, last). Returns pair of (lower_bound, upper_bound).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of sorted range.",
      "last": "End of sorted range.",
      "value": "Value to search for."
    },
    "returns": "std::pair of iterators defining the half-open subrange [lower, upper) of equal elements.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/equal_range",
    "complexity": {
      "time": "O(log N) comparisons for random access iterators"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> data = {1, 2, 2, 2, 3};\nauto [low, high] = std::equal_range(data.begin(), data.end(), 2);\n// [low, high) spans the three 2s",
    "seeAlso": [
      "std::lower_bound",
      "std::upper_bound",
      "std::binary_search"
    ]
  },
  "std::merge": {
    "symbol": "std::merge",
    "canonicalSignature": "template <typename InputIt1, typename InputIt2, typename OutputIt>\nconstexpr OutputIt merge(InputIt1 first1, InputIt1 last1, InputIt2 first2, InputIt2 last2, OutputIt d_first);",
    "summary": "Merges two sorted ranges [first1, last1) and [first2, last2) into one sorted range beginning at d_first.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Start of first sorted range.",
      "last1": "End of first sorted range.",
      "first2": "Start of second sorted range.",
      "last2": "End of second sorted range.",
      "d_first": "Start of destination range."
    },
    "returns": "Output iterator to the element in destination past the last merged element.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/merge",
    "complexity": {
      "time": "At most O(N1 + N2) comparisons"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> a = {1, 3, 5};\nstd::vector<int> b = {2, 4, 6};\nstd::vector<int> out;\nstd::merge(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(out)); // {1, 2, 3, 4, 5, 6}",
    "seeAlso": [
      "std::set_union",
      "std::sort"
    ]
  },
  "std::includes": {
    "symbol": "std::includes",
    "canonicalSignature": "template <typename InputIt1, typename InputIt2>\nconstexpr bool includes(InputIt1 first1, InputIt1 last1, InputIt2 first2, InputIt2 last2);",
    "summary": "Returns true if the sorted range [first2, last2) is a subsequence (subset) of the sorted range [first1, last1).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Start of first sorted range.",
      "last1": "End of first sorted range.",
      "first2": "Start of second sorted range.",
      "last2": "End of second sorted range."
    },
    "returns": "true if second sorted range is a subset of the first, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/includes",
    "complexity": {
      "time": "At most O(2 * (N1 + N2)) comparisons"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> set = {1, 2, 3, 4, 5};\nstd::vector<int> sub = {2, 4};\nbool has_all = std::includes(set.begin(), set.end(), sub.begin(), sub.end()); // true",
    "seeAlso": [
      "std::set_intersection",
      "std::set_union"
    ]
  },
  "std::set_union": {
    "symbol": "std::set_union",
    "canonicalSignature": "template <typename InputIt1, typename InputIt2, typename OutputIt>\nconstexpr OutputIt set_union(InputIt1 first1, InputIt1 last1, InputIt2 first2, InputIt2 last2, OutputIt d_first);",
    "summary": "Constructs a sorted union of two sorted ranges [first1, last1) and [first2, last2), copying elements present in either range into d_first.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Start of first sorted range.",
      "last1": "End of first sorted range.",
      "first2": "Start of second sorted range.",
      "last2": "End of second sorted range.",
      "d_first": "Start of destination range."
    },
    "returns": "Output iterator to past the last element in destination.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/set_union",
    "complexity": {
      "time": "At most O(2 * (N1 + N2) - 1) comparisons"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> a = {1, 2, 4};\nstd::vector<int> b = {2, 3, 5};\nstd::vector<int> out;\nstd::set_union(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(out)); // {1, 2, 3, 4, 5}",
    "seeAlso": [
      "std::set_intersection",
      "std::set_difference",
      "std::merge"
    ]
  },
  "std::set_intersection": {
    "symbol": "std::set_intersection",
    "canonicalSignature": "template <typename InputIt1, typename InputIt2, typename OutputIt>\nconstexpr OutputIt set_intersection(InputIt1 first1, InputIt1 last1, InputIt2 first2, InputIt2 last2, OutputIt d_first);",
    "summary": "Constructs a sorted intersection of two sorted ranges, copying elements found in both ranges into d_first.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Start of first sorted range.",
      "last1": "End of first sorted range.",
      "first2": "Start of second sorted range.",
      "last2": "End of second sorted range.",
      "d_first": "Start of destination range."
    },
    "returns": "Output iterator to past the last element in destination.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/set_intersection",
    "complexity": {
      "time": "At most O(2 * (N1 + N2) - 1) comparisons"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> a = {1, 2, 3, 4};\nstd::vector<int> b = {2, 4, 6};\nstd::vector<int> out;\nstd::set_intersection(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(out)); // {2, 4}",
    "seeAlso": [
      "std::set_union",
      "std::set_difference"
    ]
  },
  "std::set_difference": {
    "symbol": "std::set_difference",
    "canonicalSignature": "template <typename InputIt1, typename InputIt2, typename OutputIt>\nconstexpr OutputIt set_difference(InputIt1 first1, InputIt1 last1, InputIt2 first2, InputIt2 last2, OutputIt d_first);",
    "summary": "Copies the elements from the sorted range [first1, last1) which are not found in the sorted range [first2, last2) into d_first.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first1": "Start of first sorted range.",
      "last1": "End of first sorted range.",
      "first2": "Start of second sorted range.",
      "last2": "End of second sorted range.",
      "d_first": "Start of destination range."
    },
    "returns": "Output iterator to past the last element in destination.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/set_difference",
    "complexity": {
      "time": "At most O(2 * (N1 + N2) - 1) comparisons"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> a = {1, 2, 3, 4};\nstd::vector<int> b = {2, 4};\nstd::vector<int> out;\nstd::set_difference(a.begin(), a.end(), b.begin(), b.end(), std::back_inserter(out)); // {1, 3}",
    "seeAlso": [
      "std::set_intersection",
      "std::set_union"
    ]
  },

  // --- Heap operations ---
  "std::make_heap": {
    "symbol": "std::make_heap",
    "canonicalSignature": "template <typename RandomIt>\nconstexpr void make_heap(RandomIt first, RandomIt last);",
    "summary": "Constructs a max heap in the range [first, last) in place in linear time.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range to convert to heap.",
      "last": "End of range."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/make_heap",
    "complexity": {
      "time": "Linear O(N) comparisons at most 3*N where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {3, 1, 4, 1, 5, 9};\nstd::make_heap(v.begin(), v.end());\n// v.front() is 9 (maximum element)",
    "seeAlso": [
      "std::push_heap",
      "std::pop_heap"
    ]
  },
  "std::push_heap": {
    "symbol": "std::push_heap",
    "canonicalSignature": "template <typename RandomIt>\nconstexpr void push_heap(RandomIt first, RandomIt last);",
    "summary": "Inserts the element at last - 1 into the max heap defined by [first, last - 1).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range including newly added element.",
      "last": "End of range."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/push_heap",
    "complexity": {
      "time": "O(log N) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {9, 5, 4, 1};\nv.push_back(10);\nstd::push_heap(v.begin(), v.end());\n// 10 is now at v.front()",
    "seeAlso": [
      "std::pop_heap",
      "std::make_heap"
    ]
  },
  "std::pop_heap": {
    "symbol": "std::pop_heap",
    "canonicalSignature": "template <typename RandomIt>\nconstexpr void pop_heap(RandomIt first, RandomIt last);",
    "summary": "Swaps the maximum element at first to last - 1 and restores the max heap property in [first, last - 1).",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of heap range.",
      "last": "End of heap range."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/pop_heap",
    "complexity": {
      "time": "O(log N) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {9, 5, 4, 1};\nstd::pop_heap(v.begin(), v.end());\nint top = v.back(); // 9\nv.pop_back();",
    "seeAlso": [
      "std::push_heap",
      "std::make_heap"
    ]
  },

  // --- Minimum / Maximum operations ---
  "std::min": {
    "symbol": "std::min",
    "canonicalSignature": "template <typename T>\nconstexpr const T& min(const T& a, const T& b);\ntemplate <typename T>\nconstexpr T min(std::initializer_list<T> ilist);",
    "summary": "Returns the smaller of the given values a and b (or the smallest in an initializer list).",
    "header": "<algorithm>",
    "standard": "C++98 / C++14",
    "parameters": {
      "a": "First value.",
      "b": "Second value."
    },
    "returns": "The smaller value (or a if equivalent).",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/min",
    "complexity": {
      "time": "O(1) exactly 1 comparison (or O(N) for initializer list)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "int m = std::min(10, 20); // 10\nint list_min = std::min({4, 1, 8, 3}); // 1",
    "seeAlso": [
      "std::max",
      "std::minmax",
      "std::clamp"
    ]
  },
  "std::max": {
    "symbol": "std::max",
    "canonicalSignature": "template <typename T>\nconstexpr const T& max(const T& a, const T& b);\ntemplate <typename T>\nconstexpr T max(std::initializer_list<T> ilist);",
    "summary": "Returns the greater of the given values a and b (or the greatest in an initializer list).",
    "header": "<algorithm>",
    "standard": "C++98 / C++14",
    "parameters": {
      "a": "First value.",
      "b": "Second value."
    },
    "returns": "The greater value (or a if equivalent).",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/max",
    "complexity": {
      "time": "O(1) exactly 1 comparison (or O(N) for initializer list)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "int m = std::max(10, 20); // 20\nint list_max = std::max({4, 1, 8, 3}); // 8",
    "seeAlso": [
      "std::min",
      "std::minmax",
      "std::clamp"
    ]
  },
  "std::minmax": {
    "symbol": "std::minmax",
    "canonicalSignature": "template <typename T>\nconstexpr std::pair<const T&, const T&> minmax(const T& a, const T& b);\ntemplate <typename T>\nconstexpr std::pair<T, T> minmax(std::initializer_list<T> ilist);",
    "summary": "Returns a pair with the smaller of a and b as first and the greater as second.",
    "header": "<algorithm>",
    "standard": "C++11 / C++14",
    "parameters": {
      "a": "First value.",
      "b": "Second value."
    },
    "returns": "std::pair where first is the minimum and second is the maximum.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/minmax",
    "complexity": {
      "time": "O(1) exactly 1 comparison (or O(N) for initializer list)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "auto [lo, hi] = std::minmax(15, 42);\nassert(lo == 15 && hi == 42);",
    "seeAlso": [
      "std::min",
      "std::max",
      "std::min_element"
    ]
  },
  "std::min_element": {
    "symbol": "std::min_element",
    "canonicalSignature": "template <typename ForwardIt>\nconstexpr ForwardIt min_element(ForwardIt first, ForwardIt last);",
    "summary": "Finds the smallest element in the range [first, last). Returns last if range is empty.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "last": "End of range."
    },
    "returns": "Iterator to the smallest element in the range.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/min_element",
    "complexity": {
      "time": "Exactly max(N - 1, 0) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> v = {3, 1, 4, 1, 5};\nauto it = std::min_element(v.begin(), v.end());\n// *it == 1",
    "seeAlso": [
      "std::max_element",
      "std::min"
    ]
  },
  "std::max_element": {
    "symbol": "std::max_element",
    "canonicalSignature": "template <typename ForwardIt>\nconstexpr ForwardIt max_element(ForwardIt first, ForwardIt last);",
    "summary": "Finds the greatest element in the range [first, last). Returns last if range is empty.",
    "header": "<algorithm>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range.",
      "last": "End of range."
    },
    "returns": "Iterator to the greatest element in the range.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/max_element",
    "complexity": {
      "time": "Exactly max(N - 1, 0) comparisons where N = std::distance(first, last)"
    },
    "exceptionSafety": "No-throw guarantee if comparison does not throw.",
    "example": "std::vector<int> v = {3, 1, 4, 1, 5};\nauto it = std::max_element(v.begin(), v.end());\n// *it == 5",
    "seeAlso": [
      "std::min_element",
      "std::max"
    ]
  },
  "std::clamp": {
    "symbol": "std::clamp",
    "canonicalSignature": "template <typename T, typename Compare = std::less<>>\nconstexpr const T& clamp(const T& v, const T& lo, const T& hi, Compare comp = {});",
    "summary": "Clamps v to the range [lo, hi]. If v is smaller than lo, returns lo; if v is greater than hi, returns hi; otherwise returns v.",
    "header": "<algorithm>",
    "standard": "C++17",
    "parameters": {
      "v": "Value to clamp.",
      "lo": "Lower boundary.",
      "hi": "Upper boundary."
    },
    "returns": "Reference to lo if v < lo, reference to hi if hi < v, otherwise reference to v.",
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
  },

  // --- Numeric algorithms ---
  "std::accumulate": {
    "symbol": "std::accumulate",
    "canonicalSignature": "template <typename InputIt, typename T, typename BinaryOperation = std::plus<>>\nconstexpr T accumulate(InputIt first, InputIt last, T init, BinaryOperation op = {});",
    "summary": "Computes the sum (or fold reduction using op) of the given value init and the elements in the range [first, last).",
    "header": "<numeric>",
    "standard": "C++98 / C++20",
    "parameters": {
      "first": "Beginning of range to accumulate.",
      "last": "End of range to accumulate.",
      "init": "Initial accumulator value.",
      "op": "Binary operation function taking accumulator and current element."
    },
    "returns": "The accumulated result value of type T.",
    "docUrl": "https://en.cppreference.com/w/cpp/algorithm/accumulate",
    "complexity": {
      "time": "Linear O(N) where N = std::distance(first, last)"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> nums = {1, 2, 3, 4};\nint sum = std::accumulate(nums.begin(), nums.end(), 0); // 10\nint prod = std::accumulate(nums.begin(), nums.end(), 1, std::multiplies<>{}); // 24",
    "seeAlso": [
      "std::reduce",
      "std::transform"
    ]
  }
};

export const algorithmsModule: StlHeaderModule = {
  id: 'algorithms',
  headers: ["<algorithm>", "<numeric>"],
  entries: ALGORITHMS_ENTRIES
};
