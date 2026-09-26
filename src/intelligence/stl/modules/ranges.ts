import { StlDocEntry, StlHeaderModule } from '../types';

export const RANGES_ENTRIES: Record<string, StlDocEntry> = {
  "std::views::all": {
    "symbol": "std::views::all",
    "canonicalSignature": "inline constexpr /* unspecified */ all;",
    "summary": "Range adaptor object that takes a range and returns a view of it (wrapping non-views in std::ranges::ref_view or std::ranges::subrange).",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "r": "Range or container to convert into a view."
    },
    "returns": "A view covering all elements of the range.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/all_view",
    "complexity": {
      "time": "O(1)"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {1, 2, 3};\nauto view = std::views::all(v);",
    "seeAlso": [
      "std::ranges::subrange",
      "std::ranges::ref_view"
    ]
  },
  "std::views::filter": {
    "symbol": "std::views::filter",
    "canonicalSignature": "inline constexpr /* unspecified */ filter;",
    "summary": "Range adaptor closure object that produces a view of elements in a range that satisfy a unary predicate.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "pred": "Unary predicate determining whether an element is included in the resulting view."
    },
    "returns": "std::ranges::filter_view presenting only elements where pred returns true.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/filter_view",
    "complexity": {
      "time": "O(1) view construction; O(N) traversal evaluating predicate for candidate elements"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> nums = {1, 2, 3, 4, 5, 6};\nauto evens = nums | std::views::filter([](int n) { return n % 2 == 0; });",
    "seeAlso": [
      "std::views::transform",
      "std::views::take_while"
    ]
  },
  "std::views::transform": {
    "symbol": "std::views::transform",
    "canonicalSignature": "inline constexpr /* unspecified */ transform;",
    "summary": "Range adaptor closure object that lazily applies a unary transformation function to each element of a range upon dereference.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "f": "Unary function applied to each element when dereferenced."
    },
    "returns": "std::ranges::transform_view lazily evaluating f for each element.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/transform_view",
    "complexity": {
      "time": "O(1) view construction; O(1) per element access"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> nums = {1, 2, 3};\nauto squared = nums | std::views::transform([](int x) { return x * x; });",
    "seeAlso": [
      "std::views::filter",
      "std::ranges::transform"
    ]
  },
  "std::views::take": {
    "symbol": "std::views::take",
    "canonicalSignature": "inline constexpr /* unspecified */ take;",
    "summary": "Range adaptor closure object that produces a view consisting of the first count elements of a range (or fewer if the range has fewer elements).",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "count": "Maximum number of elements to include in the view."
    },
    "returns": "std::ranges::take_view containing at most count elements.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/take_view",
    "complexity": {
      "time": "O(1) view construction"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4, 5};\nauto first_three = v | std::views::take(3); // 1, 2, 3",
    "seeAlso": [
      "std::views::take_while",
      "std::views::drop"
    ]
  },
  "std::views::take_while": {
    "symbol": "std::views::take_while",
    "canonicalSignature": "inline constexpr /* unspecified */ take_while;",
    "summary": "Range adaptor closure object that produces a view of elements starting from the first element up to, but not including, the first element for which the predicate returns false.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "pred": "Unary predicate applied to elements in the range."
    },
    "returns": "std::ranges::take_while_view stopping at the first element where pred returns false.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/take_while_view",
    "complexity": {
      "time": "O(1) construction; O(N) traversal"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {1, 2, -1, 3};\nauto pos = v | std::views::take_while([](int n) { return n > 0; }); // 1, 2",
    "seeAlso": [
      "std::views::take",
      "std::views::drop_while"
    ]
  },
  "std::views::drop": {
    "symbol": "std::views::drop",
    "canonicalSignature": "inline constexpr /* unspecified */ drop;",
    "summary": "Range adaptor closure object that produces a view consisting of all elements of a range except the first count elements.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "count": "Number of initial elements to skip."
    },
    "returns": "std::ranges::drop_view excluding the first count elements.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/drop_view",
    "complexity": {
      "time": "O(1) construction for random access ranges, O(count) otherwise"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {1, 2, 3, 4, 5};\nauto last_two = v | std::views::drop(3); // 4, 5",
    "seeAlso": [
      "std::views::take",
      "std::views::drop_while"
    ]
  },
  "std::views::drop_while": {
    "symbol": "std::views::drop_while",
    "canonicalSignature": "inline constexpr /* unspecified */ drop_while;",
    "summary": "Range adaptor closure object that produces a view consisting of all elements of a range starting from the first element for which the predicate returns false.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "pred": "Unary predicate."
    },
    "returns": "std::ranges::drop_while_view skipping leading elements while pred returns true.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/drop_while_view",
    "complexity": {
      "time": "O(1) construction; O(N) traversal to first non-matching element"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<int> v = {-2, -1, 0, 1, 2};\nauto non_neg = v | std::views::drop_while([](int n) { return n < 0; }); // 0, 1, 2",
    "seeAlso": [
      "std::views::drop",
      "std::views::take_while"
    ]
  },
  "std::views::join": {
    "symbol": "std::views::join",
    "canonicalSignature": "inline constexpr /* unspecified */ join;",
    "summary": "Range adaptor closure object that flattens a range of ranges into a single continuous range view.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "r": "A range of ranges (such as a vector of strings or vector of vectors)."
    },
    "returns": "std::ranges::join_view flattening the nested range elements.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/join_view",
    "complexity": {
      "time": "O(1) construction; O(N) total traversal where N is the total number of flattened elements"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::vector<std::string> words = {\"hello\", \" \", \"world\"};\nauto flat = words | std::views::join;\n// Traverses characters sequentially: 'h', 'e', 'l', ...",
    "seeAlso": [
      "std::views::split",
      "std::views::transform"
    ]
  },
  "std::views::split": {
    "symbol": "std::views::split",
    "canonicalSignature": "inline constexpr /* unspecified */ split;",
    "summary": "Range adaptor closure object that partitions a range into subranges separated by a delimiter pattern.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "pattern": "Delimiter range or element."
    },
    "returns": "std::ranges::split_view producing subranges separated by pattern.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/split_view",
    "complexity": {
      "time": "O(1) construction; linear traversal"
    },
    "exceptionSafety": "Basic guarantee.",
    "example": "std::string s = \"hello,world,stl\";\nauto parts = s | std::views::split(',');",
    "seeAlso": [
      "std::views::join"
    ]
  },
  "std::views::reverse": {
    "symbol": "std::views::reverse",
    "canonicalSignature": "inline constexpr /* unspecified */ reverse;",
    "summary": "Range adaptor closure object that produces a view iterating over elements of a bidirectional range in reverse order.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "r": "A bidirectional range."
    },
    "returns": "std::ranges::reverse_view traversing elements from end to beginning.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/reverse_view",
    "complexity": {
      "time": "O(1) construction; O(1) per element access"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::vector<int> v = {1, 2, 3};\nauto rev = v | std::views::reverse; // 3, 2, 1",
    "seeAlso": [
      "std::reverse",
      "std::views::take"
    ]
  },
  "std::views::keys": {
    "symbol": "std::views::keys",
    "canonicalSignature": "inline constexpr /* unspecified */ keys;",
    "summary": "Range adaptor closure object that extracts the first element (key) from each pair or tuple in a range of tuple-like objects.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "r": "A range whose elements are pair-like or tuple-like objects."
    },
    "returns": "std::ranges::elements_view exposing only the first tuple element (key).",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/keys_view",
    "complexity": {
      "time": "O(1) construction; O(1) per element access"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::map<std::string, int> scores = {{\"Ada\", 100}, {\"Bob\", 85}};\nfor (const auto& key : scores | std::views::keys) {\n    std::println(\"Player: {}\", key);\n}",
    "seeAlso": [
      "std::views::values",
      "std::views::elements"
    ]
  },
  "std::views::values": {
    "symbol": "std::views::values",
    "canonicalSignature": "inline constexpr /* unspecified */ values;",
    "summary": "Range adaptor closure object that extracts the second element (value) from each pair or tuple in a range of tuple-like objects.",
    "header": "<ranges>",
    "standard": "C++20",
    "parameters": {
      "r": "A range whose elements are pair-like or tuple-like objects."
    },
    "returns": "std::ranges::elements_view exposing only the second tuple element (value).",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/values_view",
    "complexity": {
      "time": "O(1) construction; O(1) per element access"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::map<std::string, int> scores = {{\"Ada\", 100}, {\"Bob\", 85}};\nfor (int val : scores | std::views::values) {\n    std::println(\"Score: {}\", val);\n}",
    "seeAlso": [
      "std::views::keys",
      "std::views::elements"
    ]
  },
  "std::ranges::to": {
    "symbol": "std::ranges::to",
    "canonicalSignature": "template <typename C, typename R, typename... Args>\nconstexpr auto to(R&& r, Args&&... args);\ntemplate <template <typename...> typename C, typename R, typename... Args>\nconstexpr auto to(R&& r, Args&&... args);",
    "summary": "C++23 range conversion function. Materializes a range or pipeline of views directly into a container (such as std::vector or std::set) with optimal memory reservation.",
    "header": "<ranges>",
    "standard": "C++23",
    "parameters": {
      "r": "The input range or view pipeline to convert.",
      "args": "Optional arguments forwarded to the target container constructor."
    },
    "returns": "A container of type C populated with elements from r.",
    "docUrl": "https://en.cppreference.com/w/cpp/ranges/to",
    "complexity": {
      "time": "Linear O(N) element constructions and allocations",
      "space": "O(N) allocated container storage"
    },
    "exceptionSafety": "Basic guarantee: if an element constructor throws, allocated container resources are freed.",
    "example": "auto evens = std::views::iota(1, 10)\n    | std::views::filter([](int n) { return n % 2 == 0; })\n    | std::ranges::to<std::vector>();",
    "seeAlso": [
      "std::views::all",
      "std::views::transform"
    ]
  }
};

export const rangesModule: StlHeaderModule = {
  id: 'ranges',
  headers: ['<ranges>'],
  entries: RANGES_ENTRIES
};
