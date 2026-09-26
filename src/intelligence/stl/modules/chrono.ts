import { StlDocEntry, StlHeaderModule } from '../types';

export const CHRONO_ENTRIES: Record<string, StlDocEntry> = {
  "std::chrono::duration": {
    "symbol": "std::chrono::duration",
    "canonicalSignature": "template <typename Rep, typename Period = std::ratio<1>>\nclass duration;",
    "summary": "Represents a span of time (e.g. 5 seconds, 100 milliseconds). Type-safe against unit conversion errors.",
    "header": "<chrono>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/duration",
    "complexity": {
      "time": "O(0) compile-time dimensional analysis, zero runtime overhead"
    },
    "exceptionSafety": "Arithmetic and conversion operations between fundamental representation types are noexcept.",
    "example": "using namespace std::chrono_literals;\nauto timeout = 500ms;\nstd::this_thread::sleep_for(timeout);",
    "seeAlso": [
      "std::chrono::time_point",
      "std::chrono::steady_clock"
    ]
  },
  "std::chrono::time_point": {
    "symbol": "std::chrono::time_point",
    "canonicalSignature": "template <typename Clock, typename Duration = typename Clock::duration>\nclass time_point;",
    "summary": "Represents a point in time, stored as a duration offset relative to a specific clock epoch.",
    "header": "<chrono>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/time_point",
    "complexity": {
      "time": "O(1) storage and arithmetic operations, zero runtime overhead"
    },
    "exceptionSafety": "All operations are noexcept provided the underlying Duration arithmetic does not throw.",
    "example": "auto now = std::chrono::system_clock::now();\nauto future_tp = now + std::chrono::hours(24);",
    "seeAlso": [
      "std::chrono::duration",
      "std::chrono::system_clock",
      "std::chrono::steady_clock"
    ]
  },
  "std::chrono::system_clock": {
    "symbol": "std::chrono::system_clock",
    "canonicalSignature": "class system_clock;",
    "summary": "Wall-clock time from the system-wide real-time clock. Can be mapped to C calendar time via to_time_t and from_time_t.",
    "header": "<chrono>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/system_clock",
    "complexity": {
      "time": "now(): OS gettimeofday/GetSystemTimePreciseAsFileTime syscall"
    },
    "exceptionSafety": "now() is noexcept.",
    "example": "auto now = std::chrono::system_clock::now();\nstd::time_t t = std::chrono::system_clock::to_time_t(now);\nstd::println(\"Epoch time: {}\", t);",
    "seeAlso": [
      "std::chrono::steady_clock",
      "std::chrono::high_resolution_clock",
      "std::chrono::utc_clock"
    ]
  },
  "std::chrono::steady_clock": {
    "symbol": "std::chrono::steady_clock",
    "canonicalSignature": "class steady_clock;",
    "summary": "Monotonic clock that is guaranteed to never be adjusted or step backwards. Ideal for measuring elapsed time intervals and benchmarks.",
    "header": "<chrono>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/steady_clock",
    "complexity": {
      "time": "now(): OS monotonic timestamp syscall (clock_gettime CLOCK_MONOTONIC / QueryPerformanceCounter)"
    },
    "exceptionSafety": "now() is noexcept.",
    "example": "auto start = std::chrono::steady_clock::now();\n// compute intensive work\nauto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now() - start);",
    "seeAlso": [
      "std::chrono::system_clock",
      "std::chrono::high_resolution_clock",
      "std::chrono::duration"
    ]
  },
  "std::chrono::high_resolution_clock": {
    "symbol": "std::chrono::high_resolution_clock",
    "canonicalSignature": "using high_resolution_clock = /* implementation-defined */;",
    "summary": "Clock with the shortest tick period provided by the implementation. Often an alias to steady_clock or system_clock.",
    "header": "<chrono>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/high_resolution_clock",
    "complexity": {
      "time": "now(): Hardware high-resolution counter syscall / instruction"
    },
    "exceptionSafety": "now() is noexcept.",
    "example": "auto t0 = std::chrono::high_resolution_clock::now();\n// Measured routine\nauto t1 = std::chrono::high_resolution_clock::now();\nauto diff = std::chrono::duration_cast<std::chrono::nanoseconds>(t1 - t0);",
    "seeAlso": [
      "std::chrono::steady_clock",
      "std::chrono::system_clock"
    ]
  },
  "std::chrono::utc_clock": {
    "symbol": "std::chrono::utc_clock",
    "canonicalSignature": "class utc_clock;",
    "summary": "Clock that measures Coordinated Universal Time (UTC), accounting for leap seconds inserted since 1972-01-01 00:00:00 UTC.",
    "header": "<chrono>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/utc_clock",
    "complexity": {
      "time": "now(): System UTC clock lookup with leap-second leap table reference"
    },
    "exceptionSafety": "now() is noexcept.",
    "example": "auto utc_now = std::chrono::utc_clock::now();\nauto sys_now = std::chrono::utc_clock::to_sys(utc_now);",
    "seeAlso": [
      "std::chrono::system_clock",
      "std::chrono::tai_clock",
      "std::chrono::gps_clock"
    ]
  },
  "std::chrono::duration_cast": {
    "symbol": "std::chrono::duration_cast",
    "canonicalSignature": "template <typename ToDuration, typename Rep, typename Period>\nconstexpr ToDuration duration_cast(const std::chrono::duration<Rep, Period>& d);",
    "summary": "Converts a duration to another duration type with a different period or representation, truncating towards zero if conversion is lossy.",
    "header": "<chrono>",
    "standard": "C++11",
    "parameters": {
      "d": "Duration to convert."
    },
    "returns": "The duration converted to type ToDuration.",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/duration/duration_cast",
    "complexity": {
      "time": "O(1) compile-time integer/floating-point ratio scaling, zero runtime overhead"
    },
    "exceptionSafety": "noexcept unless representation type arithmetic throws.",
    "example": "using namespace std::chrono_literals;\nauto sec = 5s;\nauto ms = std::chrono::duration_cast<std::chrono::milliseconds>(sec); // 5000ms",
    "seeAlso": [
      "std::chrono::time_point_cast",
      "std::chrono::duration",
      "std::chrono::floor"
    ]
  },
  "std::chrono::time_point_cast": {
    "symbol": "std::chrono::time_point_cast",
    "canonicalSignature": "template <typename ToDuration, typename Clock, typename Duration>\nconstexpr std::chrono::time_point<Clock, ToDuration> time_point_cast(const std::chrono::time_point<Clock, Duration>& t);",
    "summary": "Converts a time_point to another time_point on the same clock with a different duration resolution.",
    "header": "<chrono>",
    "standard": "C++11",
    "parameters": {
      "t": "Time point to convert."
    },
    "returns": "std::chrono::time_point with duration ToDuration.",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/time_point/time_point_cast",
    "complexity": {
      "time": "O(1) conversion via duration_cast"
    },
    "exceptionSafety": "noexcept unless representation conversion throws.",
    "example": "auto now = std::chrono::system_clock::now();\nauto days_tp = std::chrono::time_point_cast<std::chrono::days>(now);",
    "seeAlso": [
      "std::chrono::duration_cast",
      "std::chrono::time_point"
    ]
  },
  "std::chrono::zoned_time": {
    "symbol": "std::chrono::zoned_time",
    "canonicalSignature": "template <typename Duration, typename TimeZonePtr = const std::chrono::time_zone*>\nclass zoned_time;",
    "summary": "Represents a logical pairing of a time zone and a sys_time or local_time, providing time zone conversions and DST handling.",
    "header": "<chrono>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/zoned_time",
    "complexity": {
      "time": "O(1) time zone database offset calculation"
    },
    "exceptionSafety": "Constructor throws std::runtime_error if the named time zone cannot be found in the IANA tz database.",
    "example": "std::chrono::zoned_time zt{\"America/New_York\", std::chrono::system_clock::now()};\nstd::println(\"Local time in NY: {}\", zt.get_local_time());",
    "seeAlso": [
      "std::chrono::time_zone",
      "std::chrono::locate_zone",
      "std::chrono::system_clock"
    ]
  },
  "std::chrono::year_month_day": {
    "symbol": "std::chrono::year_month_day",
    "canonicalSignature": "class year_month_day;",
    "summary": "Represents a specific year, month, and day in the Gregorian calendar. Supports conversion to and from std::chrono::sys_days.",
    "header": "<chrono>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/chrono/year_month_day",
    "complexity": {
      "time": "O(1) field storage; conversion to/from sys_days uses Gregorian day count arithmetic"
    },
    "exceptionSafety": "All field accessors and constructors are noexcept.",
    "example": "using namespace std::chrono;\nyear_month_day ymd{2026y, September, 27d};\nif (ymd.ok()) {\n    sys_days days = sys_days{ymd};\n}",
    "seeAlso": [
      "std::chrono::year",
      "std::chrono::month",
      "std::chrono::day",
      "std::chrono::sys_days"
    ]
  }
};

export const chronoModule: StlHeaderModule = {
  id: 'chrono',
  headers: ["<chrono>"],
  entries: CHRONO_ENTRIES
};
