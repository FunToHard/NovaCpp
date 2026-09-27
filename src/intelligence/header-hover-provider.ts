import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getStlEntriesByHeader, StlDocEntry } from './stl-knowledge-base';
import { StlRemoteProvider } from './stl-remote-provider';

export interface ParsedIncludeDirective {
  headerText: string;
  headerName: string;
  isStandard: boolean;
  range: vscode.Range;
}

export interface LocalHeaderSymbol {
  name: string;
  kind: 'class' | 'struct' | 'concept' | 'enum' | 'function' | 'type_alias';
  signature?: string;
  returnType?: string;
  description?: string;
}

export interface StandardHeaderMetadata {
  summary: string;
  standard: string;
  docUrl: string;
  primarySymbols?: string[];
  libraryType?: 'c' | 'cpp' | 'win32' | 'posix';
}

/**
 * Curated catalog of standard ISO C++, C standard library, Windows SDK, and POSIX headers.
 */
export const STANDARD_HEADER_CATALOG: Record<string, StandardHeaderMetadata> = {
  // --- ISO C++ Standard Library Headers ---
  vector: {
    summary: 'Sequence container that encapsulates dynamic size contiguous arrays with fast random access and amortized O(1) push_back/pop_back.',
    standard: 'C++98 / C++11 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/container/vector',
    libraryType: 'cpp'
  },
  string: {
    summary: 'Standard sequence container for character sequences, providing contiguous storage, dynamic sizing, and search utilities.',
    standard: 'C++98 / C++11 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string',
    libraryType: 'cpp'
  },
  string_view: {
    summary: 'Non-owning zero-copy view of a contiguous character sequence with constant time subview operations.',
    standard: 'C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/string/basic_string_view',
    libraryType: 'cpp'
  },
  span: {
    summary: 'Non-owning contiguous view of a sequence of objects with compile-time or dynamic bounds.',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/container/span',
    libraryType: 'cpp'
  },
  array: {
    summary: 'Fixed-size sequence container that wraps a native C-style array with standard container semantics and zero overhead.',
    standard: 'C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/container/array',
    libraryType: 'cpp'
  },
  deque: {
    summary: 'Double-ended queue sequence container allowing indexed random access and amortized O(1) insertions/erasures at both ends.',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/container/deque',
    libraryType: 'cpp'
  },
  list: {
    summary: 'Doubly-linked list container supporting O(1) insertions and element relocations anywhere in the container.',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/container/list',
    libraryType: 'cpp'
  },
  forward_list: {
    summary: 'Singly-linked list container with minimal memory overhead, supporting fast O(1) insertions after an element.',
    standard: 'C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/container/forward_list',
    libraryType: 'cpp'
  },
  map: {
    summary: 'Sorted associative container containing unique key-value pairs backed by self-balancing red-black binary search trees with O(log N) lookup.',
    standard: 'C++98 / C++11 / C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/container/map',
    libraryType: 'cpp'
  },
  set: {
    summary: 'Sorted associative container containing unique keys backed by self-balancing binary search trees with O(log N) search operations.',
    standard: 'C++98 / C++11 / C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/container/set',
    libraryType: 'cpp'
  },
  unordered_map: {
    summary: 'Unordered associative container containing key-value pairs backed by hash tables with average O(1) lookup.',
    standard: 'C++11 / C++17 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/container/unordered_map',
    libraryType: 'cpp'
  },
  unordered_set: {
    summary: 'Unordered associative container containing unique keys backed by hash tables with average O(1) search performance.',
    standard: 'C++11 / C++17 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/container/unordered_set',
    libraryType: 'cpp'
  },
  queue: {
    summary: 'Container adaptor providing FIFO (first-in first-out) queue data structure operations.',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/container/queue',
    libraryType: 'cpp'
  },
  stack: {
    summary: 'Container adaptor providing LIFO (last-in first-out) stack data structure operations.',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/container/stack',
    libraryType: 'cpp'
  },
  algorithm: {
    summary: 'Collection of algorithmic functions for sequence ranges, including sorting, binary searching, partitioning, transformations, and counting.',
    standard: 'C++98 / C++11 / C++17 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm',
    libraryType: 'cpp'
  },
  numeric: {
    summary: 'Generalized numeric operations on ranges (accumulate, reduce, transform_reduce, iota, inner_product, gcd, lcm, midpoint).',
    standard: 'C++98 / C++17 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric',
    libraryType: 'cpp'
  },
  memory: {
    summary: 'General-purpose smart pointers (std::unique_ptr, std::shared_ptr, std::weak_ptr), allocators, and uninitialized memory manipulation.',
    standard: 'C++98 / C++11 / C++14 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/memory',
    libraryType: 'cpp'
  },
  memory_resource: {
    summary: 'Polymorphic memory resources (PMR) and configurable memory allocation arenas with fast monotonic and pool strategies.',
    standard: 'C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/pmr',
    libraryType: 'cpp'
  },
  utility: {
    summary: 'General utility facilities including std::move, std::forward, std::pair, std::exchange, std::tuple, and integer sequence generation.',
    standard: 'C++98 / C++11 / C++14 / C++17 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/utility',
    libraryType: 'cpp'
  },
  tuple: {
    summary: 'Fixed-size heterogeneous collection of values with compile-time indexing, structured binding support, and tie operations.',
    standard: 'C++11 / C++14 / C++17 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/tuple',
    libraryType: 'cpp'
  },
  optional: {
    summary: 'Vocabulary type managing an optional contained value that may or may not be present, eliminating null pointer ambiguity.',
    standard: 'C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/optional',
    libraryType: 'cpp'
  },
  variant: {
    summary: 'Type-safe union container holding one value out of a predefined list of alternatives with visitor pattern support.',
    standard: 'C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/variant',
    libraryType: 'cpp'
  },
  any: {
    summary: 'Type-safe container for single values of any copy-constructible type with safe any_cast runtime extraction.',
    standard: 'C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/any',
    libraryType: 'cpp'
  },
  iterator: {
    summary: 'Iterator primitives, iterator categories, iterator adaptors, reverse iterators, and stream iterators.',
    standard: 'C++98 / C++11 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/iterator',
    libraryType: 'cpp'
  },
  ranges: {
    summary: 'Range algorithms, views, pipelines, and adaptors providing lazy, composable sequence processing without intermediate allocations.',
    standard: 'C++20 / C++23',
    docUrl: 'https://en.cppreference.com/w/cpp/ranges',
    libraryType: 'cpp'
  },
  concepts: {
    summary: 'Fundamental library concepts for template argument constraints, verifying type traits and syntactic capabilities at compile time.',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/concepts',
    libraryType: 'cpp'
  },
  type_traits: {
    summary: 'Compile-time type transformation, reflection, and type property query templates.',
    standard: 'C++11 / C++14 / C++17 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/header/type_traits',
    libraryType: 'cpp'
  },
  chrono: {
    summary: 'Date and time library containing clocks, durations, time points, calendar systems, and time zone utilities.',
    standard: 'C++11 / C++14 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono',
    libraryType: 'cpp'
  },
  filesystem: {
    summary: 'Facilities for performing operations on file systems and their components, such as paths, regular files, and directories.',
    standard: 'C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/filesystem',
    libraryType: 'cpp'
  },
  thread: {
    summary: 'Thread management facilities including std::thread, std::jthread (cooperative cancellation thread), and std::this_thread utilities.',
    standard: 'C++11 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/thread',
    libraryType: 'cpp'
  },
  mutex: {
    summary: 'Mutual exclusion primitives for thread synchronization, including std::mutex, std::scoped_lock, and std::unique_lock.',
    standard: 'C++11 / C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/mutex',
    libraryType: 'cpp'
  },
  shared_mutex: {
    summary: 'Shared mutual exclusion primitives supporting multiple reader threads or single writer thread locking (std::shared_mutex).',
    standard: 'C++14 / C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/shared_mutex',
    libraryType: 'cpp'
  },
  condition_variable: {
    summary: 'Synchronization primitives used to block one or multiple threads until notified by another thread.',
    standard: 'C++11 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/condition_variable',
    libraryType: 'cpp'
  },
  future: {
    summary: 'Asynchronous task execution and value retrieval facilities (std::async, std::future, std::promise, std::packaged_task).',
    standard: 'C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/future',
    libraryType: 'cpp'
  },
  atomic: {
    summary: 'Atomic types and memory ordering operations facilitating lock-free concurrent operations without data races.',
    standard: 'C++11 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/atomic',
    libraryType: 'cpp'
  },
  barrier: {
    summary: 'Reusable thread synchronization barrier that blocks threads until the expected phase count is satisfied.',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/barrier',
    libraryType: 'cpp'
  },
  latch: {
    summary: 'Single-use downward counter synchronization primitive for thread coordination.',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/latch',
    libraryType: 'cpp'
  },
  semaphore: {
    summary: 'Lightweight counting and binary semaphore synchronization primitives (std::counting_semaphore, std::binary_semaphore).',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/counting_semaphore',
    libraryType: 'cpp'
  },
  stop_token: {
    summary: 'Cooperative cancellation facilities for asynchronous tasks and execution threads.',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/thread/stop_token',
    libraryType: 'cpp'
  },
  coroutine: {
    summary: 'Language coroutine support library, including std::coroutine_handle, std::noop_coroutine, and suspend traits.',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/coroutine',
    libraryType: 'cpp'
  },
  iostream: {
    summary: 'Standard input/output stream objects (std::cin, std::cout, std::cerr, std::clog) tied to console devices.',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/io',
    libraryType: 'cpp'
  },
  fstream: {
    summary: 'File stream classes for disk file input and output (std::ifstream, std::ofstream, std::fstream).',
    standard: 'C++98 / C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/io/basic_fstream',
    libraryType: 'cpp'
  },
  sstream: {
    summary: 'Stream classes operating on in-memory std::string objects for formatted parsing and construction.',
    standard: 'C++98 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/io/basic_stringstream',
    libraryType: 'cpp'
  },
  format: {
    summary: 'Type-safe, fast string formatting with compile-time format string validation (std::format, std::format_to).',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/format',
    libraryType: 'cpp'
  },
  print: {
    summary: 'Formatted print functions delivering formatted output directly to stdout or streams with Unicode and atomic flush support.',
    standard: 'C++23',
    docUrl: 'https://en.cppreference.com/w/cpp/io/print',
    libraryType: 'cpp'
  },
  bit: {
    summary: 'Fast bit-level inspection and manipulation utilities (std::bit_cast, std::popcount, std::countl_zero, std::has_single_bit, std::byteswap).',
    standard: 'C++20 / C++23',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/bit',
    libraryType: 'cpp'
  },
  random: {
    summary: 'Pseudo-random and non-deterministic random number generators, engines (Mersenne Twister), and statistical distributions.',
    standard: 'C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random',
    libraryType: 'cpp'
  },
  numbers: {
    summary: 'Standard mathematical constants (pi, e, sqrt2, phi, ln2) with explicit precision support.',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/constants',
    libraryType: 'cpp'
  },

  // --- C++ Wrappers for C Headers (<c...>) ---
  cmath: {
    summary: 'Common mathematical operations, trigonometry, exponential, logarithmic, and floating-point manipulation functions.',
    standard: 'C++98 / C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cmath',
    libraryType: 'cpp'
  },
  cstdio: {
    summary: 'C-style standard I/O library functions (printf, scanf, fopen, fread, fwrite, fgets, etc.).',
    standard: 'C++98 / C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cstdio',
    libraryType: 'cpp'
  },
  cstdlib: {
    summary: 'C-style general utilities, dynamic memory allocation, and process management (malloc, free, exit, atoi, rand, etc.).',
    standard: 'C++98 / C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cstdlib',
    libraryType: 'cpp'
  },
  cstring: {
    summary: 'C-style null-terminated byte string and raw memory manipulation functions (memcpy, memmove, strlen, strcpy, strcmp, etc.).',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cstring',
    libraryType: 'cpp'
  },
  cctype: {
    summary: 'Character classification and transformation functions (isalpha, isdigit, isspace, tolower, toupper, etc.).',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cctype',
    libraryType: 'cpp'
  },
  ctime: {
    summary: 'C-style date and time manipulation functions (time, clock, difftime, strftime, gmtime, localtime, etc.).',
    standard: 'C++98 / C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/header/ctime',
    libraryType: 'cpp'
  },
  cstdint: {
    summary: 'Fixed-width integer types and limits (int8_t, int16_t, int32_t, int64_t, uint64_t, intptr_t, etc.).',
    standard: 'C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cstdint',
    libraryType: 'cpp'
  },
  cstddef: {
    summary: 'Standard type definitions including size_t, ptrdiff_t, nullptr_t, std::byte, and offsetof macro.',
    standard: 'C++98 / C++11 / C++17',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cstddef',
    libraryType: 'cpp',
    primarySymbols: ['std::size_t', 'std::ptrdiff_t', 'std::nullptr_t', 'std::byte', 'offsetof']
  },
  cassert: {
    summary: 'Conditional diagnostic verification macro (assert) active when NDEBUG is not defined.',
    standard: 'C++98',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cassert',
    libraryType: 'cpp',
    primarySymbols: ['assert']
  },
  climits: {
    summary: 'Fundamental integral type limits (CHAR_BIT, INT_MAX, INT_MIN, LLONG_MAX, etc.).',
    standard: 'C++98 / C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/header/climits',
    libraryType: 'cpp'
  },
  cfloat: {
    summary: 'Floating-point type limits and characteristics (FLT_RADIX, FLT_MANT_DIG, DBL_MAX, etc.).',
    standard: 'C++98 / C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/header/cfloat',
    libraryType: 'cpp'
  },
  complex: {
    summary: 'Complex numbers class template and mathematical operations (std::complex, real, imag, abs, arg, conj).',
    standard: 'C++98 / C++11 / C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/complex',
    libraryType: 'cpp',
    primarySymbols: ['std::complex', 'std::real', 'std::imag', 'std::abs', 'std::arg', 'std::norm', 'std::conj']
  },
  regex: {
    summary: 'Regular expression parsing, matching, searching, and tokenizing library.',
    standard: 'C++11',
    docUrl: 'https://en.cppreference.com/w/cpp/regex',
    libraryType: 'cpp',
    primarySymbols: ['std::regex', 'std::regex_match', 'std::regex_search', 'std::regex_replace', 'std::smatch', 'std::sregex_iterator']
  },
  expected: {
    summary: 'Vocabulary type containing either an expected value or an unexpected error object.',
    standard: 'C++23',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/expected',
    libraryType: 'cpp',
    primarySymbols: ['std::expected', 'std::unexpected', 'std::bad_expected_access']
  },
  source_location: {
    summary: 'Compile-time source location reflection (file name, line number, column, function name).',
    standard: 'C++20',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/source_location',
    libraryType: 'cpp',
    primarySymbols: ['std::source_location', 'std::source_location::current']
  },
  stacktrace: {
    summary: 'Runtime call stack introspection and backtrace extraction facilities.',
    standard: 'C++23',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/stacktrace',
    libraryType: 'cpp',
    primarySymbols: ['std::stacktrace', 'std::stacktrace_entry']
  },
  mdspan: {
    summary: 'Multi-dimensional non-owning array view with configurable layouts and accessors.',
    standard: 'C++23',
    docUrl: 'https://en.cppreference.com/w/cpp/container/mdspan',
    libraryType: 'cpp',
    primarySymbols: ['std::mdspan', 'std::extents', 'std::dextents']
  },

  // --- C Standard Library Headers (<... .h>) ---
  'stdio.h': {
    summary: 'Standard C input and output operations, including stream management (fopen, fclose), formatted I/O (printf, scanf, snprintf), character I/O (fgetc, fputc), and binary block I/O (fread, fwrite).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/io',
    libraryType: 'c',
    primarySymbols: ['printf', 'fprintf', 'snprintf', 'sprintf', 'scanf', 'sscanf', 'fopen', 'fclose', 'fread', 'fwrite', 'fgets', 'fputs', 'fseek', 'ftell', 'fflush', 'remove', 'rename']
  },
  'stdlib.h': {
    summary: 'General purpose utilities including dynamic memory management (malloc, calloc, realloc, free), program termination (exit, abort, quick_exit), string conversion (atoi, strtol, strtod), random numbers (rand, srand), and sorting (qsort, bsearch).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/program',
    libraryType: 'c',
    primarySymbols: ['malloc', 'free', 'calloc', 'realloc', 'exit', 'abort', 'atoi', 'strtol', 'strtoul', 'strtod', 'rand', 'srand', 'qsort', 'bsearch', 'abs', 'labs']
  },
  'string.h': {
    summary: 'C-style null-terminated byte string and raw memory manipulation functions, including memory copying (memcpy, memmove), string copying (strcpy, strncpy), concatenation (strcat, strncat), comparison (strcmp, strncmp, memcmp), and searching (strchr, strstr, strtok).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/string/byte',
    libraryType: 'c',
    primarySymbols: ['memcpy', 'memmove', 'memset', 'memcmp', 'strlen', 'strcpy', 'strncpy', 'strcat', 'strncat', 'strcmp', 'strncmp', 'strchr', 'strrchr', 'strstr', 'strtok']
  },
  'math.h': {
    summary: 'Common mathematical functions and floating-point operations including square roots (sqrt), powers (pow), trigonometric functions (sin, cos, tan), exponential/logarithmic functions (exp, log, log10, log2), rounding (floor, ceil, round, trunc), and hypotenuse (hypot).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/numeric/math',
    libraryType: 'c',
    primarySymbols: ['sqrt', 'pow', 'abs', 'fabs', 'sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'atan2', 'exp', 'log', 'log10', 'log2', 'ceil', 'floor', 'round', 'trunc', 'hypot', 'fmod']
  },
  'time.h': {
    summary: 'C-style date and time manipulation functions, time types (time_t, clock_t, struct tm), calendar time querying (time), duration calculation (difftime), CPU time consumption (clock), and string formatting (strftime).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/chrono',
    libraryType: 'c',
    primarySymbols: ['time', 'clock', 'difftime', 'strftime', 'localtime', 'gmtime', 'mktime', 'asctime', 'ctime']
  },
  'ctype.h': {
    summary: 'Character classification and transformation functions for ASCII/extended characters (isalpha, isdigit, isalnum, isspace, ispunct, isupper, islower, isprint, tolower, toupper).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/string/byte',
    libraryType: 'c',
    primarySymbols: ['isalpha', 'isdigit', 'isalnum', 'isspace', 'ispunct', 'isupper', 'islower', 'isprint', 'iscntrl', 'isxdigit', 'tolower', 'toupper']
  },
  'stdint.h': {
    summary: 'Fixed-width integer types with guaranteed bit widths (int8_t, int16_t, int32_t, int64_t, uint8_t, uint16_t, uint32_t, uint64_t, intptr_t, uintptr_t) and limit macros (INT32_MAX, UINT64_MAX).',
    standard: 'C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/types/integer',
    libraryType: 'c',
    primarySymbols: ['uint8_t', 'uint16_t', 'uint32_t', 'uint64_t', 'int8_t', 'int16_t', 'int32_t', 'int64_t', 'uintptr_t', 'intptr_t', 'size_t']
  },
  'stddef.h': {
    summary: 'Standard type definitions and macros including size_t (object size), ptrdiff_t (pointer difference), NULL, and offsetof macro.',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/types',
    libraryType: 'c',
    primarySymbols: ['size_t', 'ptrdiff_t', 'NULL', 'offsetof']
  },
  'stdbool.h': {
    summary: 'Boolean type macro definitions for C (bool, true, false). In modern C23, bool, true, and false are built-in language keywords.',
    standard: 'C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/types/boolean',
    libraryType: 'c',
    primarySymbols: ['bool', 'true', 'false']
  },
  'assert.h': {
    summary: 'Diagnostic debugging verification macro (assert) that terminates execution with an error message if the condition evaluates to false, disabled by defining NDEBUG.',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/error/assert',
    libraryType: 'c',
    primarySymbols: ['assert']
  },
  'limits.h': {
    summary: 'Fundamental integer type limits (CHAR_BIT, INT_MIN, INT_MAX, UINT_MAX, LONG_MIN, LONG_MAX, ULONG_MAX, LLONG_MIN, LLONG_MAX, ULLONG_MAX).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/types/limits',
    libraryType: 'c',
    primarySymbols: ['INT_MAX', 'INT_MIN', 'UINT_MAX', 'CHAR_BIT', 'LLONG_MAX', 'LLONG_MIN', 'ULLONG_MAX']
  },
  'float.h': {
    summary: 'Floating-point numeric limits and characteristics (FLT_RADIX, FLT_MANT_DIG, DBL_MANT_DIG, FLT_DIG, DBL_DIG, FLT_MIN, DBL_MIN, FLT_MAX, DBL_MAX, FLT_EPSILON, DBL_EPSILON).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/types/limits',
    libraryType: 'c',
    primarySymbols: ['FLT_MAX', 'DBL_MAX', 'FLT_MIN', 'DBL_MIN', 'FLT_EPSILON', 'DBL_EPSILON']
  },
  'stdarg.h': {
    summary: 'Variable arguments handling macros (va_list, va_start, va_arg, va_copy, va_end) for creating variadic functions.',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/variadic',
    libraryType: 'c',
    primarySymbols: ['va_list', 'va_start', 'va_arg', 'va_copy', 'va_end']
  },
  'errno.h': {
    summary: 'System and standard error reporting facility via the thread-local errno integer variable and standard error code macros (EDOM, ERANGE, EILSEQ, EINVAL, ENOMEM, ENOENT, EACCES).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/error/errno',
    libraryType: 'c',
    primarySymbols: ['errno', 'EDOM', 'ERANGE', 'EILSEQ']
  },
  'setjmp.h': {
    summary: 'Non-local jumps bypassing normal function call and return discipline (setjmp, longjmp, jmp_buf).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/program/setjmp',
    libraryType: 'c',
    primarySymbols: ['setjmp', 'longjmp', 'jmp_buf']
  },
  'signal.h': {
    summary: 'Asynchronous signal handling and software interrupts (signal, raise, sig_atomic_t, SIGINT, SIGSEGV, SIGTERM, SIGABRT, SIGFPE, SIGILL).',
    standard: 'C89 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/program/signal',
    libraryType: 'c',
    primarySymbols: ['signal', 'raise', 'sig_atomic_t', 'SIGINT', 'SIGTERM', 'SIGSEGV', 'SIGABRT']
  },
  'inttypes.h': {
    summary: 'Format conversion of integer types including printf/scanf format specifier macros (PRId64, PRIu64, PRIx64, SCNd64) and greatest-width integer division (imaxabs, imaxdiv).',
    standard: 'C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/types/integer',
    libraryType: 'c',
    primarySymbols: ['PRId64', 'PRIu64', 'PRIx64', 'imaxabs', 'imaxdiv', 'imaxdiv_t']
  },
  'wchar.h': {
    summary: 'Wide character string and I/O manipulation functions (wprintf, swprintf, fgetws, wcslen, wcscpy, wcscmp, wcsstr, wmemmove, wmemcpy).',
    standard: 'C95 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/string/wide',
    libraryType: 'c',
    primarySymbols: ['wprintf', 'swprintf', 'fgetws', 'wcslen', 'wcscpy', 'wcscmp', 'wcsstr', 'wmemmove', 'wmemcpy', 'wchar_t']
  },
  'wctype.h': {
    summary: 'Wide character classification and mapping functions (iswalpha, iswdigit, iswspace, towlower, towupper, wctype, wctrans).',
    standard: 'C95 / C99 / C11 / C17 / C23',
    docUrl: 'https://en.cppreference.com/w/c/string/wide',
    libraryType: 'c',
    primarySymbols: ['iswalpha', 'iswdigit', 'iswspace', 'towlower', 'towupper']
  },

  // --- Windows SDK Headers ---
  'windows.h': {
    summary: 'Master C/C++ include header for the Microsoft Windows API. Exposes Win32 window manager, kernel executive objects, GDI graphics, system metrics, memory management, and registry services.',
    standard: 'Windows SDK / Win32 API',
    docUrl: 'https://learn.microsoft.com/en-us/windows/win32/api/',
    libraryType: 'win32',
    primarySymbols: ['CreateWindowEx', 'ShowWindow', 'SendMessage', 'GetMessage', 'DispatchMessage', 'DefWindowProc', 'MessageBox', 'CloseHandle', 'GetLastError', 'GetModuleHandle', 'LoadLibrary', 'FreeLibrary']
  },
  'winsock2.h': {
    summary: 'Windows Sockets 2 (Winsock) networking API header for TCP/IP and UDP socket communication, socket creation, non-blocking I/O, and asynchronous event polling.',
    standard: 'Windows SDK / Winsock 2',
    docUrl: 'https://learn.microsoft.com/en-us/windows/win32/api/winsock2/',
    libraryType: 'win32',
    primarySymbols: ['WSAStartup', 'WSACleanup', 'socket', 'bind', 'listen', 'accept', 'connect', 'send', 'recv', 'closesocket', 'WSAGetLastError']
  },
  'windowsx.h': {
    summary: 'Windows API extension macros and message crackers for clean handling of Win32 window messages in window procedures (WndProc).',
    standard: 'Windows SDK',
    docUrl: 'https://learn.microsoft.com/en-us/windows/win32/api/',
    libraryType: 'win32',
    primarySymbols: ['HANDLE_MSG', 'FORWARD_WM_COMMAND', 'GET_X_LPARAM', 'GET_Y_LPARAM']
  },
  'windef.h': {
    summary: 'Basic Windows type definitions, handles (HWND, HDC, HBITMAP), and common macros (LOWORD, HIWORD, MAX, MIN).',
    standard: 'Windows SDK',
    docUrl: 'https://learn.microsoft.com/en-us/windows/win32/api/windef/',
    libraryType: 'win32',
    primarySymbols: ['HWND', 'HDC', 'HBITMAP', 'HICON', 'HCURSOR', 'HBRUSH', 'HFONT', 'HMENU', 'HPEN', 'HRGN', 'LRESULT', 'WPARAM', 'LPARAM', 'COLORREF']
  },
  'winuser.h': {
    summary: 'Win32 User interface API (windows, dialogs, menus, messages, cursor, clipboard, accessibility).',
    standard: 'Windows SDK',
    docUrl: 'https://learn.microsoft.com/en-us/windows/win32/api/winuser/',
    libraryType: 'win32',
    primarySymbols: ['CreateWindowExW', 'ShowWindow', 'UpdateWindow', 'DestroyWindow', 'GetMessageW', 'TranslateMessage', 'DispatchMessageW', 'SendMessageW', 'PostMessageW', 'MessageBoxW']
  },
  'wingdi.h': {
    summary: 'Win32 Graphic Device Interface (GDI) functions, device contexts, pens, brushes, bitblt, and text rendering.',
    standard: 'Windows SDK',
    docUrl: 'https://learn.microsoft.com/en-us/windows/win32/api/wingdi/',
    libraryType: 'win32',
    primarySymbols: ['CreateCompatibleDC', 'CreateCompatibleBitmap', 'SelectObject', 'DeleteObject', 'BitBlt', 'StretchBlt', 'TextOutW', 'CreateSolidBrush', 'CreatePen']
  },

  // --- POSIX System C Headers ---
  'unistd.h': {
    summary: 'Standard POSIX operating system API header for process management, file I/O syscalls, working directory inspection, and execution timing.',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/unistd.h.html',
    libraryType: 'posix',
    primarySymbols: ['fork', 'execve', 'read', 'write', 'close', 'pipe', 'sleep', 'usleep', 'getpid', 'getppid', 'lseek', 'dup2', 'access', 'unlink', 'chdir', 'getcwd']
  },
  'fcntl.h': {
    summary: 'POSIX file control options, file descriptor manipulation (fcntl), file creation (creat), and low-level open flags (O_RDONLY, O_WRONLY, O_RDWR, O_CREAT, O_TRUNC, O_APPEND).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/fcntl.h.html',
    libraryType: 'posix',
    primarySymbols: ['open', 'fcntl', 'creat', 'O_RDONLY', 'O_WRONLY', 'O_RDWR', 'O_CREAT', 'O_TRUNC', 'O_APPEND']
  },
  'pthread.h': {
    summary: 'POSIX Threads (pthreads) API for thread creation, mutex locks, condition variables, read-write locks, barriers, and thread-specific data keys.',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/pthread.h.html',
    libraryType: 'posix',
    primarySymbols: ['pthread_create', 'pthread_join', 'pthread_detach', 'pthread_exit', 'pthread_mutex_init', 'pthread_mutex_lock', 'pthread_mutex_unlock', 'pthread_cond_wait', 'pthread_cond_signal']
  },
  'sys/socket.h': {
    summary: 'POSIX Berkeley sockets API header for Internet and UNIX domain network communication, endpoint creation, and transmission operations.',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/sys_socket.h.html',
    libraryType: 'posix',
    primarySymbols: ['socket', 'bind', 'listen', 'accept', 'connect', 'send', 'recv', 'sendto', 'recvfrom', 'shutdown', 'setsockopt', 'getsockopt', 'socklen_t']
  },
  'sys/types.h': {
    summary: 'POSIX collection of fundamental system data types including process IDs (pid_t), user IDs (uid_t), group IDs (gid_t), file sizes (off_t), file modes (mode_t), and byte counts (ssize_t).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/sys_types.h.html',
    libraryType: 'posix',
    primarySymbols: ['pid_t', 'uid_t', 'gid_t', 'mode_t', 'off_t', 'size_t', 'ssize_t', 'time_t']
  },
  'sys/stat.h': {
    summary: 'POSIX file characteristics and status queries, directory creation, permission changes, and file type classification macros (S_ISREG, S_ISDIR).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/sys_stat.h.html',
    libraryType: 'posix',
    primarySymbols: ['stat', 'fstat', 'lstat', 'chmod', 'fchmod', 'mkdir', 'struct stat', 'S_ISREG', 'S_ISDIR']
  },
  'sys/time.h': {
    summary: 'POSIX time types and high-resolution timer facilities (gettimeofday, setitimer, struct timeval).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/sys_time.h.html',
    libraryType: 'posix',
    primarySymbols: ['gettimeofday', 'setitimer', 'struct timeval']
  },
  'sys/wait.h': {
    summary: 'POSIX process termination inspection and waiting facilities (wait, waitpid, WIFEXITED, WEXITSTATUS, WIFSIGNALED).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/sys_wait.h.html',
    libraryType: 'posix',
    primarySymbols: ['wait', 'waitpid', 'WIFEXITED', 'WEXITSTATUS', 'WIFSIGNALED']
  },
  'sys/mman.h': {
    summary: 'POSIX memory management declarations (mmap, munmap, mprotect, msync, mlock, munlock).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/sys_mman.h.html',
    libraryType: 'posix',
    primarySymbols: ['mmap', 'munmap', 'mprotect', 'msync', 'PROT_READ', 'PROT_WRITE', 'MAP_SHARED', 'MAP_PRIVATE', 'MAP_ANONYMOUS']
  },
  'dirent.h': {
    summary: 'POSIX directory streams manipulation, folder traversal, and directory entry inspection (opendir, readdir, closedir, rewinddir, struct dirent).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/dirent.h.html',
    libraryType: 'posix',
    primarySymbols: ['opendir', 'readdir', 'closedir', 'rewinddir', 'struct dirent', 'DIR']
  },
  'poll.h': {
    summary: 'POSIX I/O multiplexing facility for synchronous event monitoring across multiple file descriptors simultaneously (poll, struct pollfd).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/poll.h.html',
    libraryType: 'posix',
    primarySymbols: ['poll', 'struct pollfd', 'POLLIN', 'POLLOUT', 'POLLERR']
  },
  'netinet/in.h': {
    summary: 'Internet protocol family definitions, IPv4/IPv6 socket address structures (sockaddr_in, sockaddr_in6), and port/address byte order helpers.',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/netinet_in.h.html',
    libraryType: 'posix',
    primarySymbols: ['sockaddr_in', 'sockaddr_in6', 'in_addr', 'in6_addr', 'htons', 'ntohs', 'htonl', 'ntohl', 'INADDR_ANY']
  },
  'arpa/inet.h': {
    summary: 'Internet address numerical and presentation format conversion operations (inet_addr, inet_ntoa, inet_pton, inet_ntop).',
    standard: 'POSIX.1-2001 / POSIX.1-2008',
    docUrl: 'https://pubs.opengroup.org/onlinepubs/9699919799/basedefs/arpa_inet.h.html',
    libraryType: 'posix',
    primarySymbols: ['inet_addr', 'inet_ntoa', 'inet_pton', 'inet_ntop']
  }
};

/**
 * Extracts include directive details from a line of source code.
 */
export function parseIncludeLine(
  lineText: string,
  lineNumber = 0,
  character?: number
): ParsedIncludeDirective | null {
  const match = lineText.match(/^\s*#\s*include\s*(?:<([^>]+)>|"([^"]+)")/);
  if (!match) {
    return null;
  }

  const isStandard = match[1] !== undefined;
  const headerName = isStandard ? match[1] : match[2];
  const headerText = isStandard ? `<${headerName}>` : `"${headerName}"`;

  const startCol = lineText.indexOf('#');
  const endCol = lineText.indexOf(headerText) + headerText.length;

  if (character !== undefined && (character < startCol || character > endCol)) {
    return null;
  }

  const range = new vscode.Range(lineNumber, startCol, lineNumber, endCol);

  return {
    headerText,
    headerName,
    isStandard,
    range
  };
}

/**
 * Extracts a resolved file path from Clangd hover output if present.
 */
export function extractPathFromClangdHover(hover: vscode.Hover): string | undefined {
  if (!hover || !hover.contents || hover.contents.length === 0) {
    return undefined;
  }

  for (const item of hover.contents) {
    let text = '';
    if (typeof item === 'string') {
      text = item;
    } else if (item && typeof (item as vscode.MarkdownString).value === 'string') {
      text = (item as vscode.MarkdownString).value;
    }

    if (!text) continue;

    const lines = text.split(/\r?\n/);
    for (const line of lines) {
      const candidate = line.trim().replace(/^`+|`+$/g, '').replace(/^"+|"+$/g, '');
      if (candidate.length > 2 && (candidate.includes('/') || candidate.includes('\\'))) {
        try {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
          }
        } catch {
          // Ignore invalid filesystem candidates
        }
      }
    }
  }

  return undefined;
}

/**
 * Resolves a local project header file on disk.
 */
export function resolveLocalHeaderPath(
  rawPath: string,
  documentUri?: vscode.Uri,
  hintPath?: string
): string | undefined {
  if (hintPath) {
    try {
      if (fs.existsSync(hintPath) && fs.statSync(hintPath).isFile()) {
        return hintPath;
      }
    } catch {
      // Ignore
    }
  }

  if (documentUri) {
    try {
      const docDir = path.dirname(documentUri.fsPath);
      const relativeCandidate = path.resolve(docDir, rawPath);
      if (fs.existsSync(relativeCandidate) && fs.statSync(relativeCandidate).isFile()) {
        return relativeCandidate;
      }
    } catch {
      // Ignore
    }
  }

  if (vscode.workspace.workspaceFolders) {
    for (const folder of vscode.workspace.workspaceFolders) {
      const candidates = [
        path.resolve(folder.uri.fsPath, rawPath),
        path.resolve(folder.uri.fsPath, 'include', rawPath),
        path.resolve(folder.uri.fsPath, 'src', rawPath)
      ];
      for (const candidate of candidates) {
        try {
          if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
            return candidate;
          }
        } catch {
          // Ignore
        }
      }
    }
  }

  return undefined;
}

