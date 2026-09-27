import { StlDocEntry, StlHeaderModule } from '../types';

export const IO_ENTRIES: Record<string, StlDocEntry> = {
  'std::format': {
    symbol: 'std::format',
    canonicalSignature: 'template <typename... Args>\n[[nodiscard]] std::string format(std::format_string<Args...> fmt, Args&&... args);',
    summary: 'Type-safe, fast string formatting with compile-time format string validation. Combines the ergonomics of Python f-strings / printf with C++ type safety.',
    header: '<format>',
    standard: 'C++20',
    parameters: {
      fmt: 'Format string containing replacement fields `{}` and optional specifiers (e.g. `"{:.2f}"`).',
      args: 'Values to format into the replacement fields.'
    },
    returns: 'A newly constructed std::string containing the formatted text.',
    docUrl: 'https://en.cppreference.com/w/cpp/utility/format/format',
    complexity: {
      time: 'Linear in output string length O(N)'
    },
    exceptionSafety: 'Throws std::format_error on invalid format specification.',
    example: 'std::string s = std::format("Thread {} processed {:.2f} MB", 4, 128.456);\n// Result: "Thread 4 processed 128.46 MB"',
    seeAlso: ['std::print', 'std::println']
  },
  'std::print': {
    symbol: 'std::print',
    canonicalSignature: 'template <typename... Args>\nvoid print(std::format_string<Args...> fmt, Args&&... args);',
    summary: 'Prints formatted output directly to stdout in a single unbuffered, type-safe, Unicode-aware call. Superior to std::cout and printf.',
    header: '<print>',
    standard: 'C++23',
    parameters: {
      fmt: 'Format string containing replacement fields.',
      args: 'Values to format into the output.'
    },
    returns: 'void',
    docUrl: 'https://en.cppreference.com/w/cpp/io/print',
    complexity: {
      time: 'Linear in output size O(N)'
    },
    exceptionSafety: 'Throws std::system_error on I/O write failure.',
    example: 'std::print("Connecting to {}:{}...", host, port);',
    seeAlso: ['std::println', 'std::format']
  },
  'std::println': {
    symbol: 'std::println',
    canonicalSignature: 'template <typename... Args>\nvoid println(std::format_string<Args...> fmt, Args&&... args);',
    summary: 'Prints formatted output directly to stdout followed by a newline \\n in a single atomic Unicode call.',
    header: '<print>',
    standard: 'C++23',
    parameters: {
      fmt: 'Format string containing replacement fields.',
      args: 'Values to format into the output.'
    },
    returns: 'void',
    docUrl: 'https://en.cppreference.com/w/cpp/io/println',
    complexity: {
      time: 'Linear in output size O(N)'
    },
    exceptionSafety: 'Throws std::system_error on I/O write failure.',
    example: 'std::println("Build completed in {} ms with {} errors.", duration, errors);',
    seeAlso: ['std::print', 'std::format']
  },
  'std::cout': {
    symbol: 'std::cout',
    canonicalSignature: 'extern std::ostream cout;',
    summary: 'Global standard output stream object of type std::ostream. Tied to stdout by default.',
    header: '<iostream>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/io/cout',
    complexity: { time: 'Stream output operation' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::cout << "Hello C/C++ Pro!\\n";',
    seeAlso: ['std::cin', 'std::cerr', 'std::println']
  },
  'std::cin': {
    symbol: 'std::cin',
    canonicalSignature: 'extern std::istream cin;',
    summary: 'Global standard input stream object of type std::istream. Tied to stdin by default.',
    header: '<iostream>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/io/cin',
    complexity: { time: 'Stream input operation' },
    exceptionSafety: 'Basic guarantee.',
    example: 'int val;\nstd::cin >> val;',
    seeAlso: ['std::cout']
  },
  'std::cerr': {
    symbol: 'std::cerr',
    canonicalSignature: 'extern std::ostream cerr;',
    summary: 'Global standard error stream object of type std::ostream. Unbuffered by default; flushes immediately on each write.',
    header: '<iostream>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/io/cerr',
    complexity: { time: 'Stream output operation' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::cerr << "Error: File not found\\n";',
    seeAlso: ['std::cout', 'std::clog']
  },
  'std::endl': {
    symbol: 'std::endl',
    canonicalSignature: 'template <class CharT, class Traits>\nstd::basic_ostream<CharT, Traits>& endl(std::basic_ostream<CharT, Traits>& os);',
    summary: 'Stream manipulator that inserts a newline character \\n into the output stream and flushes the stream buffer.',
    header: '<iostream>',
    standard: 'C++98',
    parameters: {
      os: 'Target output stream'
    },
    returns: 'Reference to output stream os.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/manip/endl',
    complexity: { time: 'O(1) plus buffer flush' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::cout << "Line 1" << std::endl;',
    seeAlso: ['std::cout', 'std::flush']
  },
  'std::ifstream': {
    symbol: 'std::ifstream',
    canonicalSignature: 'using ifstream = basic_ifstream<char>;',
    summary: 'Input file stream class to operate on disk files for reading data.',
    header: '<fstream>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/io/basic_ifstream',
    complexity: { time: 'OS file read syscalls' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::ifstream file("config.json");\nstd::string line;\nwhile (std::getline(file, line)) { /* process */ }',
    seeAlso: ['std::ofstream', 'std::fstream']
  },
  'std::ofstream': {
    symbol: 'std::ofstream',
    canonicalSignature: 'using ofstream = basic_ofstream<char>;',
    summary: 'Output file stream class to operate on disk files for writing data.',
    header: '<fstream>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/io/basic_ofstream',
    complexity: { time: 'OS file write syscalls' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::ofstream out("log.txt");\nout << "Initialization complete\\n";',
    seeAlso: ['std::ifstream', 'std::fstream']
  },
  'std::stringstream': {
    symbol: 'std::stringstream',
    canonicalSignature: 'using stringstream = basic_stringstream<char>;',
    summary: 'Stream class to operate on in-memory std::string objects for formatted parsing and construction.',
    header: '<sstream>',
    standard: 'C++98',
    parameters: {},
    returns: '',
    docUrl: 'https://en.cppreference.com/w/cpp/io/basic_stringstream',
    complexity: { time: 'In-memory string buffer reads and writes' },
    exceptionSafety: 'Basic guarantee.',
    example: 'std::stringstream ss;\nss << "Value: " << 42;\nstd::string result = ss.str();',
    seeAlso: ['std::istringstream', 'std::ostringstream']
  }
};

export const ioModule: StlHeaderModule = {
  id: 'io',
  headers: ['<format>', '<print>', '<iostream>', '<fstream>', '<sstream>'],
  entries: IO_ENTRIES
};
