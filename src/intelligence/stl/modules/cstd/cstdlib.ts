import { StlDocEntry, StlHeaderModule } from '../../types';

export const CSTDLIB_ENTRIES: Record<string, StlDocEntry> = {
  'std::malloc': {
    symbol: 'std::malloc',
    canonicalSignature: 'void* malloc(std::size_t size);',
    summary: 'Allocates size bytes of uninitialized heap memory. In C++, prefer new/delete or smart pointers (std::make_unique).',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      size: 'Number of bytes to allocate'
    },
    returns: 'Pointer to the beginning of newly allocated memory, or nullptr on allocation failure.',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/c/malloc',
    complexity: { time: 'O(1) amortized heap allocator lookup', space: 'Requested size + allocator metadata' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int* arr = static_cast<int*>(std::malloc(10 * sizeof(int)));\n// use arr\nstd::free(arr);',
    seeAlso: ['std::free', 'std::calloc', 'std::realloc', 'std::make_unique']
  },
  'std::free': {
    symbol: 'std::free',
    canonicalSignature: 'void free(void* ptr);',
    summary: 'Deallocates memory previously allocated by malloc, calloc, or realloc. If ptr is nullptr, the function does nothing.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      ptr: 'Pointer to memory to be freed'
    },
    returns: 'void.',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/c/free',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::free(ptr);\nptr = nullptr;',
    seeAlso: ['std::malloc', 'std::realloc']
  },
  'std::calloc': {
    symbol: 'std::calloc',
    canonicalSignature: 'void* calloc(std::size_t num, std::size_t size);',
    summary: 'Allocates memory for an array of num objects of size and initializes all bytes in the allocated storage to zero.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      num: 'Number of objects',
      size: 'Size of each object in bytes'
    },
    returns: 'Pointer to allocated memory, or nullptr on failure.',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/c/calloc',
    complexity: { time: 'O(N) zero-filling allocated bytes' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int* zeros = static_cast<int*>(std::calloc(100, sizeof(int)));\nstd::free(zeros);',
    seeAlso: ['std::malloc', 'std::free']
  },
  'std::realloc': {
    symbol: 'std::realloc',
    canonicalSignature: 'void* realloc(void* ptr, std::size_t new_size);',
    summary: 'Reallocates the given area of memory. It may expand in-place or allocate a new memory block and copy old data.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      ptr: 'Pointer to previously allocated memory',
      new_size: 'New size of the array in bytes'
    },
    returns: 'Pointer to reallocated block, or nullptr if reallocation failed (old block remains valid).',
    docUrl: 'https://en.cppreference.com/w/cpp/memory/c/realloc',
    complexity: { time: 'O(1) in-place or O(N) when copying data' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'void* temp = std::realloc(arr, new_capacity);\nif (temp) arr = static_cast<int*>(temp);',
    seeAlso: ['std::malloc', 'std::free']
  },
  'std::atoi': {
    symbol: 'std::atoi',
    canonicalSignature: 'int atoi(const char* str);',
    summary: 'Interprets an integer value in a byte string pointed to by str. Discards leading whitespace.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      str: 'Null-terminated string to parse'
    },
    returns: 'Integer value corresponding to the contents of str.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/atoi',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int val = std::atoi("42");',
    seeAlso: ['std::strtol', 'std::from_chars', 'std::stoi']
  },
  'std::strtol': {
    symbol: 'std::strtol',
    canonicalSignature: 'long strtol(const char* str, char** str_end, int base);',
    summary: 'Interprets an integer value in str with explicit numerical base (2 to 36). Provides error checking via str_end and errno.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      str: 'Null-terminated string to parse',
      str_end: 'Pointer to a pointer to character to store first unparsed character',
      base: 'Radix of the integer (0 for auto-detection: decimal, 0x hex, 0 octal)'
    },
    returns: 'Integer value parsed from string.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strtol',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char* end;\nlong n = std::strtol("0xFF", &end, 16); // 255',
    seeAlso: ['std::atoi', 'std::strtod']
  },
  'std::rand': {
    symbol: 'std::rand',
    canonicalSignature: 'int rand();',
    summary: 'Generates a pseudo-random integer between 0 and RAND_MAX. In modern C++, prefer <random> (std::mt19937) for quality and uniformity.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {},
    returns: 'Pseudo-random integer value.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/rand',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int dice = (std::rand() % 6) + 1;',
    seeAlso: ['std::srand']
  },
  'std::srand': {
    symbol: 'std::srand',
    canonicalSignature: 'void srand(unsigned int seed);',
    summary: 'Seeds the pseudo-random number generator used by std::rand with the value seed.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      seed: 'Integral seed value'
    },
    returns: 'void.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/srand',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::srand(static_cast<unsigned>(std::time(nullptr)));',
    seeAlso: ['std::rand']
  },
  'std::abort': {
    symbol: 'std::abort',
    canonicalSignature: '[[noreturn]] void abort() noexcept;',
    summary: 'Causes abnormal program termination without executing clean-up tasks (destructors of automatic and static objects are NOT called).',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {},
    returns: 'Does not return.',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/program/abort',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'if (corrupted_state) std::abort();',
    seeAlso: ['std::exit', 'std::quick_exit']
  },
  'std::exit': {
    symbol: 'std::exit',
    canonicalSignature: '[[noreturn]] void exit(int exit_code);',
    summary: 'Causes normal program termination. Functions registered with atexit and static object destructors are executed in reverse order.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      exit_code: 'Exit status of the program returned to the host environment (EXIT_SUCCESS, EXIT_FAILURE)'
    },
    returns: 'Does not return.',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/program/exit',
    complexity: { time: 'O(N) where N is registered atexit callbacks and static objects' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::exit(EXIT_SUCCESS);',
    seeAlso: ['std::abort', 'std::quick_exit']
  },
  'std::getenv': {
    symbol: 'std::getenv',
    canonicalSignature: 'char* getenv(const char* name);',
    summary: 'Searches the environment list provided by the operating system for string matching name and returns pointer to value.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      name: 'Null-terminated string identifying the environment variable'
    },
    returns: 'Pointer to value string on success; nullptr if variable was not found.',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/program/getenv',
    complexity: { time: 'O(N) searching environment table' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'const char* home = std::getenv("HOME");',
    seeAlso: ['std::system']
  },
  'std::strtoll': {
    symbol: 'std::strtoll',
    canonicalSignature: 'long long strtoll(const char* str, char** str_end, int base);',
    summary: 'Interprets a signed integer value in the byte string pointed to by str with explicit base (2 to 36).',
    header: '<cstdlib>',
    standard: 'C++11',
    parameters: {
      str: 'Null-terminated string to parse',
      str_end: 'Pointer to pointer to store address of first unparsed character',
      base: 'Radix base of integer (0 for auto-detection)'
    },
    returns: 'Parsed long long integer value.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strtoll',
    complexity: { time: 'O(N) where N is number of parsed characters' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char* end;\nlong long val = std::strtoll("9223372036854775800", &end, 10);',
    seeAlso: ['std::strtol', 'std::strtoull', 'std::strtod']
  },
  'std::strtoull': {
    symbol: 'std::strtoull',
    canonicalSignature: 'unsigned long long strtoull(const char* str, char** str_end, int base);',
    summary: 'Interprets an unsigned integer value in the byte string pointed to by str with explicit base (2 to 36).',
    header: '<cstdlib>',
    standard: 'C++11',
    parameters: {
      str: 'Null-terminated string to parse',
      str_end: 'Pointer to pointer to store address of first unparsed character',
      base: 'Radix base of integer (0 for auto-detection)'
    },
    returns: 'Parsed unsigned long long integer value.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strtoul',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char* end;\nunsigned long long val = std::strtoull("0xDEADBEEFCAFE", &end, 16);',
    seeAlso: ['std::strtoll', 'std::strtoul']
  },
  'std::strtod': {
    symbol: 'std::strtod',
    canonicalSignature: 'double strtod(const char* str, char** str_end);',
    summary: 'Interprets a floating-point value in the byte string pointed to by str. Discards leading whitespace.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      str: 'Null-terminated byte string to parse',
      str_end: 'Pointer to pointer to store address of first unparsed character'
    },
    returns: 'Parsed double floating-point value.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strtof',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char* end;\ndouble d = std::strtod("3.14159265", &end);',
    seeAlso: ['std::strtol', 'std::strtoll']
  },
  'std::qsort': {
    symbol: 'std::qsort',
    canonicalSignature: 'void qsort(void* ptr, std::size_t count, std::size_t size, int (*comp)(const void*, const void*));',
    summary: 'Sorts the array pointed to by ptr containing count elements of size bytes each using the comparison function comp.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      ptr: 'Pointer to the array to sort',
      count: 'Number of elements in array',
      size: 'Size of each element in bytes',
      comp: 'Comparison function returning negative if first < second, positive if first > second, 0 if equal'
    },
    returns: 'void.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/qsort',
    complexity: { time: 'O(N log N) average' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int arr[] = {5, 2, 8, 1};\nstd::qsort(arr, 4, sizeof(int), [](const void* a, const void* b) {\n    return (*static_cast<const int*>(a) - *static_cast<const int*>(b));\n});',
    seeAlso: ['std::bsearch']
  },
  'std::bsearch': {
    symbol: 'std::bsearch',
    canonicalSignature: 'void* bsearch(const void* key, const void* ptr, std::size_t count, std::size_t size, int (*comp)(const void*, const void*));',
    summary: 'Searches a sorted array of count elements of size bytes for key using binary search and comparison function comp.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      key: 'Pointer to the element to search for',
      ptr: 'Pointer to the sorted array',
      count: 'Number of elements in array',
      size: 'Size of each element in bytes',
      comp: 'Comparison function returning negative, 0, or positive'
    },
    returns: 'Pointer to matching element, or nullptr if not found.',
    docUrl: 'https://en.cppreference.com/w/cpp/algorithm/bsearch',
    complexity: { time: 'O(log N) comparisons' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int key = 8;\nint* item = static_cast<int*>(std::bsearch(&key, arr, 4, sizeof(int), comp));',
    seeAlso: ['std::qsort']
  },
  'std::div': {
    symbol: 'std::div',
    canonicalSignature: 'std::div_t div(int x, int y);\nstd::ldiv_t div(long x, long y);\nstd::lldiv_t div(long long x, long long y);',
    summary: 'Computes both the quotient and the remainder of division x / y in a single operation, returned as a struct containing quot and rem.',
    header: '<cstdlib>',
    standard: 'C++98',
    parameters: {
      x: 'Dividend value',
      y: 'Divisor value'
    },
    returns: 'Structure containing quot (quotient) and rem (remainder).',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/div',
    complexity: { time: 'O(1) hardware division instruction yielding both quotient and remainder' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'auto result = std::div(14, 3); // result.quot = 4, result.rem = 2',
    seeAlso: ['std::remainder', 'std::fmod']
  },
  'std::quick_exit': {
    symbol: 'std::quick_exit',
    canonicalSignature: '[[noreturn]] void quick_exit(int exit_code) noexcept;',
    summary: 'Causes normal program termination without cleaning up automatic or static resources, but calls functions registered with std::at_quick_exit.',
    header: '<cstdlib>',
    standard: 'C++11',
    parameters: {
      exit_code: 'Exit status of the program returned to host environment'
    },
    returns: 'Does not return.',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/program/quick_exit',
    complexity: { time: 'O(N) where N is registered at_quick_exit callbacks' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::quick_exit(0);',
    seeAlso: ['std::abort', 'std::exit']
  }
};

export const cstdlibModule: StlHeaderModule = {
  id: 'cstdlib',
  headers: ['<cstdlib>', '<stdlib.h>'],
  entries: CSTDLIB_ENTRIES
};
