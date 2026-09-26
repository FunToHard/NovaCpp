import { StlDocEntry, StlHeaderModule } from '../types';

export const BIT_ENTRIES: Record<string, StlDocEntry> = {
  'std::bit_cast': {
    symbol: 'std::bit_cast',
    canonicalSignature: 'template <typename To, typename From>\nconstexpr To bit_cast(const From& from) noexcept;',
    summary: 'Reinterprets the object representation of from as a new object of type To. Both types must be trivially copyable and equal in size. Valid in constexpr contexts.',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      from: 'Source object to reinterpret'
    },
    returns: 'Object of type To whose bit representation is identical to from.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/bit_cast',
    complexity: { time: 'O(1) compiled to register move or direct bit copy' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'constexpr float f = 1.0f;\nconstexpr uint32_t raw = std::bit_cast<uint32_t>(f); // 0x3F800000',
    seeAlso: ['std::memcpy']
  },
  'std::byteswap': {
    symbol: 'std::byteswap',
    canonicalSignature: 'template <std::integral T>\nconstexpr T byteswap(T n) noexcept;',
    summary: 'Reverses the bytes in the value of an integer n (endianness byte swap). Useful for network byte order translation.',
    header: '<bit>',
    standard: 'C++23',
    parameters: {
      n: 'Integral value whose byte representation will be reversed'
    },
    returns: 'Value with reversed byte order.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/byteswap',
    complexity: { time: 'O(1) compiled to hardware BSWAP instruction' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'uint32_t x = 0x12345678;\nuint32_t swapped = std::byteswap(x); // 0x78563412',
    seeAlso: ['std::endian', 'std::rotl']
  },
  'std::has_single_bit': {
    symbol: 'std::has_single_bit',
    canonicalSignature: 'template <std::unsigned_integral T>\nconstexpr bool has_single_bit(T x) noexcept;',
    summary: 'Checks if x is an integral power of two (i.e. has exactly one bit set to 1).',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integral value'
    },
    returns: 'true if x is a power of two, false otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/has_single_bit',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'bool p2 = std::has_single_bit(16u); // true\nbool notP2 = std::has_single_bit(15u); // false',
    seeAlso: ['std::bit_ceil', 'std::bit_floor', 'std::popcount']
  },
  'std::bit_ceil': {
    symbol: 'std::bit_ceil',
    canonicalSignature: 'template <std::unsigned_integral T>\nconstexpr T bit_ceil(T x);',
    summary: 'Finds the smallest integral power of two not less than x (rounds up to next power of 2).',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integral value'
    },
    returns: 'Smallest power of two >= x.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/bit_ceil',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'unsigned int cap = std::bit_ceil(10u); // 16',
    seeAlso: ['std::bit_floor', 'std::has_single_bit']
  },
  'std::bit_floor': {
    symbol: 'std::bit_floor',
    canonicalSignature: 'template <std::unsigned_integral T>\nconstexpr T bit_floor(T x) noexcept;',
    summary: 'Finds the largest integral power of two not greater than x (rounds down to previous power of 2). If x is 0, returns 0.',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integral value'
    },
    returns: 'Largest power of two <= x, or 0 if x == 0.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/bit_floor',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'unsigned int fl = std::bit_floor(10u); // 8',
    seeAlso: ['std::bit_ceil', 'std::has_single_bit']
  },
  'std::bit_width': {
    symbol: 'std::bit_width',
    canonicalSignature: 'template <std::unsigned_integral T>\nconstexpr int bit_width(T x) noexcept;',
    summary: 'Computes the smallest number of bits needed to represent the value of x (1 + floor(log2(x))), or 0 if x == 0.',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integral value'
    },
    returns: 'Number of bits required to represent x.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/bit_width',
    complexity: { time: 'O(1) compiled to hardware LZCNT/BSR instruction' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int bits = std::bit_width(5u); // 3 (binary 101)',
    seeAlso: ['std::countl_zero']
  },
  'std::rotl': {
    symbol: 'std::rotl',
    canonicalSignature: 'template <std::unsigned_integral T>\n[[nodiscard]] constexpr T rotl(T x, int s) noexcept;',
    summary: 'Computes the result of bitwise left rotating the value of x by s positions.',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integer to rotate',
      s: 'Number of bit positions to rotate left'
    },
    returns: 'Left-rotated bit pattern.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/rotl',
    complexity: { time: 'O(1) compiled to hardware ROL instruction' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'uint8_t val = 0b00000001;\nuint8_t rot = std::rotl(val, 2); // 0b00000100',
    seeAlso: ['std::rotr']
  },
  'std::rotr': {
    symbol: 'std::rotr',
    canonicalSignature: 'template <std::unsigned_integral T>\n[[nodiscard]] constexpr T rotr(T x, int s) noexcept;',
    summary: 'Computes the result of bitwise right rotating the value of x by s positions.',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integer to rotate',
      s: 'Number of bit positions to rotate right'
    },
    returns: 'Right-rotated bit pattern.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/rotr',
    complexity: { time: 'O(1) compiled to hardware ROR instruction' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'uint8_t val = 0b00000100;\nuint8_t rot = std::rotr(val, 2); // 0b00000001',
    seeAlso: ['std::rotl']
  },
  'std::countl_zero': {
    symbol: 'std::countl_zero',
    canonicalSignature: 'template <std::unsigned_integral T>\nconstexpr int countl_zero(T x) noexcept;',
    summary: 'Counts consecutive zero bits starting from the most significant bit (leading zeros).',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integral value'
    },
    returns: 'Number of leading consecutive zero bits in x.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/countl_zero',
    complexity: { time: 'O(1) compiled to hardware LZCNT / CLZ instruction' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'uint32_t val = 0x0000FFFF;\nint lz = std::countl_zero(val); // 16',
    seeAlso: ['std::countr_zero', 'std::bit_width']
  },
  'std::countr_zero': {
    symbol: 'std::countr_zero',
    canonicalSignature: 'template <std::unsigned_integral T>\nconstexpr int countr_zero(T x) noexcept;',
    summary: 'Counts consecutive zero bits starting from the least significant bit (trailing zeros).',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integral value'
    },
    returns: 'Number of trailing consecutive zero bits in x.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/countr_zero',
    complexity: { time: 'O(1) compiled to hardware TZCNT / CTZ instruction' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'uint32_t val = 0b1000;\nint tz = std::countr_zero(val); // 3',
    seeAlso: ['std::countl_zero']
  },
  'std::popcount': {
    symbol: 'std::popcount',
    canonicalSignature: 'template <std::unsigned_integral T>\nconstexpr int popcount(T x) noexcept;',
    summary: 'Counts the number of bits set to 1 in the value of x (population count / Hamming weight).',
    header: '<bit>',
    standard: 'C++20',
    parameters: {
      x: 'Unsigned integral value'
    },
    returns: 'Number of bits set to 1 in x.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/popcount',
    complexity: { time: 'O(1) hardware POPCNT instruction' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'uint8_t mask = 0b10110010;\nint ones = std::popcount(mask); // 4',
    seeAlso: ['std::has_single_bit', 'std::countl_zero']
  },
  'std::endian': {
    symbol: 'std::endian',
    canonicalSignature: 'enum class endian {\n    little = /* implementation-defined */,\n    big    = /* implementation-defined */,\n    native = /* implementation-defined */\n};',
    summary: 'Scoped enumeration indicating the endianness (byte-ordering) of scalar types on the target platform.',
    header: '<bit>',
    standard: 'C++20',
    parameters: {},
    returns: 'Enumeration value: std::endian::little, std::endian::big, or implementation-defined native.',
    docUrl: 'https://en.cppreference.com/w/cpp/types/endian',
    complexity: { time: 'O(1) compile-time constant' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'if constexpr (std::endian::native == std::endian::little) {\n    // Host architecture is little-endian\n}',
    seeAlso: ['std::byteswap', 'std::bit_cast']
  }
};

export const bitModule: StlHeaderModule = {
  id: 'bit',
  headers: ['<bit>'],
  entries: BIT_ENTRIES
};
