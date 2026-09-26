import { StlDocEntry, StlHeaderModule } from '../../types';

export const CSTDIO_ENTRIES: Record<string, StlDocEntry> = {
  'std::printf': {
    symbol: 'std::printf',
    canonicalSignature: 'int printf(const char* format, ...);',
    summary: 'Writes formatted data to stdout according to format specifiers (%d, %s, %f, etc.). In modern C++, prefer std::print or std::format for type safety.',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      format: 'Null-terminated string containing format specifications',
      '...': 'Arguments to be formatted according to specifiers'
    },
    returns: 'Number of characters transmitted to the output stream, or a negative value if an output error occurred.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/printf',
    complexity: { time: 'O(N) where N is output length', space: 'O(1) buffer overhead' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::printf("Value: %d, Rate: %.2f\\n", 42, 3.1415);',
    seeAlso: ['std::snprintf', 'std::print', 'std::format']
  },
  'std::snprintf': {
    symbol: 'std::snprintf',
    canonicalSignature: 'int snprintf(char* buffer, std::size_t bufsz, const char* format, ...);',
    summary: 'Writes formatted output to a sized character buffer. Guarantees null-termination if bufsz > 0, preventing buffer overflows.',
    header: '<cstdio>',
    standard: 'C++11',
    parameters: {
      buffer: 'Destination char array buffer',
      bufsz: 'Maximum number of bytes to write (including null terminator)',
      format: 'Format string'
    },
    returns: 'Number of characters that would have been written if bufsz had been sufficiently large, not counting terminating null.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fprintf',
    complexity: { time: 'O(N) where N is output length' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char buf[64];\nstd::snprintf(buf, sizeof(buf), "Error code: %d", 404);',
    seeAlso: ['std::sprintf', 'std::printf', 'std::format_to_n']
  },
  'std::sprintf': {
    symbol: 'std::sprintf',
    canonicalSignature: 'int sprintf(char* buffer, const char* format, ...);',
    summary: 'Writes formatted output to a character buffer without bounds checking. Highly vulnerable to buffer overflow; prefer std::snprintf or std::format.',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      buffer: 'Pointer to a char buffer sufficiently large to hold result',
      format: 'Format string'
    },
    returns: 'Number of characters written.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fprintf',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char msg[32];\nstd::sprintf(msg, "ID: %04d", 7);',
    seeAlso: ['std::snprintf', 'std::format']
  },
  'std::fprintf': {
    symbol: 'std::fprintf',
    canonicalSignature: 'int fprintf(std::FILE* stream, const char* format, ...);',
    summary: 'Writes formatted output to the specified C file stream (e.g. stdout, stderr, or a file opened with std::fopen).',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      stream: 'Output file stream pointer',
      format: 'Format string'
    },
    returns: 'Number of characters written, or negative on error.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fprintf',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::fprintf(stderr, "Fatal error: %s\\n", err_msg);',
    seeAlso: ['std::printf', 'std::fopen']
  },
  'std::fopen': {
    symbol: 'std::fopen',
    canonicalSignature: 'std::FILE* fopen(const char* filename, const char* mode);',
    summary: 'Opens the file indicated by filename and associates it with a stream. Modes include "r", "w", "a", "rb", "wb", "r+", etc.',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      filename: 'Null-terminated string identifying the file path',
      mode: 'Access mode string: "r" (read), "w" (write/create), "a" (append), etc.'
    },
    returns: 'Pointer to FILE object on success; nullptr on failure with errno set.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fopen',
    complexity: { time: 'O(1) filesystem OS syscall' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::FILE* fp = std::fopen("data.bin", "rb");\nif (fp) {\n    // read data\n    std::fclose(fp);\n}',
    seeAlso: ['std::fclose', 'std::fread', 'std::fwrite']
  },
  'std::fclose': {
    symbol: 'std::fclose',
    canonicalSignature: 'int fclose(std::FILE* stream);',
    summary: 'Flushes the unwritten buffer of the given stream, disassociates it from the underlying file descriptor, and releases resources.',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      stream: 'FILE pointer to close'
    },
    returns: '0 on success; EOF on error.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fclose',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::fclose(fp);',
    seeAlso: ['std::fopen', 'std::fflush']
  },
  'std::fread': {
    symbol: 'std::fread',
    canonicalSignature: 'std::size_t fread(void* buffer, std::size_t size, std::size_t count, std::FILE* stream);',
    summary: 'Reads up to count objects, each of size bytes, from stream into buffer.',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      buffer: 'Destination memory buffer',
      size: 'Size of each element to read in bytes',
      count: 'Number of elements to read',
      stream: 'File stream pointer'
    },
    returns: 'Number of elements successfully read.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fread',
    complexity: { time: 'O(N) where N = size * count' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::size_t n = std::fread(buffer, sizeof(int), 100, fp);',
    seeAlso: ['std::fwrite', 'std::fopen']
  },
  'std::fwrite': {
    symbol: 'std::fwrite',
    canonicalSignature: 'std::size_t fwrite(const void* buffer, std::size_t size, std::size_t count, std::FILE* stream);',
    summary: 'Writes up to count objects, each of size bytes, from buffer to stream.',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      buffer: 'Source memory buffer',
      size: 'Size of each element in bytes',
      count: 'Number of elements to write',
      stream: 'File stream pointer'
    },
    returns: 'Number of elements successfully written.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fwrite',
    complexity: { time: 'O(N) where N = size * count' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::size_t written = std::fwrite(data, 1, byte_count, fp);',
    seeAlso: ['std::fread', 'std::fflush']
  },
  'std::fflush': {
    symbol: 'std::fflush',
    canonicalSignature: 'int fflush(std::FILE* stream);',
    summary: 'Forces a write of all user-space buffered data for the given output or update stream.',
    header: '<cstdio>',
    standard: 'C++98',
    parameters: {
      stream: 'File stream pointer, or nullptr to flush all open output streams'
    },
    returns: '0 on success; EOF on error.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/c/fflush',
    complexity: { time: 'O(B) where B is buffered bytes' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::fflush(stdout);',
    seeAlso: ['std::fclose', 'std::fwrite']
  }
};

export const cstdioModule: StlHeaderModule = {
  id: 'cstdio',
  headers: ['<cstdio>', '<stdio.h>'],
  entries: CSTDIO_ENTRIES
};
