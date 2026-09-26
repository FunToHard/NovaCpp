import { StlDocEntry, StlHeaderModule } from '../../types';

export const CSTDINT_ENTRIES: Record<string, StlDocEntry> = {
  'std::size_t': {
    symbol: 'std::size_t',
    canonicalSignature: 'using size_t = /* unsigned integer type of sizeof operator */;',
    summary: 'Unsigned integer type of the result of the sizeof operator. Guaranteed to be large enough to contain the size of any object that can be created.',
    header: '<cstddef>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/types/size_t',
    complexity: { time: 'Fundamental integer type' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::size_t count = vec.size();',
    seeAlso: ['std::ptrdiff_t', 'std::uint64_t']
  },
  'std::ptrdiff_t': {
    symbol: 'std::ptrdiff_t',
    canonicalSignature: 'using ptrdiff_t = /* signed integer type of pointer subtraction */;',
    summary: 'Signed integer type of the result of subtracting two pointers.',
    header: '<cstddef>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/types/ptrdiff_t',
    complexity: { time: 'Fundamental integer type' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::ptrdiff_t distance = ptr2 - ptr1;',
    seeAlso: ['std::size_t', 'std::intptr_t']
  },
  'std::int32_t': {
    symbol: 'std::int32_t',
    canonicalSignature: 'using int32_t = /* signed integer type of exactly 32 bits */;',
    summary: 'Signed integer type with width of exactly 32 bits and two\'s complement representation with no padding bits.',
    header: '<cstdint>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer',
    complexity: { time: '32-bit hardware integer' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::int32_t id = 100000;',
    seeAlso: ['std::uint32_t', 'std::int64_t']
  },
  'std::uint32_t': {
    symbol: 'std::uint32_t',
    canonicalSignature: 'using uint32_t = /* unsigned integer type of exactly 32 bits */;',
    summary: 'Unsigned integer type with width of exactly 32 bits with range [0, 4294967295].',
    header: '<cstdint>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer',
    complexity: { time: '32-bit hardware integer' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::uint32_t flags = 0xFFFFFFFF;',
    seeAlso: ['std::int32_t', 'std::uint64_t']
  },
  'std::int64_t': {
    symbol: 'std::int64_t',
    canonicalSignature: 'using int64_t = /* signed integer type of exactly 64 bits */;',
    summary: 'Signed integer type with width of exactly 64 bits with range [-9223372036854775808, 9223372036854775807].',
    header: '<cstdint>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer',
    complexity: { time: '64-bit hardware integer' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::int64_t large_counter = 100000000000LL;',
    seeAlso: ['std::uint64_t', 'std::int32_t']
  },
  'std::uint64_t': {
    symbol: 'std::uint64_t',
    canonicalSignature: 'using uint64_t = /* unsigned integer type of exactly 64 bits */;',
    summary: 'Unsigned integer type with width of exactly 64 bits with range [0, 18446744073709551615].',
    header: '<cstdint>',
    standard: 'C++11',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer',
    complexity: { time: '64-bit hardware integer' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::uint64_t hash = 0xCBF29CE484222325ULL;',
    seeAlso: ['std::int64_t', 'std::size_t']
  }
};

export const cstdintModule: StlHeaderModule = {
  id: 'cstdint',
  headers: ['<cstdint>', '<cstddef>', '<stdint.h>', '<stddef.h>'],
  entries: CSTDINT_ENTRIES
};
