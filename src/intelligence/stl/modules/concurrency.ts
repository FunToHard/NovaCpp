import { StlDocEntry, StlHeaderModule } from '../types';

export const CONCURRENCY_ENTRIES: Record<string, StlDocEntry> = {
  "std::jthread": {
    "symbol": "std::jthread",
    "canonicalSignature": "class jthread;",
    "summary": "Cooperative cancellation thread. Has the same behavior as std::thread, but automatically joins on destruction and supports cooperative stop tokens.",
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
    "summary": "Represents a single thread of execution. Threads begin execution immediately upon construction. Must call join() or detach() before destruction or std::terminate is invoked.",
    "header": "<thread>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/thread",
    "complexity": {
      "time": "Thread creation is an OS context allocation"
    },
    "exceptionSafety": "Destructor terminates the process if thread is joinable. Constructor throws std::system_error on spawn failure.",
    "example": "std::thread t([]() {\n    std::println(\"Worker running\");\n});\nt.join();",
    "seeAlso": [
      "std::jthread",
      "std::async"
    ]
  },
  "std::this_thread::get_id": {
    "symbol": "std::this_thread::get_id",
    "canonicalSignature": "std::thread::id get_id() noexcept;",
    "summary": "Returns the unique thread identifier of the current calling thread of execution.",
    "header": "<thread>",
    "standard": "C++11",
    "parameters": {},
    "returns": "std::thread::id identifying the calling thread.",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/get_id",
    "complexity": {
      "time": "O(1) thread-local storage / register lookup"
    },
    "exceptionSafety": "noexcept",
    "example": "std::thread::id my_id = std::this_thread::get_id();\nstd::println(\"Current thread id: {}\", my_id);",
    "seeAlso": [
      "std::thread",
      "std::this_thread::yield"
    ]
  },
  "std::this_thread::yield": {
    "symbol": "std::this_thread::yield",
    "canonicalSignature": "void yield() noexcept;",
    "summary": "Provides a hint to the operating system implementation to reschedule execution of threads, allowing other threads to run.",
    "header": "<thread>",
    "standard": "C++11",
    "parameters": {},
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/yield",
    "complexity": {
      "time": "OS scheduler context switch / quantum relinquishment"
    },
    "exceptionSafety": "noexcept",
    "example": "while (!ready.load(std::memory_order_relaxed)) {\n    std::this_thread::yield();\n}",
    "seeAlso": [
      "std::this_thread::sleep_for",
      "std::this_thread::get_id"
    ]
  },
  "std::this_thread::sleep_for": {
    "symbol": "std::this_thread::sleep_for",
    "canonicalSignature": "template <typename Rep, typename Period>\nvoid sleep_for(const std::chrono::duration<Rep, Period>& sleep_duration);",
    "summary": "Blocks execution of the current thread for at least the specified duration.",
    "header": "<thread>",
    "standard": "C++11",
    "parameters": {
      "sleep_duration": "Time duration to block the calling thread."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/sleep_for",
    "complexity": {
      "time": "Suspends thread for at least sleep_duration via OS timer sleep"
    },
    "exceptionSafety": "Throws any exception thrown by clock or duration arithmetic operations.",
    "example": "using namespace std::chrono_literals;\nstd::this_thread::sleep_for(250ms);",
    "seeAlso": [
      "std::this_thread::sleep_until",
      "std::chrono::duration"
    ]
  },
  "std::this_thread::sleep_until": {
    "symbol": "std::this_thread::sleep_until",
    "canonicalSignature": "template <typename Clock, typename Duration>\nvoid sleep_until(const std::chrono::time_point<Clock, Duration>& sleep_time);",
    "summary": "Blocks execution of the current thread until the specified absolute time_point has been reached.",
    "header": "<thread>",
    "standard": "C++11",
    "parameters": {
      "sleep_time": "Absolute time point until which the calling thread is suspended."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/sleep_until",
    "complexity": {
      "time": "Suspends thread until specified time_point via OS timer facility"
    },
    "exceptionSafety": "Throws any exception thrown by Clock or Duration arithmetic operations.",
    "example": "using namespace std::chrono_literals;\nauto target = std::chrono::steady_clock::now() + 1s;\nstd::this_thread::sleep_until(target);",
    "seeAlso": [
      "std::this_thread::sleep_for",
      "std::chrono::time_point"
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
    "exceptionSafety": "lock() throws std::system_error if mutex could not be locked. unlock() is noexcept.",
    "example": "std::mutex mtx;\nint counter = 0;\nvoid increment() {\n    std::lock_guard<std::mutex> lock(mtx);\n    ++counter;\n}",
    "seeAlso": [
      "std::lock_guard",
      "std::unique_lock",
      "std::scoped_lock"
    ]
  },
  "std::timed_mutex": {
    "symbol": "std::timed_mutex",
    "canonicalSignature": "class timed_mutex;",
    "summary": "Mutual exclusion primitive that supports timed locking operations: try_lock_for and try_lock_until.",
    "header": "<mutex>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/timed_mutex",
    "complexity": {
      "time": "O(1) in uncontended case; bounded wait up to specified duration on contention"
    },
    "exceptionSafety": "lock(), try_lock_for(), and try_lock_until() throw std::system_error on failure; unlock() is noexcept.",
    "example": "std::timed_mutex mtx;\nusing namespace std::chrono_literals;\n\nvoid try_worker() {\n    if (mtx.try_lock_for(100ms)) {\n        // critical section\n        mtx.unlock();\n    }\n}",
    "seeAlso": [
      "std::mutex",
      "std::recursive_timed_mutex",
      "std::unique_lock"
    ]
  },
  "std::recursive_mutex": {
    "symbol": "std::recursive_mutex",
    "canonicalSignature": "class recursive_mutex;",
    "summary": "Mutual exclusion primitive that allows the same thread to acquire multiple levels of ownership on the mutex.",
    "header": "<mutex>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/recursive_mutex",
    "complexity": {
      "time": "O(1) in uncontended case; OS futex/kernel wait on contention"
    },
    "exceptionSafety": "Throws std::system_error if maximum ownership recursion depth is exceeded or if locking fails.",
    "example": "std::recursive_mutex mtx;\nvoid recursive_fn(int count) {\n    if (count <= 0) return;\n    std::lock_guard lock(mtx);\n    recursive_fn(count - 1);\n}",
    "seeAlso": [
      "std::mutex",
      "std::recursive_timed_mutex",
      "std::lock_guard"
    ]
  },
  "std::shared_mutex": {
    "symbol": "std::shared_mutex",
    "canonicalSignature": "class shared_mutex;",
    "summary": "Reader-writer mutual exclusion primitive supporting concurrent shared read access and exclusive write access.",
    "header": "<shared_mutex>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/shared_mutex",
    "complexity": {
      "time": "O(1) uncontended; OS futex/semaphore coordination on reader/writer contention"
    },
    "exceptionSafety": "lock() and lock_shared() throw std::system_error on failure. unlock() and unlock_shared() are noexcept.",
    "example": "std::shared_mutex rw_mtx;\nint shared_data = 0;\n\nint read_data() {\n    std::shared_lock lock(rw_mtx); // Multiple threads can read concurrently\n    return shared_data;\n}\n\nvoid write_data(int v) {\n    std::unique_lock lock(rw_mtx); // Exclusive lock for writing\n    shared_data = v;\n}",
    "seeAlso": [
      "std::shared_lock",
      "std::unique_lock",
      "std::mutex"
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
    "example": "std::mutex mtx;\n{\n    std::lock_guard lock(mtx); // C++17 Class Template Argument Deduction (CTAD)\n    // critical section\n} // Automatically unlocked here",
    "seeAlso": [
      "std::scoped_lock",
      "std::unique_lock"
    ]
  },
  "std::unique_lock": {
    "symbol": "std::unique_lock",
    "canonicalSignature": "template <typename Mutex>\nclass unique_lock;",
    "summary": "Movable RAII mutex wrapper that supports deferred locking, timed locking, explicit unlocking, and use with condition variables.",
    "header": "<mutex>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/unique_lock",
    "complexity": {
      "time": "O(1) lock, unlock, and move operations"
    },
    "exceptionSafety": "Releases mutex ownership in destructor during stack unwinding. lock() member functions throw std::system_error on error.",
    "example": "std::mutex mtx;\nstd::unique_lock lock(mtx, std::defer_lock);\n// Perform preparatory work\nlock.lock();\n// Critical section",
    "seeAlso": [
      "std::lock_guard",
      "std::scoped_lock",
      "std::condition_variable"
    ]
  },
  "std::shared_lock": {
    "symbol": "std::shared_lock",
    "canonicalSignature": "template <typename Mutex>\nclass shared_lock;",
    "summary": "General-purpose RAII shared mutex ownership wrapper for managing read-only access on SharedMutex types.",
    "header": "<shared_mutex>",
    "standard": "C++14",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/shared_lock",
    "complexity": {
      "time": "O(1) shared acquisition on construction, O(1) release on destruction"
    },
    "exceptionSafety": "Guarantees unlock_shared() is invoked during stack unwinding. lock() throws std::system_error on failure.",
    "example": "std::shared_mutex mtx;\n{\n    std::shared_lock lock(mtx); // Shared read-only lock\n    // read operations\n} // Automatically unlocked here",
    "seeAlso": [
      "std::shared_mutex",
      "std::unique_lock",
      "std::lock_guard"
    ]
  },
  "std::scoped_lock": {
    "symbol": "std::scoped_lock",
    "canonicalSignature": "template <typename... MutexTypes>\nclass scoped_lock;",
    "summary": "RAII wrapper that acquires multiple mutexes atomically using a deadlock-avoidance algorithm (similar to std::lock).",
    "header": "<mutex>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/scoped_lock",
    "complexity": {
      "time": "O(1) to O(K) deadlock avoidance"
    },
    "exceptionSafety": "Guarantees all acquired mutexes are unlocked on destruction even if an exception occurs.",
    "example": "std::mutex m1, m2;\nvoid transfer() {\n    std::scoped_lock lock(m1, m2); // Locks both without deadlock\n}",
    "seeAlso": [
      "std::lock_guard",
      "std::unique_lock"
    ]
  },
  "std::call_once": {
    "symbol": "std::call_once",
    "canonicalSignature": "template <typename Callable, typename... Args>\nvoid call_once(std::once_flag& flag, Callable&& f, Args&&... args);",
    "summary": "Executes the callable object exactly once, even if invoked concurrently from multiple threads, using the specified once_flag.",
    "header": "<mutex>",
    "standard": "C++11",
    "parameters": {
      "flag": "Synchronization object ensuring singular execution.",
      "f": "Callable function or invocable object.",
      "args": "Arguments forwarded to the callable function."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/call_once",
    "complexity": {
      "time": "O(1) active synchronization; subsequent invocations check atomic state"
    },
    "exceptionSafety": "If f throws an exception, the exception is propagated and the flag is not set, allowing subsequent attempts.",
    "example": "std::once_flag init_flag;\nvoid initialize_resources() {\n    std::call_once(init_flag, []() {\n        // one-time initialization code\n    });\n}",
    "seeAlso": [
      "std::once_flag",
      "std::mutex"
    ]
  },
  "std::once_flag": {
    "symbol": "std::once_flag",
    "canonicalSignature": "struct once_flag;",
    "summary": "Opaque synchronization object used with std::call_once to ensure that a function executes exactly once across multiple threads.",
    "header": "<mutex>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/once_flag",
    "complexity": {
      "time": "O(1) constexpr default initialization"
    },
    "exceptionSafety": "constexpr default constructor is noexcept. Non-copyable and non-movable.",
    "example": "static std::once_flag flag;\nstd::call_once(flag, []() {\n    // Setup global state\n});",
    "seeAlso": [
      "std::call_once"
    ]
  },
  "std::condition_variable": {
    "symbol": "std::condition_variable",
    "canonicalSignature": "class condition_variable;",
    "summary": "Synchronization primitive used alongside std::unique_lock<std::mutex> to block threads until notified by another thread.",
    "header": "<condition_variable>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/condition_variable",
    "complexity": {
      "time": "notify_one/all: O(1) to O(N) unblocking; wait: blocks calling thread until signaled"
    },
    "exceptionSafety": "notify_one() and notify_all() are noexcept. wait() re-locks mutex before propagating any exception thrown by predicate.",
    "example": "std::mutex mtx;\nstd::condition_variable cv;\nbool ready = false;\n\nvoid worker() {\n    std::unique_lock lock(mtx);\n    cv.wait(lock, [&] { return ready; });\n}\n\nvoid sender() {\n    {\n        std::lock_guard lock(mtx);\n        ready = true;\n    }\n    cv.notify_one();\n}",
    "seeAlso": [
      "std::condition_variable_any",
      "std::unique_lock",
      "std::mutex"
    ]
  },
  "std::condition_variable_any": {
    "symbol": "std::condition_variable_any",
    "canonicalSignature": "class condition_variable_any;",
    "summary": "Generalized condition variable that works with any BasicLockable type (e.g. std::shared_lock) and supports cooperative cancellation with std::stop_token.",
    "header": "<condition_variable>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/condition_variable_any",
    "complexity": {
      "time": "notify operations O(1) to O(N); wait operations suspend calling thread"
    },
    "exceptionSafety": "notify functions are noexcept. wait functions re-acquire lock even if an exception occurs.",
    "example": "std::shared_mutex mtx;\nstd::condition_variable_any cv;\n\nvoid wait_reader(bool& ready) {\n    std::shared_lock lock(mtx);\n    cv.wait(lock, [&] { return ready; });\n}",
    "seeAlso": [
      "std::condition_variable",
      "std::shared_lock",
      "std::stop_token"
    ]
  },
  "std::async": {
    "symbol": "std::async",
    "canonicalSignature": "template <typename Function, typename... Args>\n[[nodiscard]] std::future<std::invoke_result_t<Function, Args...>> async(Function&& f, Args&&... args);\n\ntemplate <typename Function, typename... Args>\n[[nodiscard]] std::future<std::invoke_result_t<Function, Args...>> async(std::launch policy, Function&& f, Args&&... args);",
    "summary": "Runs a callable asynchronously (in a new thread or deferred) and returns a std::future containing the result.",
    "header": "<future>",
    "standard": "C++11",
    "parameters": {
      "policy": "Launch policy bitmask: std::launch::async (new thread) or std::launch::deferred (lazy evaluation on get).",
      "f": "Callable entity to execute.",
      "args": "Arguments forwarded to the callable entity."
    },
    "returns": "std::future holding the eventual result of the callable execution.",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/async",
    "complexity": {
      "time": "Thread pool or OS thread allocation overhead for std::launch::async"
    },
    "exceptionSafety": "Throws std::system_error if thread creation fails when std::launch::async is specified.",
    "example": "auto fut = std::async(std::launch::async, [](int a, int b) {\n    return a + b;\n}, 40, 2);\nint result = fut.get(); // 42",
    "seeAlso": [
      "std::future",
      "std::promise",
      "std::packaged_task"
    ]
  },
  "std::future": {
    "symbol": "std::future",
    "canonicalSignature": "template <typename T>\nclass future;",
    "summary": "Mechanism to access the result of an asynchronous operation. Can be queried, waited on, and retrieved once via get().",
    "header": "<future>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/future",
    "complexity": {
      "time": "get() blocks until the asynchronous result is ready; O(1) value move/transfer"
    },
    "exceptionSafety": "get() rethrows any exception stored in the asynchronous shared state.",
    "example": "std::promise<int> p;\nstd::future<int> fut = p.get_future();\np.set_value(100);\nint val = fut.get(); // Consumes the result",
    "seeAlso": [
      "std::shared_future",
      "std::promise",
      "std::async"
    ]
  },
  "std::shared_future": {
    "symbol": "std::shared_future",
    "canonicalSignature": "template <typename T>\nclass shared_future;",
    "summary": "Copyable future providing shared access to an asynchronous operation's result, allowing multiple threads to query get().",
    "header": "<future>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/shared_future",
    "complexity": {
      "time": "get() blocks until the shared state is ready; multiple threads can query concurrently"
    },
    "exceptionSafety": "get() rethrows any exception stored in the shared state without invalidating the future.",
    "example": "std::future<int> f = std::async([] { return 42; });\nstd::shared_future<int> sf = f.share();\n// Multiple reader threads can invoke sf.get() concurrently",
    "seeAlso": [
      "std::future",
      "std::promise",
      "std::async"
    ]
  },
  "std::promise": {
    "symbol": "std::promise",
    "canonicalSignature": "template <typename R>\nclass promise;",
    "summary": "Stores a value or an exception to be acquired asynchronously by another thread via an associated std::future.",
    "header": "<future>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/promise",
    "complexity": {
      "time": "O(1) setting value or exception; unblocks waiting future threads"
    },
    "exceptionSafety": "Throws std::future_error if state has already been satisfied or if promise has no shared state.",
    "example": "std::promise<std::string> p;\nstd::future<std::string> fut = p.get_future();\nstd::thread t([&p]() {\n    p.set_value(\"Task completed\");\n});\nt.join();\nstd::string res = fut.get();",
    "seeAlso": [
      "std::future",
      "std::packaged_task",
      "std::async"
    ]
  },
  "std::packaged_task": {
    "symbol": "std::packaged_task",
    "canonicalSignature": "template <typename Function>\nclass packaged_task; // primary template\n\ntemplate <typename R, typename... Args>\nclass packaged_task<R(Args...)>;",
    "summary": "Wraps a callable target so that it can be invoked asynchronously, storing its return value or thrown exception in a std::future.",
    "header": "<future>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/thread/packaged_task",
    "complexity": {
      "time": "O(1) task invocation and shared state resolution"
    },
    "exceptionSafety": "operator() catches exceptions thrown by the wrapped function and stores them in the shared state.",
    "example": "std::packaged_task<int(int, int)> task([](int a, int b) { return a * b; });\nstd::future<int> result = task.get_future();\ntask(6, 7);\nint val = result.get(); // 42",
    "seeAlso": [
      "std::future",
      "std::promise",
      "std::function"
    ]
  },
  "std::atomic": {
    "symbol": "std::atomic",
    "canonicalSignature": "template <typename T>\nstruct atomic;",
    "summary": "Provides lock-free, thread-safe atomic operations on types T. Guarantees well-defined memory orderings without data races.",
    "header": "<atomic>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/atomic/atomic",
    "complexity": {
      "time": "Hardware atomic instruction (LOCK CMPXCHG on x86, LDREX/STREX on ARM); wait-free when is_lock_free() is true"
    },
    "exceptionSafety": "Operations on trivially copyable types are noexcept.",
    "example": "std::atomic<int> counter{0};\ncounter.fetch_add(1, std::memory_order_relaxed);",
    "seeAlso": [
      "std::atomic_ref",
      "std::mutex"
    ]
  },
  "std::atomic_ref": {
    "symbol": "std::atomic_ref",
    "canonicalSignature": "template <typename T>\nstruct atomic_ref;",
    "summary": "Applies thread-safe atomic operations to an already-existing non-atomic referenced object of type T.",
    "header": "<atomic>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/atomic/atomic_ref",
    "complexity": {
      "time": "Hardware atomic instruction on aligned memory; lock-free when is_lock_free() is true"
    },
    "exceptionSafety": "Operations are generally noexcept.",
    "example": "int raw_counter = 0;\nvoid increment() {\n    std::atomic_ref<int> ref(raw_counter);\n    ref.fetch_add(1, std::memory_order_relaxed);\n}",
    "seeAlso": [
      "std::atomic",
      "std::memory_order"
    ]
  },
  "std::atomic_flag": {
    "symbol": "std::atomic_flag",
    "canonicalSignature": "struct atomic_flag;",
    "summary": "Guaranteed lock-free atomic boolean flag supporting test_and_set, clear, and in C++20 wait and notify.",
    "header": "<atomic>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/atomic/atomic_flag",
    "complexity": {
      "time": "Hardware atomic test-and-set instruction (strictly lock-free)"
    },
    "exceptionSafety": "All member operations are noexcept.",
    "example": "std::atomic_flag flag = ATOMIC_FLAG_INIT;\nwhile (flag.test_and_set(std::memory_order_acquire)) {\n    // spinwait\n}\n// critical section\nflag.clear(std::memory_order_release);",
    "seeAlso": [
      "std::atomic",
      "std::memory_order"
    ]
  },
  "std::memory_order": {
    "symbol": "std::memory_order",
    "canonicalSignature": "enum class memory_order : /* unspecified */ {\n    relaxed,\n    consume,\n    acquire,\n    release,\n    acq_rel,\n    seq_cst\n};",
    "summary": "Specifies memory synchronization and ordering constraints for atomic operations (relaxed, consume, acquire, release, acq_rel, seq_cst).",
    "header": "<atomic>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/atomic/memory_order",
    "complexity": {
      "time": "Compiler barrier / CPU memory bus fence overhead based on ordering level"
    },
    "exceptionSafety": "Compile-time enumeration type, no runtime exceptions.",
    "example": "std::atomic<int> flag{0};\nflag.store(1, std::memory_order_release);\nint v = flag.load(std::memory_order_acquire);",
    "seeAlso": [
      "std::atomic",
      "std::atomic_ref",
      "std::atomic_thread_fence"
    ]
  }
};

export const concurrencyModule: StlHeaderModule = {
  id: 'concurrency',
  headers: ["<thread>", "<mutex>", "<shared_mutex>", "<condition_variable>", "<future>", "<atomic>"],
  entries: CONCURRENCY_ENTRIES
};