interface HeaderCacheEntry {
  mtimeMs: number;
  symbols: LocalHeaderSymbol[];
}

const headerContentCache = new Map<string, HeaderCacheEntry>();
const MAX_HEADER_CACHE_SIZE = 250;

function getCachedSymbols(filePath: string, mtimeMs: number): LocalHeaderSymbol[] | null {
  const cached = headerContentCache.get(filePath);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.symbols;
  }
  return null;
}

function setCachedSymbols(filePath: string, mtimeMs: number, symbols: LocalHeaderSymbol[]): void {
  if (headerContentCache.size >= MAX_HEADER_CACHE_SIZE) {
    const firstKey = headerContentCache.keys().next().value;
    if (firstKey !== undefined) {
      headerContentCache.delete(firstKey);
    }
  }
  headerContentCache.set(filePath, { mtimeMs, symbols });
}

export function clearHeaderHoverCache(): void {
  headerContentCache.clear();
}

const RESERVED_CPP_KEYWORDS = new Set([
  'if',
  'while',
  'for',
  'switch',
  'return',
  'catch',
  'case',
  'sizeof',
  'alignof',
  'decltype'
]);

/**
 * Statically parses C++ header source text to extract declared classes, structs, concepts, and functions.
 */
export function parseHeaderContent(content: string): LocalHeaderSymbol[] {
  const symbols: LocalHeaderSymbol[] = [];
  try {
    // Limit parsing to 500KB to maintain sub-millisecond response
    const truncated = content.length > 500000 ? content.slice(0, 500000) : content;

    // Strip comments in a single pass to avoid duplicate large buffer allocations
    const cleanContent = truncated.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '');

    const lines = cleanContent.split(/\r?\n/);
    const seenNames = new Set<string>();

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      // 1. Classes and structs
      const classMatch = line.match(
        /^(?:template\s*<[^>]*>\s*)?(class|struct)\s+(?:\[\[.*?\]\]\s+)?([A-Za-z0-9_]+)(?:\s*final)?(?:\s*:\s*[^{;]+)?(?:\s*\{|;)/
      );
      if (classMatch && classMatch[2]) {
        const kind = classMatch[1] === 'struct' ? 'struct' : 'class';
        const name = classMatch[2];
        if (!seenNames.has(name)) {
          seenNames.add(name);
          symbols.push({
            name,
            kind,
            signature: line.replace(/\{.*$/, '').trim()
          });
        }
        continue;
      }

      // 2. Concepts
      const conceptMatch = line.match(/^concept\s+([A-Za-z0-9_]+)\s*=/);
      if (conceptMatch && conceptMatch[1]) {
        const name = conceptMatch[1];
        if (!seenNames.has(name)) {
          seenNames.add(name);
          symbols.push({
            name,
            kind: 'concept',
            signature: line.replace(/;.*$/, '').trim()
          });
        }
        continue;
      }

      // 3. Enums
      const enumMatch = line.match(/^enum\s+(?:class\s+|struct\s+)?([A-Za-z0-9_]+)/);
      if (enumMatch && enumMatch[1]) {
        const name = enumMatch[1];
        if (!seenNames.has(name)) {
          seenNames.add(name);
          symbols.push({
            name,
            kind: 'enum',
            signature: line.replace(/\{.*$/, '').trim()
          });
        }
        continue;
      }

      // 4. Free or exported functions
      const funcMatch = line.match(
        /^(?:inline\s+|static\s+|constexpr\s+|consteval\s+|virtual\s+|explicit\s+)*([a-zA-Z0-9_:*&<>\s]+?)\s+([a-zA-Z0-9_]+)\s*\(([^)]*)\)\s*(?:const|noexcept|override|final|\s)*;/
      );
      if (funcMatch && funcMatch[2]) {
        const name = funcMatch[2];
        if (!RESERVED_CPP_KEYWORDS.has(name) && !seenNames.has(name)) {
          seenNames.add(name);
          symbols.push({
            name,
            kind: 'function',
            signature: line.replace(/;.*$/, '').trim()
          });
        }
      }
    }
  } catch {
    // Return whatever was parsed
  }

  return symbols;
}

/**
 * Statically parses a C++ local header file to extract declared classes, structs, concepts, and functions.
 * Uses mtime caching to avoid repeated disk reads.
 */
export function parseLocalHeaderFile(filePath: string): LocalHeaderSymbol[] {
  try {
    const stat = fs.statSync(filePath);
    const cached = getCachedSymbols(filePath, stat.mtimeMs);
    if (cached) {
      return cached;
    }
    const content = fs.readFileSync(filePath, 'utf-8');
    const symbols = parseHeaderContent(content);
    setCachedSymbols(filePath, stat.mtimeMs, symbols);
    return symbols;
  } catch {
    return [];
  }
}

/**
 * Asynchronously parses a C++ local header file with mtime caching, avoiding main thread blocking.
 */
export async function parseLocalHeaderFileAsync(filePath: string): Promise<LocalHeaderSymbol[]> {
  try {
    const stat = await fs.promises.stat(filePath);
    const cached = getCachedSymbols(filePath, stat.mtimeMs);
    if (cached) {
      return cached;
    }
    const content = await fs.promises.readFile(filePath, 'utf-8');
    const symbols = parseHeaderContent(content);
    setCachedSymbols(filePath, stat.mtimeMs, symbols);
    return symbols;
  } catch {
    return [];
  }
}

/**
 * Formats a rich hover card for a Standard Library or system header.
 */
export function formatStandardHeaderHover(
  headerKey: string,
  entries: StlDocEntry[],
  resolvedPath?: string,
  range?: vscode.Range
): vscode.Hover {
  const normKey = headerKey.trim().toLowerCase().replace(/^<|>$/g, '');

  // Look up catalog entry with bidirectional C header (foo.h) / C++ header (cfoo) fallback
  let catalog = STANDARD_HEADER_CATALOG[normKey];
  if (!catalog) {
    if (normKey.endsWith('.h')) {
      const cxxKey = 'c' + normKey.slice(0, -2);
      catalog = STANDARD_HEADER_CATALOG[cxxKey];
    } else if (normKey.startsWith('c') && !normKey.includes('.')) {
      const cKey = normKey.slice(1) + '.h';
      catalog = STANDARD_HEADER_CATALOG[cKey];
    }
  }

  // Determine library classification and badge
  const isCHeader =
    catalog?.libraryType === 'c' ||
    (normKey.endsWith('.h') &&
      !normKey.includes('windows') &&
      !normKey.includes('winsock') &&
      !normKey.includes('sys/') &&
      !normKey.includes('unistd') &&
      !normKey.includes('pthread') &&
      !normKey.includes('fcntl') &&
      !normKey.includes('dirent') &&
      !normKey.includes('poll'));

  const isWin32 =
    catalog?.libraryType === 'win32' ||
    normKey.includes('windows') ||
    normKey.includes('winsock') ||
    normKey.startsWith('win');

  const isPosix =
    catalog?.libraryType === 'posix' ||
    normKey.includes('sys/') ||
    normKey.includes('unistd') ||
    normKey.includes('pthread') ||
    normKey.includes('fcntl') ||
    normKey.includes('dirent') ||
    normKey.includes('poll') ||
    normKey.includes('inet');

  let libraryBadge = 'C++ Standard Library';
  let categoryTag = 'Standard Library';

  if (isCHeader) {
    libraryBadge = 'C Standard Library';
    categoryTag = 'C Standard Library';
  } else if (isWin32) {
    libraryBadge = 'Windows SDK / Win32 API';
    categoryTag = 'Windows SDK';
  } else if (isPosix) {
    libraryBadge = 'POSIX System Library';
    categoryTag = 'POSIX Library';
  }

  const standardBadge = catalog ? catalog.standard : libraryBadge;
  const summary = catalog
    ? catalog.summary
    : `Standard ${libraryBadge} header providing foundational types, algorithms, and facilities.`;
  const docUrl = catalog ? catalog.docUrl : `https://en.cppreference.com/w/cpp/header/${normKey}`;

  const md = new vscode.MarkdownString();
  md.isTrusted = true;

  md.appendMarkdown(`### Header \`<${normKey}>\` *(${libraryBadge})*\n\n`);
  md.appendMarkdown(
    `**Standard**: \`[${categoryTag}]\` \`[<${normKey}>]\` \`[${standardBadge}]\`\n\n`
  );
  md.appendMarkdown(`${summary}\n\n`);

  if (resolvedPath) {
    md.appendMarkdown(`**Resolved Path**: \`${resolvedPath}\`\n\n`);
  }

  // Separate primary types/classes from member and free functions
  const types: StlDocEntry[] = [];
  const functions: StlDocEntry[] = [];

  for (const entry of entries) {
    const sig = entry.canonicalSignature.trim();
    if (
      sig.includes('class ') ||
      sig.includes('struct ') ||
      (sig.startsWith('template') && (sig.includes('class') || sig.includes('struct'))) ||
      sig.startsWith('using ')
    ) {
      types.push(entry);
    } else {
      functions.push(entry);
    }
  }

  // If no functions were classified but entries exist, treat all entries as available symbols
  if (functions.length === 0 && types.length === 0 && entries.length > 0) {
    functions.push(...entries);
  }

  // 1. Primary Types
  if (types.length > 0) {
    md.appendMarkdown(`#### Primary Types\n\n`);
    for (const t of types) {
      const summarySnippet = t.summary.split('. ')[0] || t.summary;
      const cleanSym = (isCHeader || isWin32 || isPosix) ? t.symbol.replace(/^std::/, '') : t.symbol;
      md.appendMarkdown(`- [\`${cleanSym}\`](${t.docUrl}): ${summarySnippet}.\n`);
    }
    md.appendMarkdown('\n');
  }

  // 2. Available Functions
  if (functions.length > 0) {
    md.appendMarkdown(`#### Available Functions (${functions.length})\n\n`);
    md.appendMarkdown('| Function / Symbol | Summary | Complexity |\n');
    md.appendMarkdown('| :--- | :--- | :--- |\n');

    for (const fn of functions) {
      let shortName = fn.symbol.replace(/^std::(?:[a-zA-Z0-9_]+::)?/, '');
      if (isCHeader || isWin32 || isPosix) {
        shortName = shortName.replace(/^std::/, '');
      }
      const cleanSummary = (fn.summary.split('. ')[0] || fn.summary).replace(/\|/g, '\\|');
      const timeComp = fn.complexity?.time
        ? fn.complexity.time.split(';')[0].replace(/\|/g, '\\|')
        : '-';
      md.appendMarkdown(`| [\`${shortName}\`](${fn.docUrl}) | ${cleanSummary} | \`${timeComp}\` |\n`);
    }
    md.appendMarkdown('\n');
  } else if (catalog?.primarySymbols && catalog.primarySymbols.length > 0) {
    md.appendMarkdown(`#### Primary Functions & Symbols (${catalog.primarySymbols.length})\n\n`);
    for (const sym of catalog.primarySymbols) {
      md.appendMarkdown(`- \`${sym}\`\n`);
    }
    md.appendMarkdown('\n');
  }

  md.appendMarkdown('---\n');
  if (isWin32) {
    md.appendMarkdown(
      `[Microsoft Learn: <${normKey}>](${docUrl}) | [Switch Header/Source](command:turbocpp.switchSourceHeader)`
    );
  } else if (isPosix) {
    md.appendMarkdown(
      `[POSIX Reference: <${normKey}>](${docUrl}) | [Switch Header/Source](command:turbocpp.switchSourceHeader)`
    );
  } else {
    md.appendMarkdown(
      `[cppreference: <${normKey}>](${docUrl}) | [Open Docs (cppreference)](command:turbocpp.openDocs)`
    );
  }

  return new vscode.Hover(md, range);
}

/**
 * Formats a rich hover card for a project / local header.
 */
export function formatLocalHeaderHover(
  headerName: string,
  symbols: LocalHeaderSymbol[],
  resolvedPath?: string,
  range?: vscode.Range
): vscode.Hover {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;

  md.appendMarkdown(`### Header \`"${headerName}"\` *(Project Header)*\n\n`);

  if (resolvedPath) {
    md.appendMarkdown(`**Path**: \`${resolvedPath}\`\n\n`);
  } else {
    md.appendMarkdown(`*Local header file referenced relative to workspace directories.*\n\n`);
  }

  const types = symbols.filter((s) => s.kind === 'class' || s.kind === 'struct' || s.kind === 'enum');
  const concepts = symbols.filter((s) => s.kind === 'concept');
  const functions = symbols.filter((s) => s.kind === 'function');

  if (types.length > 0) {
    md.appendMarkdown(`#### Declared Types (${types.length})\n\n`);
    for (const t of types) {
      md.appendMarkdown(`- \`${t.kind}\` **\`${t.name}\`**\n`);
    }
    md.appendMarkdown('\n');
  }

  if (concepts.length > 0) {
    md.appendMarkdown(`#### Declared Concepts (${concepts.length})\n\n`);
    for (const c of concepts) {
      md.appendMarkdown(`- \`concept\` **\`${c.name}\`**\n`);
    }
    md.appendMarkdown('\n');
  }

  if (functions.length > 0) {
    md.appendMarkdown(`#### Declared Functions (${functions.length})\n\n`);
    md.appendMarkdown('| Function | Signature |\n');
    md.appendMarkdown('| :--- | :--- |\n');
    for (const f of functions) {
      const sigEscaped = (f.signature || f.name).replace(/\|/g, '\\|');
      md.appendMarkdown(`| \`${f.name}\` | \`${sigEscaped}\` |\n`);
    }
    md.appendMarkdown('\n');
  }

  if (symbols.length === 0 && resolvedPath) {
    md.appendMarkdown(`*No top-level functions or classes detected in file.*\n\n`);
  }

  if (resolvedPath) {
    md.appendMarkdown('---\n');
    md.appendMarkdown(
      `[Switch Header/Source](command:turbocpp.switchSourceHeader) | [Find References](command:editor.action.findReferences)`
    );
  }

  return new vscode.Hover(md, range);
}

/**
 * Main provider for header include hovers.
 */
export class HeaderHoverProvider {
  /**
   * Evaluates an include line and returns a rich hover listing available functions and symbols.
   */
  public static async provideHeaderHover(
    document: vscode.TextDocument,
    _position: vscode.Position,
    includeInfo: ParsedIncludeDirective,
    resolvedPath?: string
  ): Promise<vscode.Hover | null> {
    if (includeInfo.isStandard) {
      let entries = getStlEntriesByHeader(includeInfo.headerName);
      if (entries.length === 0) {
        const sysEntries = StlRemoteProvider.getInstance().getOfflineEntriesByHeader(includeInfo.headerName);
        if (sysEntries.length > 0) {
          entries = sysEntries;
        }
      }

      return formatStandardHeaderHover(
        includeInfo.headerName,
        entries,
        resolvedPath,
        includeInfo.range
      );
    }

    // Local / project header
    const resolved = resolveLocalHeaderPath(includeInfo.headerName, document.uri, resolvedPath);
    const symbols = resolved ? await parseLocalHeaderFileAsync(resolved) : [];

    return formatLocalHeaderHover(
      includeInfo.headerName,
      symbols,
      resolved,
      includeInfo.range
    );
  }
}
