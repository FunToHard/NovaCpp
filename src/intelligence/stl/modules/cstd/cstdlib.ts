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
  }
};

export const cstdlibModule: StlHeaderModule = {
  id: 'cstdlib',
  headers: ['<cstdlib>', '<stdlib.h>'],
  entries: CSTDLIB_ENTRIES
};
