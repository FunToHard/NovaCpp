import { StlDocEntry, StlHeaderModule } from '../types';

export const CONCURRENCY_ENTRIES: Record<string, StlDocEntry> = {
  "std::jthread": {
    "symbol": "std::jthread",
    "canonicalSignature": "class jthread;",
    "summary": "Cooperative cancellation thread. Has the same behavior as `std::thread`, but automatically joins on destruction and supports cooperative stop tokens.",
    "header": "<thread>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/jthread",
    "complexity": {
      "time": "Thread spawning is an OS syscall"
    },
    "exceptionSafety": "Throws std::system_error if the thread could not be started.",
    "example": "std::jthread worker([](std::stop_token stoken) {\n    while (!stoken.stop_requested()) {\n        // background processing\n    }\n});\n// worker automatically requests stop and joins when going out of scope",
    "seeAlso": [
      "std::thread",
      "std::stop_token"
    ]
  },
  "std::thread": {
    "symbol": "std::thread",
    "canonicalSignature": "class thread;",
    "summary": "Represents a single thread of execution. Threads begin execution immediately upon construction. MUST call `join()` or `detach()` before destruction or `std::terminate` is called.",
    "header": "<thread>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/thread",
    "complexity": {
      "time": "Thread creation is an OS context allocation"
    },
    "exceptionSafety": "Destructor terminates the process if thread is joinable.",
    "example": "std::thread t([]() { std::println(\"Worker running\"); });\nt.join();",
    "seeAlso": [
      "std::jthread",
      "std::async"
    ]
  },
  "std::mutex": {
    "symbol": "std::mutex",
    "canonicalSignature": "class mutex;",
    "summary": "Mutual exclusion primitive used to protect shared data from being simultaneously accessed by multiple threads. Non-recursive.",
    "header": "<mutex>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/mutex",
    "complexity": {
      "time": "Fast atomic lock/unlock in uncontended case; OS futex/kernel wait on contention"
    },
    "example": "std::mutex mtx;\nint counter = 0;\nvoid increment() {\n    std::lock_guard<std::mutex> lock(mtx);\n    ++counter;\n}",
    "seeAlso": [
      "std::lock_guard",
      "std::unique_lock",
      "std::scoped_lock"
    ]
  },
  "std::lock_guard": {
    "symbol": "std::lock_guard",
    "canonicalSignature": "template <typename Mutex>\nclass lock_guard;",
    "summary": "RAII wrapper for mutexes. Acquires the given mutex on construction and releases it strictly on destruction when scope is exited.",
    "header": "<mutex>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/lock_guard",
    "complexity": {
      "time": "O(1) lock on enter, O(1) unlock on exit"
    },
    "exceptionSafety": "Guarantees mutex unlock even if an exception is thrown in the critical section.",
    "example": "std::mutex mtx;\n{\n    std::lock_guard lock(mtx); // C++17 Class Template Argument Deduction (CTAD)\n    shared_resource.update();\n} // Automatically unlocked here",
    "seeAlso": [
      "std::scoped_lock",
      "std::unique_lock"
    ]
  },
  "std::scoped_lock": {
    "symbol": "std::scoped_lock",
    "canonicalSignature": "template <typename... MutexTypes>\nclass scoped_lock;",
    "summary": "RAII wrapper that acquires multiple mutexes atomically using a deadlock-avoidance algorithm (similar to `std::lock`).",
    "header": "<mutex>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/scoped_lock",
    "complexity": {
      "time": "O(1) to O(K) deadlock avoidance"
    },
    "example": "std::mutex m1, m2;\nvoid transfer() {\n    std::scoped_lock lock(m1, m2); // Locks both without deadlock\n}",
    "seeAlso": [
      "std::lock_guard",
      "std::unique_lock"
    ]
  },
  "std::atomic": {
    "symbol": "std::atomic",
    "canonicalSignature": "template <typename T>\nstruct atomic;",
    "summary": "Provides lock-free, thread-safe atomic operations on types `T`. Guarantees well-defined memory orderings without data races.",
    "header": "<atomic>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/atomic/atomic",
    "complexity": {
      "time": "Hardware atomic instruction (LOCK CMPXCHG on x86, LDREX/STREX on ARM); wait-free when is_lock_free() is true"
    },
    "example": "std::atomic<int> counter{0};\ncounter.fetch_add(1, std::memory_order_relaxed);",
    "seeAlso": [
      "std::atomic_ref",
      "std::mutex"
    ]
  }
};

export const concurrencyModule: StlHeaderModule = {
  id: 'concurrency',
  headers: ["<thread>","<mutex>","<atomic>"],
  entries: CONCURRENCY_ENTRIES
};
