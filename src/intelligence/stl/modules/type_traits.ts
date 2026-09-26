import { StlDocEntry, StlHeaderModule } from '../types';

export const TYPE_TRAITS_ENTRIES: Record<string, StlDocEntry> = {
  "std::is_same_v": {
    symbol: "std::is_same_v",
    canonicalSignature: "template <typename T, typename U>\ninline constexpr bool is_same_v = std::is_same<T, U>::value;",
    summary: "Compile-time boolean constant that evaluates to true if T and U denote the exact same type, including const and volatile qualifiers.",
    header: "<type_traits>",
    standard: "C++17",
    parameters: {
      "T": "First type to compare.",
      "U": "Second type to compare."
    },
    returns: "true if T and U are identical types; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/types/is_same",
    complexity: {
      time: "O(1) compile-time evaluation"
    },
    exceptionSafety: "Compile-time constant; no runtime execution or exceptions.",
    example: "static_assert(std::is_same_v<int, int>);\nstatic_assert(!std::is_same_v<int, const int>);",
    seeAlso: [
      "std::same_as",
      "std::is_base_of_v"
    ]
  },
  "std::is_base_of_v": {
    symbol: "std::is_base_of_v",
    canonicalSignature: "template <typename Base, typename Derived>\ninline constexpr bool is_base_of_v = std::is_base_of<Base, Derived>::value;",
    summary: "Compile-time boolean constant that evaluates to true if Base is a base class of Derived (or both denote the same non-union class type), ignoring cv-qualifiers.",
    header: "<type_traits>",
    standard: "C++17",
    parameters: {
      "Base": "Potential base class type.",
      "Derived": "Potential derived class type."
    },
    returns: "true if Base is a base of Derived; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/types/is_base_of",
    complexity: {
      time: "O(1) compile-time evaluation"
    },
    exceptionSafety: "Compile-time constant; no runtime execution or exceptions.",
    example: "struct Animal {};\nstruct Dog : Animal {};\nstatic_assert(std::is_base_of_v<Animal, Dog>);",
    seeAlso: [
      "std::derived_from",
      "std::is_convertible_v"
    ]
  },
  "std::is_convertible_v": {
    symbol: "std::is_convertible_v",
    canonicalSignature: "template <typename From, typename To>\ninline constexpr bool is_convertible_v = std::is_convertible<From, To>::value;",
    summary: "Compile-time boolean constant that evaluates to true if an imaginary expression of type From can be implicitly converted to type To.",
    header: "<type_traits>",
    standard: "C++17",
    parameters: {
      "From": "Source type.",
      "To": "Destination type."
    },
    returns: "true if From is implicitly convertible to To; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/types/is_convertible",
    complexity: {
      time: "O(1) compile-time evaluation"
    },
    exceptionSafety: "Compile-time constant; no runtime execution or exceptions.",
    example: "static_assert(std::is_convertible_v<const char*, std::string>);\nstatic_assert(!std::is_convertible_v<std::string, int>);",
    seeAlso: [
      "std::convertible_to",
      "std::is_same_v"
    ]
  },
  "std::is_pointer_v": {
    symbol: "std::is_pointer_v",
    canonicalSignature: "template <typename T>\ninline constexpr bool is_pointer_v = std::is_pointer<T>::value;",
    summary: "Compile-time boolean constant that evaluates to true if T is a raw pointer type (including function pointers and pointers to incomplete types, but excluding member pointers).",
    header: "<type_traits>",
    standard: "C++17",
    parameters: {
      "T": "Type to check."
    },
    returns: "true if T is a pointer type; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/types/is_pointer",
    complexity: {
      time: "O(1) compile-time evaluation"
    },
    exceptionSafety: "Compile-time constant; no runtime execution or exceptions.",
    example: "static_assert(std::is_pointer_v<int*>);\nstatic_assert(std::is_pointer_v<void (*)(int)>);\nstatic_assert(!std::is_pointer_v<std::unique_ptr<int>>);",
    seeAlso: [
      "std::add_pointer_t",
      "std::is_reference_v"
    ]
  },
  "std::is_reference_v": {
    symbol: "std::is_reference_v",
    canonicalSignature: "template <typename T>\ninline constexpr bool is_reference_v = std::is_reference<T>::value;",
    summary: "Compile-time boolean constant that evaluates to true if T is an lvalue reference or rvalue reference type.",
    header: "<type_traits>",
    standard: "C++17",
    parameters: {
      "T": "Type to check."
    },
    returns: "true if T is an lvalue or rvalue reference; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/types/is_reference",
    complexity: {
      time: "O(1) compile-time evaluation"
    },
    exceptionSafety: "Compile-time constant; no runtime execution or exceptions.",
    example: "static_assert(std::is_reference_v<int&>);\nstatic_assert(std::is_reference_v<int&&>);\nstatic_assert(!std::is_reference_v<int>);",
    seeAlso: [
      "std::remove_reference_t",
      "std::remove_cvref_t"
    ]
  },
  "std::is_const_v": {
    symbol: "std::is_const_v",
    canonicalSignature: "template <typename T>\ninline constexpr bool is_const_v = std::is_const<T>::value;",
    summary: "Compile-time boolean constant that evaluates to true if T has top-level const qualification. Reference types are not const; check std::remove_reference_t<T> instead.",
    header: "<type_traits>",
    standard: "C++17",
    parameters: {
      "T": "Type to check."
    },
    returns: "true if T has top-level const qualifier; false otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/types/is_const",
    complexity: {
      time: "O(1) compile-time evaluation"
    },
    exceptionSafety: "Compile-time constant; no runtime execution or exceptions.",
    example: "static_assert(std::is_const_v<const int>);\nstatic_assert(!std::is_const_v<int>);\nstatic_assert(!std::is_const_v<const int&>); // top-level type is reference",
    seeAlso: [
      "std::as_const",
      "std::remove_cvref_t"
    ]
  },
  "std::decay_t": {
    symbol: "std::decay_t",
    canonicalSignature: "template <typename T>\nusing decay_t = typename std::decay<T>::type;",
    summary: "Applies type transformations equivalent to pass-by-value conversion: strips references, removes top-level cv-qualifiers, converts array types to pointers, and converts function types to function pointers.",
    header: "<type_traits>",
    standard: "C++14",
    parameters: {
      "T": "Type to decay."
    },
    returns: "The decayed type.",
    docUrl: "https://en.cppreference.com/w/cpp/types/decay",
    complexity: {
      time: "O(1) compile-time type transformation"
    },
    exceptionSafety: "Compile-time alias; no runtime cost or exceptions.",
    example: "using Raw = std::decay_t<const int&>; // int\nusing Ptr = std::decay_t<int[5]>; // int*",
    seeAlso: [
      "std::remove_cvref_t",
      "std::remove_reference_t"
    ]
  },
  "std::remove_reference_t": {
    symbol: "std::remove_reference_t",
    canonicalSignature: "template <typename T>\nusing remove_reference_t = typename std::remove_reference<T>::type;",
    summary: "Strips lvalue reference (&) and rvalue reference (&&) from type T, yielding the underlying non-reference type.",
    header: "<type_traits>",
    standard: "C++14",
    parameters: {
      "T": "Type to strip reference from."
    },
    returns: "Underlying type without reference qualifiers.",
    docUrl: "https://en.cppreference.com/w/cpp/types/remove_reference",
    complexity: {
      time: "O(1) compile-time type transformation"
    },
    exceptionSafety: "Compile-time alias; no runtime cost or exceptions.",
    example: "static_assert(std::is_same_v<std::remove_reference_t<int&>, int>);\nstatic_assert(std::is_same_v<std::remove_reference_t<int&&>, int>);",
    seeAlso: [
      "std::move",
      "std::remove_cvref_t"
    ]
  },
  "std::remove_cvref_t": {
    symbol: "std::remove_cvref_t",
    canonicalSignature: "template <typename T>\nusing remove_cvref_t = std::remove_cv_t<std::remove_reference_t<T>>;",
    summary: "Removes top-level const, volatile, and reference qualifiers from type T. Equivalent to std::remove_cv_t<std::remove_reference_t<T>>.",
    header: "<type_traits>",
    standard: "C++20",
    parameters: {
      "T": "Type to strip cv and reference qualifiers from."
    },
    returns: "Clean value type without const, volatile, or reference qualifiers.",
    docUrl: "https://en.cppreference.com/w/cpp/types/remove_cvref",
    complexity: {
      time: "O(1) compile-time type transformation"
    },
    exceptionSafety: "Compile-time alias; no runtime cost or exceptions.",
    example: "static_assert(std::is_same_v<std::remove_cvref_t<const int&>, int>);\nstatic_assert(std::is_same_v<std::remove_cvref_t<volatile double&&>, double>);",
    seeAlso: [
      "std::decay_t",
      "std::remove_reference_t"
    ]
  },
  "std::add_pointer_t": {
    symbol: "std::add_pointer_t",
    canonicalSignature: "template <typename T>\nusing add_pointer_t = typename std::add_pointer<T>::type;",
    summary: "Constructs a pointer type to T. If T is a reference, the reference is removed before constructing a pointer.",
    header: "<type_traits>",
    standard: "C++14",
    parameters: {
      "T": "Target pointed-to type."
    },
    returns: "T* or std::remove_reference_t<T>*.",
    docUrl: "https://en.cppreference.com/w/cpp/types/add_pointer",
    complexity: {
      time: "O(1) compile-time type transformation"
    },
    exceptionSafety: "Compile-time alias; no runtime cost or exceptions.",
    example: "static_assert(std::is_same_v<std::add_pointer_t<int>, int*>);\nstatic_assert(std::is_same_v<std::add_pointer_t<int&>, int*>);",
    seeAlso: [
      "std::is_pointer_v"
    ]
  },
  "std::enable_if_t": {
    symbol: "std::enable_if_t",
    canonicalSignature: "template <bool B, typename T = void>\nusing enable_if_t = typename std::enable_if<B, T>::type;",
    summary: "SFINAE type selector that defines member type as T if boolean condition B is true; otherwise has no member type, eliminating the candidate overload from overload resolution.",
    header: "<type_traits>",
    standard: "C++14",
    parameters: {
      "B": "Compile-time boolean condition.",
      "T": "Type defined if B is true (defaults to void)."
    },
    returns: "Type T if B is true; causes SFINAE substitution failure if false.",
    docUrl: "https://en.cppreference.com/w/cpp/types/enable_if",
    complexity: {
      time: "O(1) compile-time SFINAE evaluation"
    },
    exceptionSafety: "Compile-time alias; no runtime cost or exceptions.",
    example: "template <typename T, typename = std::enable_if_t<std::is_integral_v<T>>>\nvoid process(T val) {\n    std::println(\"Integer: {}\", val);\n}",
    seeAlso: [
      "std::conditional_t",
      "std::void_t"
    ]
  },
  "std::conditional_t": {
    symbol: "std::conditional_t",
    canonicalSignature: "template <bool B, typename TrueType, typename FalseType>\nusing conditional_t = typename std::conditional<B, TrueType, FalseType>::type;",
    summary: "Compile-time conditional type selector. Chooses TrueType if condition B is true, or FalseType if condition B is false.",
    header: "<type_traits>",
    standard: "C++14",
    parameters: {
      "B": "Compile-time boolean selector.",
      "TrueType": "Type selected if B is true.",
      "FalseType": "Type selected if B is false."
    },
    returns: "TrueType if B is true; FalseType otherwise.",
    docUrl: "https://en.cppreference.com/w/cpp/types/conditional",
    complexity: {
      time: "O(1) compile-time type selection"
    },
    exceptionSafety: "Compile-time alias; no runtime cost or exceptions.",
    example: "template <bool IsConst>\nusing Handle = std::conditional_t<IsConst, const int*, int*>;",
    seeAlso: [
      "std::enable_if_t"
    ]
  },
  "std::void_t": {
    symbol: "std::void_t",
    canonicalSignature: "template <typename... Types>\nusing void_t = void;",
    summary: "Utility meta-function that maps any sequence of types to void. Widely used in SFINAE detection idioms to check for valid member types or expressions.",
    header: "<type_traits>",
    standard: "C++17",
    parameters: {
      "Types": "Zero or more types to map to void."
    },
    returns: "void type.",
    docUrl: "https://en.cppreference.com/w/cpp/types/void_t",
    complexity: {
      time: "O(1) compile-time mapping"
    },
    exceptionSafety: "Compile-time alias; no runtime cost or exceptions.",
    example: "template <typename T, typename = void>\nstruct has_size : std::false_type {};\n\ntemplate <typename T>\nstruct has_size<T, std::void_t<decltype(std::declval<T>().size())>> : std::true_type {};",
    seeAlso: [
      "std::enable_if_t"
    ]
  }
};

export const typeTraitsModule: StlHeaderModule = {
  id: 'type_traits',
  headers: ["<type_traits>"],
  entries: TYPE_TRAITS_ENTRIES
};
