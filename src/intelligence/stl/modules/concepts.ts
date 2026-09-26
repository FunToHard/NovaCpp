import { StlDocEntry, StlHeaderModule } from '../types';

export const CONCEPTS_ENTRIES: Record<string, StlDocEntry> = {
  "std::same_as": {
    symbol: "std::same_as",
    canonicalSignature: "template <typename T, typename U>\nconcept same_as = std::is_same_v<T, U> && std::is_same_v<U, T>;",
    summary: "Specifies that type T and type U denote the exact same type, including cv-qualifiers and reference categories.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "First type to evaluate.",
      "U": "Second type to evaluate."
    },
    returns: "true if T and U denote identical types; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/same_as",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename T>\nrequires std::same_as<T, int>\nvoid process_int(T val) {\n    std::println(\"Integer value: {}\", val);\n}",
    seeAlso: [
      "std::convertible_to",
      "std::common_reference_with"
    ]
  },
  "std::derived_from": {
    symbol: "std::derived_from",
    canonicalSignature: "template <typename Derived, typename Base>\nconcept derived_from = std::is_base_of_v<Base, Derived> && std::is_convertible_v<const volatile Derived*, const volatile Base*>;",
    summary: "Specifies that Derived is derived from Base (or Derived is Base), and const volatile Derived* is convertible to const volatile Base*.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "Derived": "Potential derived type.",
      "Base": "Potential base class type."
    },
    returns: "true if Derived publicly and unambiguously derives from Base; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/derived_from",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "struct Shape { virtual ~Shape() = default; };\nstruct Circle : Shape {};\n\ntemplate <typename T>\nrequires std::derived_from<T, Shape>\nvoid render(const T& shape) {\n    // Guaranteed to derive from Shape\n}",
    seeAlso: [
      "std::convertible_to",
      "std::same_as"
    ]
  },
  "std::convertible_to": {
    symbol: "std::convertible_to",
    canonicalSignature: "template <typename From, typename To>\nconcept convertible_to = std::is_convertible_v<From, To> && requires { static_cast<To>(std::declval<From>()); };",
    summary: "Specifies that an expression of type From can be implicitly and explicitly converted to type To, and the conversions are equality-preserving.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "From": "Source type.",
      "To": "Destination type."
    },
    returns: "true if From is convertible to To; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/convertible_to",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename T>\nrequires std::convertible_to<T, std::string_view>\nvoid print_sv(T sv) {\n    std::string_view s = sv;\n    std::println(\"String view: {}\", s);\n}",
    seeAlso: [
      "std::same_as",
      "std::common_with"
    ]
  },
  "std::common_reference_with": {
    symbol: "std::common_reference_with",
    canonicalSignature: "template <typename T, typename U>\nconcept common_reference_with = std::same_as<std::common_reference_t<T, U>, std::common_reference_t<U, T>> && std::convertible_to<T, std::common_reference_t<T, U>> && std::convertible_to<U, std::common_reference_t<T, U>>;",
    summary: "Specifies that two types T and U share a common reference type to which both can be converted, preserving reference qualifiers and value category.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "First operand type.",
      "U": "Second operand type."
    },
    returns: "true if T and U have a valid common reference type; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/common_reference_with",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename T, typename U>\nrequires std::common_reference_with<T&, U&>\nauto select_ref(bool cond, T& a, U& b) -> std::common_reference_t<T&, U&> {\n    return cond ? a : b;\n}",
    seeAlso: [
      "std::common_with",
      "std::same_as"
    ]
  },
  "std::common_with": {
    symbol: "std::common_with",
    canonicalSignature: "template <typename T, typename U>\nconcept common_with = std::same_as<std::common_type_t<T, U>, std::common_type_t<U, T>> && requires { static_cast<std::common_type_t<T, U>>(std::declval<T>()); static_cast<std::common_type_t<T, U>>(std::declval<U>()); } && std::common_reference_with<std::add_lvalue_reference_t<const T>, std::add_lvalue_reference_t<const U>>;",
    summary: "Specifies that two types T and U share a common type to which both can be explicitly converted without precision loss.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "First type.",
      "U": "Second type."
    },
    returns: "true if a valid std::common_type_t exists and conversions are valid; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/common_with",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename T, typename U>\nrequires std::common_with<T, U>\nstd::common_type_t<T, U> add(T a, U b) {\n    return a + b;\n}",
    seeAlso: [
      "std::common_reference_with",
      "std::convertible_to"
    ]
  },
  "std::integral": {
    symbol: "std::integral",
    canonicalSignature: "template <typename T>\nconcept integral = std::is_integral_v<T>;",
    summary: "Specifies that T is an integral type (bool, char, wchar_t, char8_t, char16_t, char32_t, int, short, long, long long, and unsigned equivalents).",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check."
    },
    returns: "true if T is an integral type; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/integral",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::integral T>\nT gcd(T a, T b) {\n    while (b != 0) {\n        T t = b;\n        b = a % b;\n        a = t;\n    }\n    return a;\n}",
    seeAlso: [
      "std::signed_integral",
      "std::unsigned_integral",
      "std::floating_point"
    ]
  },
  "std::signed_integral": {
    symbol: "std::signed_integral",
    canonicalSignature: "template <typename T>\nconcept signed_integral = std::integral<T> && std::is_signed_v<T>;",
    summary: "Specifies that T is a signed integral type (signed char, short, int, long, long long).",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check."
    },
    returns: "true if T is a signed integer; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/signed_integral",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::signed_integral T>\nT absolute_value(T x) {\n    return x < 0 ? -x : x;\n}",
    seeAlso: [
      "std::integral",
      "std::unsigned_integral"
    ]
  },
  "std::unsigned_integral": {
    symbol: "std::unsigned_integral",
    canonicalSignature: "template <typename T>\nconcept unsigned_integral = std::integral<T> && !std::signed_integral<T>;",
    summary: "Specifies that T is an unsigned integral type (unsigned char, unsigned short, unsigned int, unsigned long, unsigned long long).",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check."
    },
    returns: "true if T is an unsigned integer; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/unsigned_integral",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::unsigned_integral T>\nT rotate_left(T val, unsigned int shift) {\n    constexpr unsigned int width = sizeof(T) * 8;\n    return (val << shift) | (val >> (width - shift));\n}",
    seeAlso: [
      "std::integral",
      "std::signed_integral"
    ]
  },
  "std::floating_point": {
    symbol: "std::floating_point",
    canonicalSignature: "template <typename T>\nconcept floating_point = std::is_floating_point_v<T>;",
    summary: "Specifies that T is a standard floating-point type (float, double, long double).",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check."
    },
    returns: "true if T is a floating-point type; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/floating_point",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::floating_point T>\nbool nearly_equal(T a, T b, T epsilon = static_cast<T>(1e-5)) {\n    return std::abs(a - b) <= epsilon;\n}",
    seeAlso: [
      "std::integral"
    ]
  },
  "std::assignable_from": {
    symbol: "std::assignable_from",
    canonicalSignature: "template <typename LHS, typename RHS>\nconcept assignable_from = std::is_lvalue_reference_v<LHS> && std::common_reference_with<const std::remove_reference_t<LHS>&, const std::remove_reference_t<RHS>&> && requires(LHS lhs, RHS&& rhs) { { lhs = static_cast<RHS&&>(rhs) } -> std::same_as<LHS>; };",
    summary: "Specifies that an expression of type RHS can be assigned to an lvalue of type LHS, and that the assignment preserves equality.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "LHS": "Left-hand side lvalue reference type.",
      "RHS": "Right-hand side value type."
    },
    returns: "true if RHS can be assigned to LHS; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/assignable_from",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename Target, typename Source>\nrequires std::assignable_from<Target&, Source>\nvoid assign_value(Target& dst, Source&& src) {\n    dst = std::forward<Source>(src);\n}",
    seeAlso: [
      "std::copyable",
      "std::movable"
    ]
  },
  "std::swappable": {
    symbol: "std::swappable",
    canonicalSignature: "template <typename T>\nconcept swappable = requires(T& a, T& b) { ranges::swap(a, b); };",
    summary: "Specifies that lvalues of type T can be swapped using std::ranges::swap.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type of lvalue arguments to swap."
    },
    returns: "true if lvalues of T can be swapped; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/swappable",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::swappable T>\nvoid custom_swap(T& a, T& b) {\n    std::ranges::swap(a, b);\n}",
    seeAlso: [
      "std::movable"
    ]
  },
  "std::destructible": {
    symbol: "std::destructible",
    canonicalSignature: "template <typename T>\nconcept destructible = std::is_nothrow_destructible_v<T>;",
    summary: "Specifies that objects of type T can be safely destroyed, requiring that destruction is non-throwing.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for destructibility."
    },
    returns: "true if T has a non-throwing destructor; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/destructible",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::destructible T>\nvoid clean_destroy(T* ptr) {\n    ptr->~T();\n}",
    seeAlso: [
      "std::constructible_from",
      "std::default_initializable"
    ]
  },
  "std::constructible_from": {
    symbol: "std::constructible_from",
    canonicalSignature: "template <typename T, typename... Args>\nconcept constructible_from = std::destructible<T> && std::is_constructible_v<T, Args...>;",
    summary: "Specifies that an object of type T can be initialized from the given argument types Args... and is destructible.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Target type to construct.",
      "Args": "Types of constructor arguments."
    },
    returns: "true if T can be initialized with Args...; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/constructible_from",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename T, typename... Args>\nrequires std::constructible_from<T, Args...>\nT make_object(Args&&... args) {\n    return T(std::forward<Args>(args)...);\n}",
    seeAlso: [
      "std::default_initializable",
      "std::move_constructible",
      "std::copy_constructible"
    ]
  },
  "std::default_initializable": {
    symbol: "std::default_initializable",
    canonicalSignature: "template <typename T>\nconcept default_initializable = std::constructible_from<T> && requires { T{}; ::new (static_cast<void*>(nullptr)) T; };",
    summary: "Specifies that an object of type T can be default-constructed, value-initialized, and default-initialized.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for default initializability."
    },
    returns: "true if T can be default-initialized; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/default_initializable",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::default_initializable T>\nT make_default() {\n    return T{};\n}",
    seeAlso: [
      "std::constructible_from",
      "std::semiregular"
    ]
  },
  "std::move_constructible": {
    symbol: "std::move_constructible",
    canonicalSignature: "template <typename T>\nconcept move_constructible = std::constructible_from<T, T> && std::convertible_to<T, T>;",
    summary: "Specifies that an object of type T can be constructed from an rvalue of type T, binding to rvalue references.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for move constructibility."
    },
    returns: "true if T can be move-constructed; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/move_constructible",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::move_constructible T>\nT take_and_return(T val) {\n    return std::move(val);\n}",
    seeAlso: [
      "std::copy_constructible",
      "std::movable"
    ]
  },
  "std::copy_constructible": {
    symbol: "std::copy_constructible",
    canonicalSignature: "template <typename T>\nconcept copy_constructible = std::move_constructible<T> && std::constructible_from<T, T&> && std::convertible_to<T&, T> && std::constructible_from<T, const T&> && std::convertible_to<const T&, T> && std::constructible_from<T, const T> && std::convertible_to<const T, T>;",
    summary: "Specifies that an object of type T is move constructible and can be constructed from lvalues and const references of type T.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for copy constructibility."
    },
    returns: "true if T can be copy-constructed; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/copy_constructible",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::copy_constructible T>\nstd::vector<T> duplicate(const T& item, std::size_t n) {\n    return std::vector<T>(n, item);\n}",
    seeAlso: [
      "std::move_constructible",
      "std::copyable"
    ]
  },
  "std::equality_comparable": {
    symbol: "std::equality_comparable",
    canonicalSignature: "template <typename T>\nconcept equality_comparable = requires(const std::remove_reference_t<T>& a, const std::remove_reference_t<T>& b) { { a == b } -> std::convertible_to<bool>; { a != b } -> std::convertible_to<bool>; };",
    summary: "Specifies that the comparison operators == and != are defined for type T and yield equality-preserving boolean results.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for equality comparison."
    },
    returns: "true if instances of T can be compared with == and !=; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/equality_comparable",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::equality_comparable T>\nbool is_same(const T& a, const T& b) {\n    return a == b;\n}",
    seeAlso: [
      "std::totally_ordered",
      "std::regular"
    ]
  },
  "std::totally_ordered": {
    symbol: "std::totally_ordered",
    canonicalSignature: "template <typename T>\nconcept totally_ordered = std::equality_comparable<T> && requires(const std::remove_reference_t<T>& a, const std::remove_reference_t<T>& b) { { a < b } -> std::convertible_to<bool>; { a > b } -> std::convertible_to<bool>; { a <= b } -> std::convertible_to<bool>; { a >= b } -> std::convertible_to<bool>; };",
    summary: "Specifies that comparison operators ==, !=, <, >, <=, and >= define a strict total ordering on type T.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for total ordering."
    },
    returns: "true if T supports total order comparisons; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/totally_ordered",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::totally_ordered T>\nconst T& clamp(const T& v, const T& lo, const T& hi) {\n    return v < lo ? lo : (hi < v ? hi : v);\n}",
    seeAlso: [
      "std::equality_comparable",
      "std::regular"
    ]
  },
  "std::movable": {
    symbol: "std::movable",
    canonicalSignature: "template <typename T>\nconcept movable = std::is_object_v<T> && std::move_constructible<T> && std::assignable_from<T&, T> && std::swappable<T>;",
    summary: "Specifies that an object of type T can be moved, assigned from an rvalue, and swapped.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for movable semantics."
    },
    returns: "true if T is an object type with move construction, move assignment, and swap; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/movable",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::movable T>\nclass ResourceHolder {\n    T resource;\npublic:\n    explicit ResourceHolder(T res) : resource(std::move(res)) {}\n};",
    seeAlso: [
      "std::move_constructible",
      "std::copyable"
    ]
  },
  "std::copyable": {
    symbol: "std::copyable",
    canonicalSignature: "template <typename T>\nconcept copyable = std::copy_constructible<T> && std::movable<T> && std::assignable_from<T&, T&> && std::assignable_from<T&, const T&> && std::assignable_from<T&, const T>;",
    summary: "Specifies that type T is movable, copy constructible, and supports copy assignment from lvalues.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for copyable semantics."
    },
    returns: "true if T is copyable and movable; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/copyable",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::copyable T>\nT clone_and_modify(const T& src) {\n    T copy = src;\n    return copy;\n}",
    seeAlso: [
      "std::copy_constructible",
      "std::semiregular",
      "std::regular"
    ]
  },
  "std::semiregular": {
    symbol: "std::semiregular",
    canonicalSignature: "template <typename T>\nconcept semiregular = std::copyable<T> && std::default_initializable<T>;",
    summary: "Specifies that type T is copyable and default initializable. Models types that behave like built-in types without requiring equality comparison.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for semiregularity."
    },
    returns: "true if T is copyable and default-initializable; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/semiregular",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::semiregular T>\nstruct Buffer {\n    T value{};\n};",
    seeAlso: [
      "std::regular",
      "std::copyable"
    ]
  },
  "std::regular": {
    symbol: "std::regular",
    canonicalSignature: "template <typename T>\nconcept regular = std::semiregular<T> && std::equality_comparable<T>;",
    summary: "Specifies that type T is semiregular (copyable, default initializable) and equality comparable. Models standard value types.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "T": "Type to check for regularity."
    },
    returns: "true if T is regular; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/regular",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <std::regular T>\nbool values_match(const T& a, const T& b) {\n    return a == b;\n}",
    seeAlso: [
      "std::semiregular",
      "std::equality_comparable"
    ]
  },
  "std::invocable": {
    symbol: "std::invocable",
    canonicalSignature: "template <typename F, typename... Args>\nconcept invocable = requires(F&& f, Args&&... args) { std::invoke(std::forward<F>(f), std::forward<Args>(args)...); };",
    summary: "Specifies that a callable F can be invoked with argument types Args... using std::invoke.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "F": "Callable function, lambda, or functor type.",
      "Args": "Argument types forwarded to F."
    },
    returns: "true if F can be invoked with Args...; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/invocable",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename F, typename... Args>\nrequires std::invocable<F, Args...>\ndecltype(auto) execute(F&& f, Args&&... args) {\n    return std::invoke(std::forward<F>(f), std::forward<Args>(args)...);\n}",
    seeAlso: [
      "std::predicate"
    ]
  },
  "std::predicate": {
    symbol: "std::predicate",
    canonicalSignature: "template <typename F, typename... Args>\nconcept predicate = std::regular_invocable<F, Args...> && requires(F&& f, Args&&... args) { { std::invoke(std::forward<F>(f), std::forward<Args>(args)...) } -> std::convertible_to<bool>; };",
    summary: "Specifies that callable F is an invocable callable with argument types Args... that returns a boolean-convertible value without modifying arguments.",
    header: "<concepts>",
    standard: "C++20",
    parameters: {
      "F": "Callable predicate type.",
      "Args": "Argument types evaluated by predicate."
    },
    returns: "true if F is a valid predicate callable; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/concepts/predicate",
    complexity: {
      time: "O(1) compile-time constraint evaluation"
    },
    exceptionSafety: "Compile-time concept constraint with zero runtime execution or exceptions.",
    example: "template <typename T, typename Pred>\nrequires std::predicate<Pred, const T&>\nstd::vector<T> filter(const std::vector<T>& vec, Pred pred) {\n    std::vector<T> result;\n    for (const auto& item : vec) {\n        if (pred(item)) result.push_back(item);\n    }\n    return result;\n}",
    seeAlso: [
      "std::invocable"
    ]
  }
};

export const conceptsModule: StlHeaderModule = {
  id: 'concepts',
  headers: ["<concepts>"],
  entries: CONCEPTS_ENTRIES
};
