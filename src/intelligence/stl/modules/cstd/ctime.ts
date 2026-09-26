import { StlDocEntry, StlHeaderModule } from '../../types';

export const CTIME_ENTRIES: Record<string, StlDocEntry> = {
  'std::time': {
    symbol: 'std::time',
    canonicalSignature: 'std::time_t time(std::time_t* arg);',
    summary: 'Returns the current calendar time of the system as time since epoch (00:00:00 UTC, January 1, 1970).',
    header: '<ctime>',
    standard: 'C++98',
    parameters: {
      arg: 'Pointer to a time_t object to store the time, or nullptr'
    },
    returns: 'Current calendar time as time_t value.',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/c/time',
    complexity: { time: 'O(1) OS syscall' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::time_t now = std::time(nullptr);',
    seeAlso: ['std::clock', 'std::localtime', 'std::chrono::system_clock']
  },
  'std::clock': {
    symbol: 'std::clock',
    canonicalSignature: 'std::clock_t clock();',
    summary: 'Returns the approximate processor time used by the current process since an era related to the program start.',
    header: '<ctime>',
    standard: 'C++98',
    parameters: {},
    returns: 'Processor time used by the process, or (clock_t)(-1) if unavailable. Divide by CLOCKS_PER_SEC to get seconds.',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/c/clock',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::clock_t t0 = std::clock();\n// compute...\ndouble sec = static_cast<double>(std::clock() - t0) / CLOCKS_PER_SEC;',
    seeAlso: ['std::time', 'std::chrono::steady_clock']
  },
  'std::difftime': {
    symbol: 'std::difftime',
    canonicalSignature: 'double difftime(std::time_t time_end, std::time_t time_beg);',
    summary: 'Computes difference between two calendar times (time_end - time_beg) in seconds.',
    header: '<ctime>',
    standard: 'C++98',
    parameters: {
      time_end: 'Ending calendar time',
      time_beg: 'Beginning calendar time'
    },
    returns: 'Difference in seconds as double.',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/c/difftime',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double elapsed = std::difftime(t2, t1);',
    seeAlso: ['std::time']
  },
  'std::localtime': {
    symbol: 'std::localtime',
    canonicalSignature: 'std::tm* localtime(const std::time_t* timer);',
    summary: 'Converts calendar time time_t to broken-down time std::tm expressed as local time. Returns pointer to static buffer (not thread-safe).',
    header: '<ctime>',
    standard: 'C++98',
    parameters: {
      timer: 'Pointer to time_t value to convert'
    },
    returns: 'Pointer to a static std::tm object, or nullptr on failure.',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/c/localtime',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::time_t t = std::time(nullptr);\nstd::tm* local = std::localtime(&t);',
    seeAlso: ['std::gmtime', 'std::strftime']
  },
  'std::strftime': {
    symbol: 'std::strftime',
    canonicalSignature: 'std::size_t strftime(char* str, std::size_t count, const char* format, const std::tm* timeptr);',
    summary: 'Converts the date and time information from a given std::tm structure to a null-terminated byte string according to format.',
    header: '<ctime>',
    standard: 'C++98',
    parameters: {
      str: 'Pointer to destination character array',
      count: 'Maximum number of characters to write',
      format: 'Format string (%Y, %m, %d, %H, %M, %S, etc.)',
      timeptr: 'Pointer to calendar time structure'
    },
    returns: 'Number of bytes written into str, or 0 if count was exceeded.',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/c/strftime',
    complexity: { time: 'O(N)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char buffer[80];\nstd::strftime(buffer, sizeof(buffer), "%Y-%m-%d %H:%M:%S", local);',
    seeAlso: ['std::localtime', 'std::format']
  }
};

export const ctimeModule: StlHeaderModule = {
  id: 'ctime',
  headers: ['<ctime>', '<time.h>'],
  entries: CTIME_ENTRIES
};
