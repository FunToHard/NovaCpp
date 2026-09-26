import { StlDocEntry, StlHeaderModule } from '../types';

export const UTILITY_ENTRIES: Record<string, StlDocEntry> = {
  "std::move": {
    "symbol": "std::move",
    "canonicalSignature": "template <typename T>\nconstexpr std::remove_reference_t<T>&& move(T&& t) noexcept;",
    "summary": "Unconditionally casts `t` to an rvalue reference `T&&`. Signals that the resource held by `t` may be moved from or pilfered.",
    "header": "<utility>",
    "standard": "C++11",
    "parameters": {
      "t": "The lvalue object to cast to an rvalue reference."
    },
    "returns": "`static_cast<std::remove_reference_t<T>&&>(t)`",
    "docUrl": "https://en.cppreference.com/w/cpp/utility/move",
    "complexity": {
      "time": "O(0) compile-time cast, zero runtime cost"
    },
    "exceptionSafety": "No-throw guarantee (noexcept).",
    "example": "std::vector<int> v1 = {1, 2, 3};\nstd::vector<int> v2 = std::move(v1); // v1 memory stolen by v2 without allocation\nassert(v1.empty());",
    "seeAlso": [
      "std::forward",
      "std::as_const"
    ]
  },
  "std::forward": {
    "symbol": "std::forward",
    "canonicalSignature": "template <typename T>\nconstexpr T&& forward(std::remove_reference_t<T>& t) noexcept;",
    "summary": "Conditionally casts `t` to an rvalue reference only if the original type argument `T` was an rvalue. Enables perfect forwarding in generic code.",
    "header": "<utility>",
    "standard": "C++11",
    "parameters": {
      "t": "The universal reference argument to forward."
    },
    "returns": "`static_cast<T&&>(t)` preserving the original value category.",
    "docUrl": "https://en.cppreference.com/w/cpp/utility/forward",
    "complexity": {
      "time": "O(0) compile-time cast, zero runtime cost"
    },
    "exceptionSafety": "No-throw guarantee (noexcept).",
    "example": "template <typename T>\nvoid wrapper(T&& arg) {\n    target(std::forward<T>(arg)); // Forwards lvalues as lvalues, rvalues as rvalues\n}",
    "seeAlso": [
      "std::move"
    ]
  },
  "std::as_const": {
    "symbol": "std::as_const",
    "canonicalSignature": "template <typename T>\nconstexpr std::add_const_t<T>& as_const(T& t) noexcept;",
    "summary": "Forms an lvalue reference to `const` of the given object. Prevents accidental modifications.",
    "header": "<utility>",
    "standard": "C++17",
    "parameters": {
      "t": "The object to convert to a const lvalue reference."
    },
    "returns": "`const T&`",
    "docUrl": "https://en.cppreference.com/w/cpp/utility/as_const",
    "complexity": {
      "time": "O(0) zero runtime overhead"
    },
    "exceptionSafety": "No-throw guarantee.",
    "example": "std::string s = \"test\";\nconst auto& cs = std::as_const(s);",
    "seeAlso": [
      "std::move"
    ]
  },
  "std::optional": {
    "symbol": "std::optional",
    "canonicalSignature": "template <typename T>\nclass optional;",
    "summary": "Manages an optional contained value (a value that may or may not be present). Contains the value in-place within its own storage without dynamic heap allocation. Similar to Rust's `Option<T>`.",
    "header": "<optional>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/utility/optional",
    "complexity": {
      "time": "O(1) creation, check has_value(), and dereference",
      "space": "sizeof(T) + alignof(T) boolean flag"
    },
    "example": "std::optional<int> find_id(std::string_view name) {\n    if (name == \"root\") return 0;\n    return std::nullopt;\n}\n\nauto id = find_id(\"nova\");\nint value = id.value_or(-1);",
    "seeAlso": [
      "std::expected",
      "std::variant"
    ]
  },
  "std::variant": {
    "symbol": "std::variant",
    "canonicalSignature": "template <typename... Types>\nclass variant;",
    "summary": "Type-safe discriminated union. An instance of `variant` at any given time either holds a value of one of its alternative types, or it is in an invalid state. Similar to Rust's `enum`.",
    "header": "<variant>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/utility/variant",
    "complexity": {
      "time": "O(1) value access and index lookup; std::visit is O(1) jump table dispatch",
      "space": "Max sizeof(Types) + type index discriminator"
    },
    "example": "std::variant<int, std::string> v = \"hello\";\nstd::visit([](const auto& val) {\n    std::println(\"Variant holds: {}\", val);\n}, v);",
    "seeAlso": [
      "std::holds_alternative",
      "std::get",
      "std::optional"
    ]
  },
  "std::expected": {
    "symbol": "std::expected",
    "canonicalSignature": "template <typename T, typename E>\nclass expected;",
    "summary": "Provides a way to return either an expected value of type `T`, or an unexpected error of type `E`. Idiomatic error handling without exceptions, equivalent to Rust's `Result<T, E>`.",
    "header": "<expected>",
    "standard": "C++23",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/utility/expected",
    "complexity": {
      "time": "O(1) value or error access",
      "space": "Max(sizeof(T), sizeof(E)) + bool discriminator"
    },
    "example": "std::expected<double, std::string> divide(double a, double b) {\n    if (b == 0.0) return std::unexpected(\"Division by zero\");\n    return a / b;\n}\n\nauto res = divide(10.0, 2.0);\nif (res) std::println(\"Result: {}\", *res);",
    "seeAlso": [
      "std::optional",
      "std::unexpected"
    ]
  },
  "std::tuple": {
    "symbol": "std::tuple",
    "canonicalSignature": "template <typename... Types>\nclass tuple;",
    "summary": "Fixed-size collection of heterogeneous values. Supports structured binding unpacking `auto [a, b, c] = t;`.",
    "header": "<tuple>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/utility/tuple",
    "complexity": {
      "time": "O(1) std::get<I> compile-time element access"
    },
    "example": "std::tuple<int, std::string, double> record{1, \"Alice\", 3.95};\nauto [id, name, gpa] = record;",
    "seeAlso": [
      "std::pair",
      "std::make_tuple"
    ]
  }
};

export const utilityModule: StlHeaderModule = {
  id: 'utility',
  headers: ["<utility>","<optional>","<variant>","<expected>","<tuple>"],
  entries: UTILITY_ENTRIES
};
