import { StlDocEntry, StlHeaderModule } from '../types';

export const COROUTINES_ENTRIES: Record<string, StlDocEntry> = {
  "std::coroutine_handle": {
    "symbol": "std::coroutine_handle",
    "canonicalSignature": "template <typename Promise = void>\nstruct coroutine_handle;\n\ntemplate <>\nstruct coroutine_handle<void>;",
    "summary": "Non-owning handle used to control a coroutine's execution, resume or destroy the coroutine frame, and access its promise object.",
    "header": "<coroutine>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/coroutine/coroutine_handle",
    "complexity": {
      "time": "O(1) resume/destroy context switch, frame pointer access"
    },
    "exceptionSafety": "resume() and destroy() require valid, non-done handle; resume() propagates unhandled exceptions from coroutine body.",
    "example": "#include <coroutine>\n\nstruct SimpleTask {\n    struct promise_type {\n        SimpleTask get_return_object() {\n            return SimpleTask{std::coroutine_handle<promise_type>::from_promise(*this)};\n        }\n        std::suspend_always initial_suspend() noexcept { return {}; }\n        std::suspend_always final_suspend() noexcept { return {}; }\n        void return_void() noexcept {}\n        void unhandled_exception() {}\n    };\n    std::coroutine_handle<promise_type> handle;\n};",
    "seeAlso": [
      "std::suspend_always",
      "std::suspend_never",
      "std::noop_coroutine"
    ]
  },
  "std::suspend_always": {
    "symbol": "std::suspend_always",
    "canonicalSignature": "struct suspend_always {\n    constexpr bool await_ready() const noexcept { return false; }\n    constexpr void await_suspend(std::coroutine_handle<>) const noexcept {}\n    constexpr void await_resume() const noexcept {}\n};",
    "summary": "Trivial awaitable type whose await_ready always returns false, causing the awaiting coroutine to unconditionally suspend.",
    "header": "<coroutine>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/coroutine/suspend_always",
    "complexity": {
      "time": "O(1) zero-cost compiler intrinsic suspension point"
    },
    "exceptionSafety": "All member functions are constexpr noexcept.",
    "example": "std::suspend_always initial_suspend() noexcept {\n    return {}; // Suspends immediately upon invocation\n}",
    "seeAlso": [
      "std::suspend_never",
      "std::coroutine_handle"
    ]
  },
  "std::suspend_never": {
    "symbol": "std::suspend_never",
    "canonicalSignature": "struct suspend_never {\n    constexpr bool await_ready() const noexcept { return true; }\n    constexpr void await_suspend(std::coroutine_handle<>) const noexcept {}\n    constexpr void await_resume() const noexcept {}\n};",
    "summary": "Trivial awaitable type whose await_ready always returns true, causing the awaiting coroutine to never suspend and continue execution immediately.",
    "header": "<coroutine>",
    "standard": "C++20",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/coroutine/suspend_never",
    "complexity": {
      "time": "O(1) zero-cost no-op suspension point"
    },
    "exceptionSafety": "All member functions are constexpr noexcept.",
    "example": "std::suspend_never initial_suspend() noexcept {\n    return {}; // Executes coroutine body eagerly without suspending\n}",
    "seeAlso": [
      "std::suspend_always",
      "std::coroutine_handle"
    ]
  },
  "std::noop_coroutine": {
    "symbol": "std::noop_coroutine",
    "canonicalSignature": "std::noop_coroutine_handle noop_coroutine() noexcept;",
    "summary": "Returns a coroutine_handle to a no-op coroutine that does nothing when resumed or destroyed, useful for symmetric transfer in await_suspend.",
    "header": "<coroutine>",
    "standard": "C++20",
    "parameters": {},
    "returns": "std::noop_coroutine_handle pointing to a static stateless coroutine.",
    "docUrl": "https://en.cppreference.com/w/cpp/coroutine/noop_coroutine",
    "complexity": {
      "time": "O(1) returns pointer to pre-allocated immortal frame"
    },
    "exceptionSafety": "noexcept",
    "example": "std::coroutine_handle<> await_suspend(std::coroutine_handle<> h) noexcept {\n    if (should_yield()) return h;\n    return std::noop_coroutine(); // Symmetric transfer with no operation\n}",
    "seeAlso": [
      "std::coroutine_handle",
      "std::suspend_always"
    ]
  }
};

export const coroutinesModule: StlHeaderModule = {
  id: 'coroutines',
  headers: ["<coroutine>"],
  entries: COROUTINES_ENTRIES
};
