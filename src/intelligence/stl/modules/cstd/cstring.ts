import { StlDocEntry, StlHeaderModule } from '../../types';

export const CSTRING_ENTRIES: Record<string, StlDocEntry> = {
  'std::memcpy': {
    symbol: 'std::memcpy',
    canonicalSignature: 'void* memcpy(void* dest, const void* src, std::size_t count);',
    summary: 'Copies count bytes from the object pointed to by src to the object pointed to by dest. Both objects are reinterpreted as arrays of unsigned char. Memory areas MUST NOT overlap (use std::memmove if overlapping).',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to destination memory',
      src: 'Pointer to source memory to copy from',
      count: 'Number of bytes to copy'
    },
    returns: 'dest.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/memcpy',
    complexity: { time: 'O(N) optimized with SIMD/AVX instructions by compiler intrinsic' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int src[4] = {1, 2, 3, 4};\nint dst[4];\nstd::memcpy(dst, src, sizeof(src));',
    seeAlso: ['std::memmove', 'std::memset', 'std::copy']
  },
  'std::memmove': {
    symbol: 'std::memmove',
    canonicalSignature: 'void* memmove(void* dest, const void* src, std::size_t count);',
    summary: 'Copies count bytes from src to dest. Safely handles overlapping source and destination memory buffers by copying via temporary buffer semantics.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to destination memory',
      src: 'Pointer to source memory to copy from',
      count: 'Number of bytes to copy'
    },
    returns: 'dest.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/memmove',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char str[] = "1234567890";\nstd::memmove(str + 4, str + 3, 3); // safely moves overlapping slice',
    seeAlso: ['std::memcpy', 'std::memset']
  },
  'std::memset': {
    symbol: 'std::memset',
    canonicalSignature: 'void* memset(void* dest, int ch, std::size_t count);',
    summary: 'Converts the value ch to unsigned char and copies it into each of the first count characters of the object pointed to by dest.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to the object to fill',
      ch: 'Byte fill value',
      count: 'Number of bytes to fill'
    },
    returns: 'dest.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/memset',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int buffer[100];\nstd::memset(buffer, 0, sizeof(buffer));',
    seeAlso: ['std::memcpy', 'std::fill']
  },
  'std::memcmp': {
    symbol: 'std::memcmp',
    canonicalSignature: 'int memcmp(const void* lhs, const void* rhs, std::size_t count);',
    summary: 'Compares the first count bytes of the memory areas pointed to by lhs and rhs as unsigned char.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      lhs: 'Pointer to first memory area',
      rhs: 'Pointer to second memory area',
      count: 'Number of bytes to examine'
    },
    returns: 'Negative if lhs < rhs, positive if lhs > rhs, zero if all count bytes match.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/memcmp',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'if (std::memcmp(hash1, hash2, 32) == 0) { /* matches */ }',
    seeAlso: ['std::strcmp', 'std::strncmp']
  },
  'std::strlen': {
    symbol: 'std::strlen',
    canonicalSignature: 'std::size_t strlen(const char* str);',
    summary: 'Returns the length of the given byte string, that is, the number of characters in a character array whose first element is pointed to by str, up to but not including the first null character.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      str: 'Pointer to null-terminated byte string'
    },
    returns: 'Length of string in characters.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strlen',
    complexity: { time: 'O(N) linear scan until null byte' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::size_t len = std::strlen("c-cpp-pro"); // 7',
    seeAlso: ['std::string::size', 'std::string_view::size']
  },
  'std::strcpy': {
    symbol: 'std::strcpy',
    canonicalSignature: 'char* strcpy(char* dest, const char* src);',
    summary: 'Copies the null-terminated byte string pointed to by src, including the null terminator, to dest. Does NOT perform bounds checking (prefer std::string or strncpy).',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to character array to write to',
      src: 'Pointer to null-terminated source string'
    },
    returns: 'dest.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strcpy',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char buffer[32];\nstd::strcpy(buffer, "Hello World");',
    seeAlso: ['std::strncpy', 'std::memcpy']
  },
  'std::strncpy': {
    symbol: 'std::strncpy',
    canonicalSignature: 'char* strncpy(char* dest, const char* src, std::size_t count);',
    summary: 'Copies at most count characters of the character array pointed to by src to character array pointed to by dest. Note: if src is longer than count, dest will NOT be null-terminated.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to destination array',
      src: 'Pointer to source string',
      count: 'Maximum number of characters to copy'
    },
    returns: 'dest.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strncpy',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char buf[16];\nstd::strncpy(buf, "input", sizeof(buf) - 1);\nbuf[sizeof(buf) - 1] = \'\\0\';',
    seeAlso: ['std::strcpy', 'std::memcpy']
  },
  'std::strcmp': {
    symbol: 'std::strcmp',
    canonicalSignature: 'int strcmp(const char* lhs, const char* rhs);',
    summary: 'Compares two null-terminated byte strings lexicographically.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      lhs: 'Pointer to first null-terminated string',
      rhs: 'Pointer to second null-terminated string'
    },
    returns: 'Negative if lhs < rhs, positive if lhs > rhs, 0 if strings are equal.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strcmp',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'if (std::strcmp(name, "admin") == 0) { /* logged in */ }',
    seeAlso: ['std::strncmp', 'std::memcmp']
  },
  'std::strncmp': {
    symbol: 'std::strncmp',
    canonicalSignature: 'int strncmp(const char* lhs, const char* rhs, std::size_t count);',
    summary: 'Compares at most count characters of two byte strings lexicographically.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      lhs: 'Pointer to first string',
      rhs: 'Pointer to second string',
      count: 'Maximum number of characters to compare'
    },
    returns: 'Negative if lhs < rhs, positive if lhs > rhs, 0 if equal up to count characters.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strncmp',
    complexity: { time: 'O(min(N, count))' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'if (std::strncmp(prefix, "--flag", 6) == 0) { /* flag matched */ }',
    seeAlso: ['std::strcmp', 'std::memcmp']
  },
  'std::strstr': {
    symbol: 'std::strstr',
    canonicalSignature: 'const char* strstr(const char* haystack, const char* needle);\nchar* strstr(char* haystack, const char* needle);',
    summary: 'Finds the first occurrence of the substring needle in the byte string haystack.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      haystack: 'Pointer to null-terminated string to search in',
      needle: 'Pointer to null-terminated substring to search for'
    },
    returns: 'Pointer to first occurrence of needle in haystack, or nullptr if not found.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strstr',
    complexity: { time: 'O(N * M) worst case, typically optimized by standard library' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'const char* found = std::strstr("visual studio code", "studio");',
    seeAlso: ['std::strchr', 'std::string::find']
  },
  'std::strchr': {
    symbol: 'std::strchr',
    canonicalSignature: 'const char* strchr(const char* str, int ch);\nchar* strchr(char* str, int ch);',
    summary: 'Finds the first occurrence of ch (converted to char) in the byte string pointed to by str.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      str: 'Pointer to null-terminated string',
      ch: 'Character to search for'
    },
    returns: 'Pointer to found character, or nullptr if not found.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strchr',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'const char* ext = std::strchr("file.cpp", \'.\');',
    seeAlso: ['std::strrchr', 'std::strstr']
  },
  'std::strrchr': {
    symbol: 'std::strrchr',
    canonicalSignature: 'const char* strrchr(const char* str, int ch);\nchar* strrchr(char* str, int ch);',
    summary: 'Finds the last occurrence of ch (converted to char) in the byte string pointed to by str.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      str: 'Pointer to null-terminated string to search',
      ch: 'Character to search for'
    },
    returns: 'Pointer to last occurrence of ch, or nullptr if not found.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strrchr',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'const char* path = "/usr/local/bin/app";\nconst char* file = std::strrchr(path, \'/\');',
    seeAlso: ['std::strchr', 'std::strpbrk']
  },
  'std::strspn': {
    symbol: 'std::strspn',
    canonicalSignature: 'std::size_t strspn(const char* dest, const char* src);',
    summary: 'Returns the length of the maximum initial segment of dest consisting entirely of characters contained in src.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to null-terminated string to be analyzed',
      src: 'Pointer to null-terminated string containing characters to match'
    },
    returns: 'Number of characters in initial segment consisting only of characters from src.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strspn',
    complexity: { time: 'O(N * M)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::size_t digits = std::strspn("12345abc", "0123456789"); // 5',
    seeAlso: ['std::strcspn', 'std::strpbrk']
  },
  'std::strcspn': {
    symbol: 'std::strcspn',
    canonicalSignature: 'std::size_t strcspn(const char* dest, const char* src);',
    summary: 'Returns the length of the maximum initial segment of dest consisting entirely of characters NOT contained in src.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to null-terminated string to be analyzed',
      src: 'Pointer to null-terminated string containing characters to reject'
    },
    returns: 'Number of characters in initial segment containing none of the characters from src.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strcspn',
    complexity: { time: 'O(N * M)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::size_t non_vowels = std::strcspn("rhythm", "aeiou"); // 6',
    seeAlso: ['std::strspn', 'std::strpbrk']
  },
  'std::strpbrk': {
    symbol: 'std::strpbrk',
    canonicalSignature: 'const char* strpbrk(const char* dest, const char* breakset);\nchar* strpbrk(char* dest, const char* breakset);',
    summary: 'Finds the first character in dest that matches any character in breakset.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      dest: 'Pointer to null-terminated string to scan',
      breakset: 'Pointer to null-terminated string containing characters to search for'
    },
    returns: 'Pointer to first matching character in dest, or nullptr if none found.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strpbrk',
    complexity: { time: 'O(N * M)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'const char* pos = std::strpbrk("hello, world", " .,;");',
    seeAlso: ['std::strchr', 'std::strspn', 'std::strcspn']
  },
  'std::strtok': {
    symbol: 'std::strtok',
    canonicalSignature: 'char* strtok(char* str, const char* delim);',
    summary: 'Finds the next token in a null-terminated byte string pointed to by str, modifying the string by writing null characters. Not thread-safe.',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      str: 'Pointer to string to tokenize, or nullptr to continue tokenizing previous string',
      delim: 'Pointer to null-terminated string containing delimiters'
    },
    returns: 'Pointer to beginning of next token, or nullptr if no more tokens.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strtok',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char str[] = "one,two,three";\nchar* tok = std::strtok(str, ",");\nwhile (tok != nullptr) {\n    tok = std::strtok(nullptr, ",");\n}',
    seeAlso: ['std::strspn', 'std::strcspn']
  },
  'std::strerror': {
    symbol: 'std::strerror',
    canonicalSignature: 'char* strerror(int errnum);',
    summary: 'Returns a pointer to the textual representation of the system error code errnum (matching errno values).',
    header: '<cstring>',
    standard: 'C++98',
    parameters: {
      errnum: 'Integral error number (usually errno)'
    },
    returns: 'Pointer to null-terminated byte string describing error.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/strerror',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'const char* msg = std::strerror(errno);',
    seeAlso: ['std::perror']
  }
};

export const cstringModule: StlHeaderModule = {
  id: 'cstring',
  headers: ['<cstring>', '<string.h>'],
  entries: CSTRING_ENTRIES
};
