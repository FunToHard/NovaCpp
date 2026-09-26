import { StlDocEntry, StlHeaderModule } from '../types';

export const UTILITY_ENTRIES: Record<string, StlDocEntry> = {
  "std::move": {
    symbol: "std::move",
    canonicalSignature: "template <typename T>\nconstexpr std::remove_reference_t<T>&& move(T&& t) noexcept;",
    summary: "Unconditionally casts `t` to an rvalue reference `T&&`. Signals that the resource held by `t` may be moved from or pilfered.",
    header: "<utility>",
    standard: "C++11",
    parameters: {
      "t": "The lvalue object to cast to an rvalue reference."
    },
    returns: "`static_cast<std::remove_reference_t<T>&&>(t)`",
    docUrl: "https://en.cppreference.com/w/cpp/utility/move",
    complexity: {
      time: "O(0) compile-time cast, zero runtime cost"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "std::vector<int> v1 = {1, 2, 3};\nstd::vector<int> v2 = std::move(v1); // v1 memory stolen by v2 without allocation\nassert(v1.empty());",
    seeAlso: [
      "std::forward",
      "std::as_const"
    ]
  },
  "std::forward": {
    symbol: "std::forward",
    canonicalSignature: "template <typename T>\nconstexpr T&& forward(std::remove_reference_t<T>& t) noexcept;",
    summary: "Conditionally casts `t` to an rvalue reference only if the original type argument `T` was an rvalue. Enables perfect forwarding in generic code.",
    header: "<utility>",
    standard: "C++11",
    parameters: {
      "t": "The universal reference argument to forward."
    },
    returns: "`static_cast<T&&>(t)` preserving the original value category.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/forward",
    complexity: {
      time: "O(0) compile-time cast, zero runtime cost"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "template <typename T>\nvoid wrapper(T&& arg) {\n    target(std::forward<T>(arg)); // Forwards lvalues as lvalues, rvalues as rvalues\n}",
    seeAlso: [
      "std::move"
    ]
  },
  "std::as_const": {
    symbol: "std::as_const",
    canonicalSignature: "template <typename T>\nconstexpr std::add_const_t<T>& as_const(T& t) noexcept;",
    summary: "Forms an lvalue reference to `const` of the given object. Prevents accidental modifications.",
    header: "<utility>",
    standard: "C++17",
    parameters: {
      "t": "The object to convert to a const lvalue reference."
    },
    returns: "`const T&`",
    docUrl: "https://en.cppreference.com/w/cpp/utility/as_const",
    complexity: {
      time: "O(0) zero runtime overhead"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "std::string s = \"test\";\nconst auto& cs = std::as_const(s);",
    seeAlso: [
      "std::move"
    ]
  },
  "std::pair": {
    symbol: "std::pair",
    canonicalSignature: "template <typename T1, typename T2>\nstruct pair;",
    summary: "Class template that provides a way to store two heterogeneous objects as a single unit. Supports structured bindings unpacking `auto [first, second] = p;`.",
    header: "<utility>",
    standard: "C++98",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/pair",
    complexity: {
      time: "O(1) construction, element access, and destruction",
      space: "sizeof(T1) + sizeof(T2) + padding"
    },
    exceptionSafety: "No-throw or strong guarantee depending on member constructors.",
    example: "std::pair<int, std::string> p{1, \"Nova\"};\nauto [id, name] = p;\nstd::println(\"ID: {}, Name: {}\", id, name);",
    seeAlso: [
      "std::make_pair",
      "std::tuple"
    ]
  },
  "std::make_pair": {
    symbol: "std::make_pair",
    canonicalSignature: "template <typename T1, typename T2>\nconstexpr std::pair<std::decay_t<T1>, std::decay_t<T2>> make_pair(T1&& t, T2&& u);",
    summary: "Creates a std::pair object, deducing the target types from the types of the arguments with std::decay.",
    header: "<utility>",
    standard: "C++98",
    parameters: {
      "t": "First value of the pair.",
      "u": "Second value of the pair."
    },
    returns: "std::pair deduced from arguments.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/pair/make_pair",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw if member move/copy constructors do not throw.",
    example: "auto p = std::make_pair(42, std::string(\"Nova\"));",
    seeAlso: [
      "std::pair",
      "std::make_tuple"
    ]
  },
  "std::exchange": {
    symbol: "std::exchange",
    canonicalSignature: "template <typename T, typename U = T>\nconstexpr T exchange(T& obj, U&& new_val) noexcept(/* ... */);",
    summary: "Replaces the value of obj with new_val and returns the old value of obj. Idiomatic for move constructors and move assignment operators.",
    header: "<utility>",
    standard: "C++14",
    parameters: {
      "obj": "Object whose value is to be replaced.",
      "new_val": "New value to assign to obj."
    },
    returns: "The old value of obj prior to replacement.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/exchange",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee if move construction and assignment do not throw.",
    example: "int old_val = std::exchange(counter, 0); // resets counter to 0, returns old value",
    seeAlso: [
      "std::move",
      "std::swap"
    ]
  },
  "std::forward_like": {
    symbol: "std::forward_like",
    canonicalSignature: "template <typename T, typename U>\nconstexpr auto&& forward_like(U&& x) noexcept;",
    summary: "Downcasts or forwards expression x with the constness and value category of type T. Designed for deducing this (explicit object parameter) patterns in C++23.",
    header: "<utility>",
    standard: "C++23",
    parameters: {
      "x": "The object to forward with the value category and constness modeled after T."
    },
    returns: "x forwarded with the value category and constness of T.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/forward_like",
    complexity: {
      time: "O(0) compile-time cast, zero runtime cost"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "struct Node {\n    template <typename Self>\n    auto&& get_data(this Self&& self) {\n        return std::forward_like<Self>(self.data);\n    }\n    int data = 0;\n};",
    seeAlso: [
      "std::forward",
      "std::move"
    ]
  },
  "std::to_underlying": {
    symbol: "std::to_underlying",
    canonicalSignature: "template <typename Enum>\nconstexpr std::underlying_type_t<Enum> to_underlying(Enum e) noexcept;",
    summary: "Converts an enumeration value to its underlying integer type. Equivalent to static_cast<std::underlying_type_t<Enum>>(e).",
    header: "<utility>",
    standard: "C++23",
    parameters: {
      "e": "Enumeration value to convert."
    },
    returns: "The integer representation of e converted to its underlying integer type.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/to_underlying",
    complexity: {
      time: "O(0) compile-time cast, zero runtime cost"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "enum class Color : uint8_t { Red = 1, Green = 2, Blue = 4 };\nauto raw = std::to_underlying(Color::Green); // uint8_t 2",
    seeAlso: [
      "std::underlying_type"
    ]
  },
  "std::in_range": {
    symbol: "std::in_range",
    canonicalSignature: "template <typename R, typename T>\nconstexpr bool in_range(T t) noexcept;",
    summary: "Checks whether the integer value t can be represented in integer type R without overflow or sign distortion.",
    header: "<utility>",
    standard: "C++20",
    parameters: {
      "t": "Integer value to test against range of R."
    },
    returns: "true if t fits into type R; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/in_range",
    complexity: {
      time: "O(1) safe comparison"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "static_assert(std::in_range<int8_t>(127));\nstatic_assert(!std::in_range<int8_t>(128));\nstatic_assert(!std::in_range<uint32_t>(-1));",
    seeAlso: [
      "std::cmp_equal",
      "std::cmp_less"
    ]
  },
  "std::cmp_equal": {
    symbol: "std::cmp_equal",
    canonicalSignature: "template <typename T, typename U>\nconstexpr bool cmp_equal(T t, U u) noexcept;",
    summary: "Compares two integer values for equality, handling signed-unsigned comparisons safely without unexpected implicit conversions.",
    header: "<utility>",
    standard: "C++20",
    parameters: {
      "t": "First integer operand.",
      "u": "Second integer operand."
    },
    returns: "true if t == u in mathematical integer arithmetic; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/cmp_equal",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "int a = -1;\nunsigned int b = 0xFFFFFFFF;\nassert(!std::cmp_equal(a, b)); // false, unlike regular (a == b)",
    seeAlso: [
      "std::cmp_not_equal",
      "std::cmp_less",
      "std::in_range"
    ]
  },
  "std::cmp_not_equal": {
    symbol: "std::cmp_not_equal",
    canonicalSignature: "template <typename T, typename U>\nconstexpr bool cmp_not_equal(T t, U u) noexcept;",
    summary: "Compares two integer values for inequality safely across signed and unsigned types.",
    header: "<utility>",
    standard: "C++20",
    parameters: {
      "t": "First integer operand.",
      "u": "Second integer operand."
    },
    returns: "true if t != u in mathematical integer arithmetic; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/cmp_equal",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "int a = -1;\nunsigned int b = 0;\nassert(std::cmp_not_equal(a, b));",
    seeAlso: [
      "std::cmp_equal",
      "std::cmp_less"
    ]
  },
  "std::cmp_less": {
    symbol: "std::cmp_less",
    canonicalSignature: "template <typename T, typename U>\nconstexpr bool cmp_less(T t, U u) noexcept;",
    summary: "Compares two integer values with mathematical less-than semantics, safely preventing negative values from converting to large unsigned integers.",
    header: "<utility>",
    standard: "C++20",
    parameters: {
      "t": "First integer operand.",
      "u": "Second integer operand."
    },
    returns: "true if t < u; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/cmp_less",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "int negative = -5;\nunsigned int positive = 2;\nassert(std::cmp_less(negative, positive)); // true (negative is less than 2)",
    seeAlso: [
      "std::cmp_greater",
      "std::cmp_equal"
    ]
  },
  "std::cmp_greater": {
    symbol: "std::cmp_greater",
    canonicalSignature: "template <typename T, typename U>\nconstexpr bool cmp_greater(T t, U u) noexcept;",
    summary: "Compares two integer values with mathematical greater-than semantics safely across different signedness.",
    header: "<utility>",
    standard: "C++20",
    parameters: {
      "t": "First integer operand.",
      "u": "Second integer operand."
    },
    returns: "true if t > u; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/cmp_greater",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "unsigned int big = 100;\nint small = -1;\nassert(std::cmp_greater(big, small));",
    seeAlso: [
      "std::cmp_less",
      "std::cmp_equal"
    ]
  },
  "std::tuple": {
    symbol: "std::tuple",
    canonicalSignature: "template <typename... Types>\nclass tuple;",
    summary: "Fixed-size collection of heterogeneous values. Supports structured binding unpacking `auto [a, b, c] = t;`.",
    header: "<tuple>",
    standard: "C++11",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/tuple",
    complexity: {
      time: "O(1) std::get<I> compile-time element access"
    },
    exceptionSafety: "No-throw or strong guarantee depending on element type constructors.",
    example: "std::tuple<int, std::string, double> record{1, \"Alice\", 3.95};\nauto [id, name, gpa] = record;",
    seeAlso: [
      "std::pair",
      "std::make_tuple",
      "std::apply"
    ]
  },
  "std::make_tuple": {
    symbol: "std::make_tuple",
    canonicalSignature: "template <typename... Types>\nconstexpr std::tuple<std::decay_t<Types>...> make_tuple(Types&&... args);",
    summary: "Creates a tuple object, deducing the target types from the types of the arguments with std::decay.",
    header: "<tuple>",
    standard: "C++11",
    parameters: {
      "args": "Zero or more arguments to store in the tuple."
    },
    returns: "std::tuple containing decayed copies of args.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/tuple/make_tuple",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw if element constructors do not throw.",
    example: "auto t = std::make_tuple(1, \"test\", 3.14);",
    seeAlso: [
      "std::tuple",
      "std::tie",
      "std::forward_as_tuple"
    ]
  },
  "std::tie": {
    symbol: "std::tie",
    canonicalSignature: "template <typename... Types>\nconstexpr std::tuple<Types&...> tie(Types&... args) noexcept;",
    summary: "Creates a tuple of lvalue references to its arguments or std::ignore placeholders. Often used for unpacking or implementing lexicographical comparisons.",
    header: "<tuple>",
    standard: "C++11",
    parameters: {
      "args": "Zero or more lvalue references to bind."
    },
    returns: "std::tuple of lvalue references.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/tuple/tie",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "int x; double y;\nstd::tie(x, std::ignore, y) = std::make_tuple(10, \"skip\", 3.14);",
    seeAlso: [
      "std::make_tuple",
      "std::forward_as_tuple"
    ]
  },
  "std::forward_as_tuple": {
    symbol: "std::forward_as_tuple",
    canonicalSignature: "template <typename... Types>\nconstexpr std::tuple<Types&&...> forward_as_tuple(Types&&... args) noexcept;",
    summary: "Constructs a tuple of references to the arguments, suitable for forwarding as function arguments or piecewise constructing a std::pair.",
    header: "<tuple>",
    standard: "C++11",
    parameters: {
      "args": "Zero or more arguments to bind as references."
    },
    returns: "std::tuple containing universal references (rvalue or lvalue) to args.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/tuple/forward_as_tuple",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "std::map<int, Widget> m;\nm.emplace(std::piecewise_construct, std::forward_as_tuple(1), std::forward_as_tuple(\"arg1\", 42));",
    seeAlso: [
      "std::tie",
      "std::make_tuple"
    ]
  },
  "std::tuple_cat": {
    symbol: "std::tuple_cat",
    canonicalSignature: "template <typename... Tuples>\nconstexpr auto tuple_cat(Tuples&&... tuples);",
    summary: "Concatenates multiple tuples (or pairs) into a single unified tuple.",
    header: "<tuple>",
    standard: "C++11",
    parameters: {
      "tuples": "Zero or more tuples or pairs to concatenate."
    },
    returns: "A std::tuple containing all elements of all input tuples in order.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/tuple/tuple_cat",
    complexity: {
      time: "O(N) where N is total number of elements across all tuples"
    },
    exceptionSafety: "Strong guarantee if element constructors throw.",
    example: "auto t1 = std::make_tuple(1, 2.0);\nauto t2 = std::make_tuple(\"hello\", 'a');\nauto combined = std::tuple_cat(t1, t2); // std::tuple<int, double, const char*, char>",
    seeAlso: [
      "std::tuple",
      "std::apply"
    ]
  },
  "std::apply": {
    symbol: "std::apply",
    canonicalSignature: "template <typename F, typename Tuple>\nconstexpr decltype(auto) apply(F&& f, Tuple&& t);",
    summary: "Invokes the callable object f with the elements of tuple t unpacked as individual positional arguments.",
    header: "<tuple>",
    standard: "C++17",
    parameters: {
      "f": "Callable object (function pointer, lambda, functor) to invoke.",
      "t": "Tuple whose elements are unpacked as arguments."
    },
    returns: "The result of invoking f with unpacked tuple elements.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/tuple/apply",
    complexity: {
      time: "O(1) dispatch at compile time"
    },
    exceptionSafety: "Propagates any exception thrown by invocation of f.",
    example: "int add(int a, int b) { return a + b; }\nauto t = std::make_tuple(5, 7);\nint sum = std::apply(add, t); // sum == 12",
    seeAlso: [
      "std::make_from_tuple"
    ]
  },
  "std::make_from_tuple": {
    symbol: "std::make_from_tuple",
    canonicalSignature: "template <typename T, typename Tuple>\nconstexpr T make_from_tuple(Tuple&& t);",
    summary: "Constructs an object of type T using the elements of tuple t as arguments to the constructor.",
    header: "<tuple>",
    standard: "C++17",
    parameters: {
      "t": "Tuple whose elements serve as constructor arguments for T."
    },
    returns: "The newly constructed object of type T.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/tuple/make_from_tuple",
    complexity: {
      time: "O(1) direct construction dispatch"
    },
    exceptionSafety: "Strong guarantee if constructor of T throws.",
    example: "struct Point { int x; int y; };\nauto t = std::make_tuple(10, 20);\nPoint p = std::make_from_tuple<Point>(t);",
    seeAlso: [
      "std::apply",
      "std::tuple"
    ]
  },
  "std::optional": {
    symbol: "std::optional",
    canonicalSignature: "template <typename T>\nclass optional;",
    summary: "Manages an optional contained value (a value that may or may not be present). Contains the value in-place within its own storage without dynamic heap allocation. Similar to Rust's `Option<T>`.",
    header: "<optional>",
    standard: "C++17",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional",
    complexity: {
      time: "O(1) creation, check has_value(), and dereference",
      space: "sizeof(T) + alignof(T) boolean flag"
    },
    exceptionSafety: "Strong guarantee: operations on contained value propagate exceptions; noexcept if T operations do not throw.",
    example: "std::optional<int> find_id(std::string_view name) {\n    if (name == \"root\") return 0;\n    return std::nullopt;\n}\n\nauto id = find_id(\"nova\");\nint value = id.value_or(-1);",
    seeAlso: [
      "std::expected",
      "std::variant",
      "std::make_optional",
      "std::nullopt"
    ]
  },
  "std::make_optional": {
    symbol: "std::make_optional",
    canonicalSignature: "template <typename T, typename... Args>\nconstexpr std::optional<T> make_optional(Args&&... args);",
    summary: "Creates a std::optional object containing an instance of T constructed in-place with args.",
    header: "<optional>",
    standard: "C++17",
    parameters: {
      "args": "Arguments forwarded to the constructor of T."
    },
    returns: "std::optional<T> containing the newly constructed value.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/make_optional",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Strong guarantee if constructor of T throws.",
    example: "auto opt = std::make_optional<std::string>(5, 'a'); // optional containing \"aaaaa\"",
    seeAlso: [
      "std::optional",
      "std::nullopt"
    ]
  },
  "std::nullopt": {
    symbol: "std::nullopt",
    canonicalSignature: "inline constexpr std::nullopt_t nullopt{/* unspec */};",
    summary: "Constant of type std::nullopt_t used to indicate an uninitialized or empty std::optional state.",
    header: "<optional>",
    standard: "C++17",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/nullopt",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "std::optional<int> find_item() {\n    return std::nullopt; // indicates not found\n}",
    seeAlso: [
      "std::optional",
      "std::make_optional"
    ]
  },
  "std::optional::value_or": {
    symbol: "std::optional::value_or",
    canonicalSignature: "template <typename U>\nconstexpr T value_or(U&& default_value) const&;\ntemplate <typename U>\nconstexpr T value_or(U&& default_value) &&;",
    summary: "Returns the contained value if has_value() is true, or default_value converted to T otherwise.",
    header: "<optional>",
    standard: "C++17",
    parameters: {
      "default_value": "Fallback value returned if the optional is empty."
    },
    returns: "The contained value or default_value.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/value_or",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Strong guarantee if copy/move constructor throws.",
    example: "std::optional<int> opt;\nint val = opt.value_or(42); // 42",
    seeAlso: [
      "std::optional",
      "std::optional::and_then"
    ]
  },
  "value_or": {
    symbol: "std::optional::value_or",
    canonicalSignature: "template <typename U>\nconstexpr T value_or(U&& default_value) const&;\ntemplate <typename U>\nconstexpr T value_or(U&& default_value) &&;",
    summary: "Returns the contained value if has_value() is true, or default_value converted to T otherwise.",
    header: "<optional>",
    standard: "C++17",
    parameters: {
      "default_value": "Fallback value returned if the optional is empty."
    },
    returns: "The contained value or default_value.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/value_or",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Strong guarantee if copy/move constructor throws.",
    example: "std::optional<int> opt;\nint val = opt.value_or(42); // 42",
    seeAlso: [
      "std::optional",
      "std::optional::and_then"
    ]
  },
  "std::optional::and_then": {
    symbol: "std::optional::and_then",
    canonicalSignature: "template <typename F>\nconstexpr auto and_then(F&& f) &;\ntemplate <typename F>\nconstexpr auto and_then(F&& f) const&;\ntemplate <typename F>\nconstexpr auto and_then(F&& f) &&;",
    summary: "Monadic bind operation. If *this contains a value, returns the result of invoking f(*value), which must return an optional; otherwise returns an empty optional.",
    header: "<optional>",
    standard: "C++23",
    parameters: {
      "f": "Callable function or lambda taking value and returning a std::optional."
    },
    returns: "Result of f(*value), or an empty std::optional.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/and_then",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Propagates exceptions thrown by f.",
    example: "std::optional<int> opt = 42;\nauto res = opt.and_then([](int x) -> std::optional<std::string> {\n    return std::to_string(x);\n});",
    seeAlso: [
      "std::optional::transform",
      "std::optional::or_else"
    ]
  },
  "and_then": {
    symbol: "std::optional::and_then",
    canonicalSignature: "template <typename F>\nconstexpr auto and_then(F&& f) &;\ntemplate <typename F>\nconstexpr auto and_then(F&& f) const&;\ntemplate <typename F>\nconstexpr auto and_then(F&& f) &&;",
    summary: "Monadic bind operation. If *this contains a value, returns the result of invoking f(*value), which must return an optional; otherwise returns an empty optional.",
    header: "<optional>",
    standard: "C++23",
    parameters: {
      "f": "Callable function or lambda taking value and returning a std::optional."
    },
    returns: "Result of f(*value), or an empty std::optional.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/and_then",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Propagates exceptions thrown by f.",
    example: "std::optional<int> opt = 42;\nauto res = opt.and_then([](int x) -> std::optional<std::string> {\n    return std::to_string(x);\n});",
    seeAlso: [
      "std::optional::transform",
      "std::optional::or_else"
    ]
  },
  "std::optional::transform": {
    symbol: "std::optional::transform",
    canonicalSignature: "template <typename F>\nconstexpr auto transform(F&& f) &;\ntemplate <typename F>\nconstexpr auto transform(F&& f) const&;\ntemplate <typename F>\nconstexpr auto transform(F&& f) &&;",
    summary: "Monadic map operation. If *this contains a value, returns a std::optional containing the result of invoking f(*value); otherwise returns an empty optional.",
    header: "<optional>",
    standard: "C++23",
    parameters: {
      "f": "Callable function or lambda taking value and returning a transformed value."
    },
    returns: "std::optional containing f(*value), or empty optional.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/transform",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Propagates exceptions thrown by f.",
    example: "std::optional<int> opt = 21;\nauto doubled = opt.transform([](int n) { return n * 2; }); // std::optional<int>{42}",
    seeAlso: [
      "std::optional::and_then",
      "std::optional::or_else"
    ]
  },
  "transform": {
    symbol: "std::optional::transform",
    canonicalSignature: "template <typename F>\nconstexpr auto transform(F&& f) &;\ntemplate <typename F>\nconstexpr auto transform(F&& f) const&;\ntemplate <typename F>\nconstexpr auto transform(F&& f) &&;",
    summary: "Monadic map operation. If *this contains a value, returns a std::optional containing the result of invoking f(*value); otherwise returns an empty optional.",
    header: "<optional>",
    standard: "C++23",
    parameters: {
      "f": "Callable function or lambda taking value and returning a transformed value."
    },
    returns: "std::optional containing f(*value), or empty optional.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/transform",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Propagates exceptions thrown by f.",
    example: "std::optional<int> opt = 21;\nauto doubled = opt.transform([](int n) { return n * 2; }); // std::optional<int>{42}",
    seeAlso: [
      "std::optional::and_then",
      "std::optional::or_else"
    ]
  },
  "std::optional::or_else": {
    symbol: "std::optional::or_else",
    canonicalSignature: "template <typename F>\nconstexpr auto or_else(F&& f) const&;\ntemplate <typename F>\nconstexpr auto or_else(F&& f) &&;",
    summary: "Monadic recovery operation. If *this contains a value, returns *this; otherwise returns the result of invoking f(), which must return an optional of matching type.",
    header: "<optional>",
    standard: "C++23",
    parameters: {
      "f": "Callable returning a fallback std::optional."
    },
    returns: "Self if has_value(), otherwise result of f().",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/or_else",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Propagates exceptions thrown by f.",
    example: "std::optional<int> empty;\nauto fallback = empty.or_else([]() -> std::optional<int> { return 99; }); // std::optional<int>{99}",
    seeAlso: [
      "std::optional::and_then",
      "std::optional::value_or"
    ]
  },
  "or_else": {
    symbol: "std::optional::or_else",
    canonicalSignature: "template <typename F>\nconstexpr auto or_else(F&& f) const&;\ntemplate <typename F>\nconstexpr auto or_else(F&& f) &&;",
    summary: "Monadic recovery operation. If *this contains a value, returns *this; otherwise returns the result of invoking f(), which must return an optional of matching type.",
    header: "<optional>",
    standard: "C++23",
    parameters: {
      "f": "Callable returning a fallback std::optional."
    },
    returns: "Self if has_value(), otherwise result of f().",
    docUrl: "https://en.cppreference.com/w/cpp/utility/optional/or_else",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Propagates exceptions thrown by f.",
    example: "std::optional<int> empty;\nauto fallback = empty.or_else([]() -> std::optional<int> { return 99; }); // std::optional<int>{99}",
    seeAlso: [
      "std::optional::and_then",
      "std::optional::value_or"
    ]
  },
  "std::variant": {
    symbol: "std::variant",
    canonicalSignature: "template <typename... Types>\nclass variant;",
    summary: "Type-safe discriminated union. An instance of `variant` at any given time either holds a value of one of its alternative types, or it is in an invalid state. Similar to Rust's `enum`.",
    header: "<variant>",
    standard: "C++17",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/variant",
    complexity: {
      time: "O(1) value access and index lookup; std::visit is O(1) jump table dispatch",
      space: "Max sizeof(Types) + type index discriminator"
    },
    exceptionSafety: "Basic guarantee: if an exception is thrown during alternative assignment/initialization, the variant may become valueless_by_exception.",
    example: "std::variant<int, std::string> v = \"hello\";\nstd::visit([](const auto& val) {\n    std::println(\"Variant holds: {}\", val);\n}, v);",
    seeAlso: [
      "std::holds_alternative",
      "std::get_if",
      "std::visit",
      "std::monostate"
    ]
  },
  "std::holds_alternative": {
    symbol: "std::holds_alternative",
    canonicalSignature: "template <typename T, typename... Types>\nconstexpr bool holds_alternative(const std::variant<Types...>& v) noexcept;",
    summary: "Checks if the variant v currently holds an alternative of type T.",
    header: "<variant>",
    standard: "C++17",
    parameters: {
      "v": "Variant to inspect."
    },
    returns: "true if v currently holds type T; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/variant/holds_alternative",
    complexity: {
      time: "O(1) index comparison"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "std::variant<int, std::string> v = \"text\";\nif (std::holds_alternative<std::string>(v)) {\n    std::println(\"Contains string\");\n}",
    seeAlso: [
      "std::get_if",
      "std::variant",
      "std::visit"
    ]
  },
  "std::get_if": {
    symbol: "std::get_if",
    canonicalSignature: "template <typename T, typename... Types>\nconstexpr std::add_pointer_t<T> get_if(std::variant<Types...>* pv) noexcept;\ntemplate <size_t I, typename... Types>\nconstexpr std::add_pointer_t<variant_alternative_t<I, variant<Types...>>> get_if(std::variant<Types...>* pv) noexcept;",
    summary: "Safely obtains a pointer to the value stored in variant pv if it holds alternative T or index I. Returns nullptr if the variant holds a different type.",
    header: "<variant>",
    standard: "C++17",
    parameters: {
      "pv": "Pointer to variant to inspect."
    },
    returns: "Pointer to stored value if alternative matches; nullptr otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/variant/get_if",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "std::variant<int, double> v = 3.14;\nif (auto* p = std::get_if<double>(&v)) {\n    std::println(\"Double value: {}\", *p);\n}",
    seeAlso: [
      "std::holds_alternative",
      "std::variant",
      "std::visit"
    ]
  },
  "std::visit": {
    symbol: "std::visit",
    canonicalSignature: "template <typename Visitor, typename... Variants>\nconstexpr decltype(auto) visit(Visitor&& vis, Variants&&... vars);",
    summary: "Applies the visitor callable vis to the values contained in the variants. Implements double/multi-dispatch via compile-time jump table.",
    header: "<variant>",
    standard: "C++17",
    parameters: {
      "vis": "Callable visitor object (overloaded lambda or functor).",
      "vars": "One or more variants to visit."
    },
    returns: "The value returned by the selected visitor overload.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/variant/visit",
    complexity: {
      time: "O(1) jump table branch"
    },
    exceptionSafety: "Throws std::bad_variant_access if any variant is valueless_by_exception.",
    example: "std::variant<int, std::string> v = 42;\nstd::visit([](const auto& val) {\n    std::println(\"Val: {}\", val);\n}, v);",
    seeAlso: [
      "std::variant",
      "std::holds_alternative",
      "std::get_if"
    ]
  },
  "std::monostate": {
    symbol: "std::monostate",
    canonicalSignature: "struct monostate {};",
    summary: "Unit type intended for use as the first alternative in std::variant to make the variant default-constructible even when other types have no default constructor.",
    header: "<variant>",
    standard: "C++17",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/variant/monostate",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "No-throw guarantee (noexcept).",
    example: "struct NoDefault { explicit NoDefault(int); };\n// std::variant<NoDefault> fails default construction\nstd::variant<std::monostate, NoDefault> v; // OK: index() == 0",
    seeAlso: [
      "std::variant"
    ]
  },
  "std::expected": {
    symbol: "std::expected",
    canonicalSignature: "template <typename T, typename E>\nclass expected;",
    summary: "Provides a way to return either an expected value of type `T`, or an unexpected error of type `E`. Idiomatic error handling without exceptions, equivalent to Rust's `Result<T, E>`.",
    header: "<expected>",
    standard: "C++23",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/expected",
    complexity: {
      time: "O(1) value or error access",
      space: "Max(sizeof(T), sizeof(E)) + bool discriminator"
    },
    exceptionSafety: "Strong guarantee: propagates exceptions from constructor of T or E without leaking resources.",
    example: "std::expected<double, std::string> divide(double a, double b) {\n    if (b == 0.0) return std::unexpected(\"Division by zero\");\n    return a / b;\n}\n\nauto res = divide(10.0, 2.0);\nif (res) std::println(\"Result: {}\", *res);",
    seeAlso: [
      "std::optional"
    ]
  },
  "std::any": {
    symbol: "std::any",
    canonicalSignature: "class any;",
    summary: "Type-safe container for single values of any copy-constructible type. Employs Small Object Optimization (SOO) for small types to avoid heap allocation.",
    header: "<any>",
    standard: "C++17",
    parameters: {},
    returns: "",
    docUrl: "https://en.cppreference.com/w/cpp/utility/any",
    complexity: {
      time: "O(1) construction, access, and destruction (heap allocation only for large objects)"
    },
    exceptionSafety: "Strong guarantee if copied object constructor throws.",
    example: "std::any a = 5;\na = std::string(\"Hello\");\nif (a.has_value() && a.type() == typeid(std::string)) {\n    std::println(\"{}\", std::any_cast<std::string>(a));\n}",
    seeAlso: [
      "std::any_cast",
      "std::make_any",
      "std::variant"
    ]
  },
  "std::any_cast": {
    symbol: "std::any_cast",
    canonicalSignature: "template <typename T>\nT any_cast(const std::any& operand);\ntemplate <typename T>\nconst T* any_cast(const std::any* operand) noexcept;",
    summary: "Performs type-safe conversion of the contained object in std::any to type T. Throws std::bad_any_cast if types do not match, or returns nullptr for pointer overloads.",
    header: "<any>",
    standard: "C++17",
    parameters: {
      "operand": "The std::any object or pointer to cast."
    },
    returns: "The contained object cast to T, or pointer to contained object.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/any/any_cast",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Throws std::bad_any_cast on type mismatch for value overload; noexcept for pointer overload.",
    example: "std::any a = 123;\nint val = std::any_cast<int>(a);\nint* ptr = std::any_cast<int>(&a); // returns non-null pointer",
    seeAlso: [
      "std::any",
      "std::make_any"
    ]
  },
  "std::make_any": {
    symbol: "std::make_any",
    canonicalSignature: "template <typename T, typename... Args>\nstd::any make_any(Args&&... args);",
    summary: "Constructs an object of type T in-place inside a new std::any container.",
    header: "<any>",
    standard: "C++17",
    parameters: {
      "args": "Arguments forwarded to construct T in-place."
    },
    returns: "A newly created std::any holding the constructed T.",
    docUrl: "https://en.cppreference.com/w/cpp/utility/any/make_any",
    complexity: {
      time: "O(1)"
    },
    exceptionSafety: "Strong guarantee if constructor of T throws.",
    example: "auto a = std::make_any<std::string>(5, 'z'); // contains \"zzzzz\"",
    seeAlso: [
      "std::any",
      "std::any_cast"
    ]
  }
};

export const utilityModule: StlHeaderModule = {
  id: 'utility',
  headers: ["<utility>", "<optional>", "<variant>", "<expected>", "<tuple>", "<any>"],
  entries: UTILITY_ENTRIES
};
