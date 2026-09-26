import { StlDocEntry, StlHeaderModule } from '../types';

export const NUMERIC_ENTRIES: Record<string, StlDocEntry> = {
  'std::accumulate': {
    symbol: 'std::accumulate',
    canonicalSignature: 'template <typename InputIt, typename T>\nconstexpr T accumulate(InputIt first, InputIt last, T init);\n\ntemplate <typename InputIt, typename T, typename BinaryOp>\nconstexpr T accumulate(InputIt first, InputIt last, T init, BinaryOp op);',
    summary: 'Computes the sum or fold of the given initial value init and the elements in the range [first, last) sequentially.',
    header: '<numeric>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Beginning of sequence to accumulate',
      last: 'End of sequence to accumulate',
      init: 'Initial value of the accumulator',
      op: 'Binary operation function object'
    },
    returns: 'Accumulated fold value.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/accumulate',
    complexity: { time: 'O(N) applications of binary operation' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> v = {1, 2, 3, 4, 5};\nint sum = std::accumulate(v.begin(), v.end(), 0); // 15\nint prod = std::accumulate(v.begin(), v.end(), 1, std::multiplies<int>{}); // 120',
    seeAlso: ['std::reduce', 'std::transform_reduce', 'std::inner_product']
  },
  'std::inner_product': {
    symbol: 'std::inner_product',
    canonicalSignature: 'template <typename InputIt1, typename InputIt2, typename T>\nconstexpr T inner_product(InputIt1 first1, InputIt1 last1, InputIt2 first2, T init);\n\ntemplate <typename InputIt1, typename InputIt2, typename T, typename BinaryOp1, typename BinaryOp2>\nconstexpr T inner_product(InputIt1 first1, InputIt1 last1, InputIt2 first2, T init, BinaryOp1 op1, BinaryOp2 op2);',
    summary: 'Computes the inner product (dot product) of two ranges by multiplying corresponding elements and accumulating their sum onto init.',
    header: '<numeric>',
    standard: 'C++98 / C++20',
    parameters: {
      first1: 'Beginning of first range',
      last1: 'End of first range',
      first2: 'Beginning of second range',
      init: 'Initial value of the accumulation',
      op1: 'Binary operation applied to accumulated sum and product',
      op2: 'Binary operation applied to element pairs'
    },
    returns: 'Accumulated inner product value.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/inner_product',
    complexity: { time: 'O(N) multiplications and additions' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> a = {1, 2, 3};\nstd::vector<int> b = {4, 5, 6};\nint dot = std::inner_product(a.begin(), a.end(), b.begin(), 0); // 32',
    seeAlso: ['std::accumulate', 'std::transform_reduce']
  },
  'std::adjacent_difference': {
    symbol: 'std::adjacent_difference',
    canonicalSignature: 'template <typename InputIt, typename OutputIt>\nconstexpr OutputIt adjacent_difference(InputIt first, InputIt last, OutputIt d_first);\n\ntemplate <typename InputIt, typename OutputIt, typename BinaryOp>\nconstexpr OutputIt adjacent_difference(InputIt first, InputIt last, OutputIt d_first, BinaryOp op);',
    summary: 'Computes the differences between adjacent elements in the range [first, last) and writes the results to d_first.',
    header: '<numeric>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Beginning of source range',
      last: 'End of source range',
      d_first: 'Beginning of destination range',
      op: 'Binary operator computing difference'
    },
    returns: 'Output iterator pointing past the last written element.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/adjacent_difference',
    complexity: { time: 'O(N) operations' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> v = {1, 4, 9, 16};\nstd::vector<int> diffs(v.size());\nstd::adjacent_difference(v.begin(), v.end(), diffs.begin()); // {1, 3, 5, 7}',
    seeAlso: ['std::partial_sum', 'std::accumulate']
  },
  'std::partial_sum': {
    symbol: 'std::partial_sum',
    canonicalSignature: 'template <typename InputIt, typename OutputIt>\nconstexpr OutputIt partial_sum(InputIt first, InputIt last, OutputIt d_first);\n\ntemplate <typename InputIt, typename OutputIt, typename BinaryOp>\nconstexpr OutputIt partial_sum(InputIt first, InputIt last, OutputIt d_first, BinaryOp op);',
    summary: 'Computes the partial sums of the elements in the subranges of [first, last) and writes them to d_first.',
    header: '<numeric>',
    standard: 'C++98 / C++20',
    parameters: {
      first: 'Beginning of source range',
      last: 'End of source range',
      d_first: 'Beginning of destination range',
      op: 'Binary operation'
    },
    returns: 'Output iterator pointing past the last written element.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/partial_sum',
    complexity: { time: 'O(N) additions' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> v = {1, 2, 3, 4};\nstd::vector<int> prefix(v.size());\nstd::partial_sum(v.begin(), v.end(), prefix.begin()); // {1, 3, 6, 10}',
    seeAlso: ['std::inclusive_scan', 'std::adjacent_difference']
  },
  'std::iota': {
    symbol: 'std::iota',
    canonicalSignature: 'template <typename ForwardIt, typename T>\nconstexpr void iota(ForwardIt first, ForwardIt last, T value);',
    summary: 'Fills the range [first, last) with sequentially incrementing values starting from value (value, ++value, ...).',
    header: '<numeric>',
    standard: 'C++11 / C++20',
    parameters: {
      first: 'Beginning of range to fill',
      last: 'End of range to fill',
      value: 'Initial starting value to assign and increment'
    },
    returns: 'void.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/iota',
    complexity: { time: 'O(N) assignments and increments' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> indices(10);\nstd::iota(indices.begin(), indices.end(), 0); // {0, 1, 2, ..., 9}',
    seeAlso: ['std::fill', 'std::generate']
  },
  'std::gcd': {
    symbol: 'std::gcd',
    canonicalSignature: 'template <typename M, typename N>\nconstexpr std::common_type_t<M, N> gcd(M m, N n);',
    summary: 'Computes the greatest common divisor of integers m and n at compile-time or runtime using the Euclidean algorithm.',
    header: '<numeric>',
    standard: 'C++17',
    parameters: {
      m: 'First integer value',
      n: 'Second integer value'
    },
    returns: 'Greatest common divisor |gcd(m, n)|.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/gcd',
    complexity: { time: 'O(log(min(m, n))) operations' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'constexpr int g = std::gcd(24, 36); // 12',
    seeAlso: ['std::lcm']
  },
  'std::lcm': {
    symbol: 'std::lcm',
    canonicalSignature: 'template <typename M, typename N>\nconstexpr std::common_type_t<M, N> lcm(M m, N n);',
    summary: 'Computes the least common multiple of integers m and n.',
    header: '<numeric>',
    standard: 'C++17',
    parameters: {
      m: 'First integer value',
      n: 'Second integer value'
    },
    returns: 'Least common multiple |lcm(m, n)|.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/lcm',
    complexity: { time: 'O(log(min(m, n))) operations' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'constexpr int l = std::lcm(4, 6); // 12',
    seeAlso: ['std::gcd']
  },
  'std::midpoint': {
    symbol: 'std::midpoint',
    canonicalSignature: 'template <typename T>\nconstexpr T midpoint(T a, T b) noexcept;',
    summary: 'Computes the midpoint (halfway point) of two integers, floating-point numbers, or pointers without intermediate overflow.',
    header: '<numeric>',
    standard: 'C++20',
    parameters: {
      a: 'First value or pointer',
      b: 'Second value or pointer'
    },
    returns: 'Halfway value between a and b.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/midpoint',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int mid = std::midpoint(100, 200); // 150',
    seeAlso: ['std::lerp']
  },
  'std::reduce': {
    symbol: 'std::reduce',
    canonicalSignature: 'template <typename InputIt>\nconstexpr typename std::iterator_traits<InputIt>::value_type reduce(InputIt first, InputIt last);\n\ntemplate <typename ExecutionPolicy, typename ForwardIt, typename T, typename BinaryOp>\nT reduce(ExecutionPolicy&& policy, ForwardIt first, ForwardIt last, T init, BinaryOp binary_op);',
    summary: 'Computes the generalized sum/reduction of elements in the range [first, last). Unlike std::accumulate, elements may be grouped and rearranged arbitrarily, enabling parallel execution.',
    header: '<numeric>',
    standard: 'C++17',
    parameters: {
      first: 'Beginning of sequence',
      last: 'End of sequence',
      init: 'Initial accumulator value',
      binary_op: 'Associative and commutative binary operation',
      policy: 'Execution policy (e.g. std::execution::par)'
    },
    returns: 'Reduced result of applying binary_op.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/reduce',
    complexity: { time: 'O(N) operations, parallelizable across CPU cores' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> v = {1, 2, 3, 4, 5};\nint sum = std::reduce(std::execution::par, v.begin(), v.end(), 0); // 15',
    seeAlso: ['std::accumulate', 'std::transform_reduce']
  },
  'std::transform_reduce': {
    symbol: 'std::transform_reduce',
    canonicalSignature: 'template <typename InputIt1, typename InputIt2, typename T, typename BinaryOp1, typename BinaryOp2>\nconstexpr T transform_reduce(InputIt1 first1, InputIt1 last1, InputIt2 first2, T init, BinaryOp1 reduce_op, BinaryOp2 transform_op);\n\ntemplate <typename ExecutionPolicy, typename ForwardIt, typename T, typename BinaryOp, typename UnaryOp>\nT transform_reduce(ExecutionPolicy&& policy, ForwardIt first, ForwardIt last, T init, BinaryOp reduce_op, UnaryOp transform_op);',
    summary: 'Transforms elements with unary/binary operator and reduces the results using binary reduction operator. Parallelized equivalent of std::inner_product.',
    header: '<numeric>',
    standard: 'C++17',
    parameters: {
      first1: 'Beginning of first range',
      last1: 'End of first range',
      first2: 'Beginning of second range',
      init: 'Initial reduction value',
      reduce_op: 'Associative and commutative reduction operator',
      transform_op: 'Transformation operator',
      policy: 'Execution policy'
    },
    returns: 'Final reduced value.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/transform_reduce',
    complexity: { time: 'O(N) operations, parallelizable' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> v = {1, 2, 3, 4};\nint sum_sq = std::transform_reduce(v.begin(), v.end(), 0, std::plus<>{}, [](int x) { return x * x; }); // 30',
    seeAlso: ['std::reduce', 'std::inner_product']
  },
  'std::inclusive_scan': {
    symbol: 'std::inclusive_scan',
    canonicalSignature: 'template <typename InputIt, typename OutputIt>\nOutputIt inclusive_scan(InputIt first, InputIt last, OutputIt d_first);\n\ntemplate <typename ExecutionPolicy, typename ForwardIt1, typename ForwardIt2, typename BinaryOp>\nForwardIt2 inclusive_scan(ExecutionPolicy&& policy, ForwardIt1 first, ForwardIt1 last, ForwardIt2 d_first, BinaryOp binary_op);',
    summary: 'Computes an inclusive prefix scan (prefix sum including the current element) on the range [first, last), writing results to d_first. Parallelizable.',
    header: '<numeric>',
    standard: 'C++17',
    parameters: {
      first: 'Beginning of input range',
      last: 'End of input range',
      d_first: 'Beginning of output destination range',
      binary_op: 'Associative binary operator',
      policy: 'Execution policy'
    },
    returns: 'Iterator pointing to the element past the last written element.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/inclusive_scan',
    complexity: { time: 'O(N) operations' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> v = {1, 2, 3, 4};\nstd::vector<int> out(v.size());\nstd::inclusive_scan(v.begin(), v.end(), out.begin()); // {1, 3, 6, 10}',
    seeAlso: ['std::exclusive_scan', 'std::partial_sum']
  },
  'std::exclusive_scan': {
    symbol: 'std::exclusive_scan',
    canonicalSignature: 'template <typename InputIt, typename OutputIt, typename T>\nOutputIt exclusive_scan(InputIt first, InputIt last, OutputIt d_first, T init);\n\ntemplate <typename ExecutionPolicy, typename ForwardIt1, typename ForwardIt2, typename T, typename BinaryOp>\nForwardIt2 exclusive_scan(ExecutionPolicy&& policy, ForwardIt1 first, ForwardIt1 last, ForwardIt2 d_first, T init, BinaryOp binary_op);',
    summary: 'Computes an exclusive prefix scan (prefix sum excluding the current element, with init as the 0-th element) on [first, last). Parallelizable.',
    header: '<numeric>',
    standard: 'C++17',
    parameters: {
      first: 'Beginning of input range',
      last: 'End of input range',
      d_first: 'Beginning of output destination range',
      init: 'Initial value for 0-th element',
      binary_op: 'Associative binary operator',
      policy: 'Execution policy'
    },
    returns: 'Iterator pointing to the element past the last written element.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/exclusive_scan',
    complexity: { time: 'O(N) operations' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::vector<int> v = {1, 2, 3, 4};\nstd::vector<int> out(v.size());\nstd::exclusive_scan(v.begin(), v.end(), out.begin(), 0); // {0, 1, 3, 6}',
    seeAlso: ['std::inclusive_scan', 'std::partial_sum']
  }
};

export const numericModule: StlHeaderModule = {
  id: 'numeric',
  headers: ['<numeric>'],
  entries: NUMERIC_ENTRIES
};
