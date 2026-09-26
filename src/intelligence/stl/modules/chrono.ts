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
    "example": "using namespace std::chrono_literals;\nauto timeout = 500ms;\nstd::this_thread::sleep_for(timeout);",
    "seeAlso": [
      "std::chrono::time_point",
      "std::chrono::steady_clock"
    ]
  }
};

export const chronoModule: StlHeaderModule = {
  id: 'chrono',
  headers: ["<chrono>"],
  entries: CHRONO_ENTRIES
};
