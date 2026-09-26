import { StlDocEntry, StlHeaderModule } from '../types';

export const MEMORY_ENTRIES: Record<string, StlDocEntry> = {
  "std::make_unique": {
    "symbol": "std::make_unique",
    "canonicalSignature": "template <typename T, typename... Args>\nstd::unique_ptr<T> make_unique(Args&&... args);",
    "summary": "Constructs an object of type `T` on the heap and wraps it in a `std::unique_ptr` with exclusive ownership. Eliminates naked `new` and guarantees exception safety.",
    "header": "<memory>",
    "standard": "C++14",
    "parameters": {
      "args": "Arguments forwarded to the constructor of `T` via `std::forward<Args>(args)...`"
    },
    "returns": "`std::unique_ptr<T>` with sole heap ownership of the newly constructed resource.",
    "docUrl": "https://en.cppreference.com/w/cpp/memory/unique_ptr/make_unique",
    "complexity": {
      "time": "O(1)",
      "space": "O(1)"
    },
    "exceptionSafety": "Strong guarantee: if an exception is thrown during object construction, no memory is leaked.",
    "example": "auto ptr = std::make_unique<Widget>(\"nova\", 42);\nptr->do_work();\n// Resource automatically freed when ptr exits scope",
    "seeAlso": [
      "std::unique_ptr",
      "std::make_shared"
    ]
  },
  "std::make_shared": {
    "symbol": "std::make_shared",
    "canonicalSignature": "template <typename T, typename... Args>\nstd::shared_ptr<T> make_shared(Args&&... args);",
    "summary": "Allocates a single contiguous memory block holding both the control block (reference counters) and the object of type `T`. Faster and more cache-friendly than separate allocations.",
    "header": "<memory>",
    "standard": "C++11",
    "parameters": {
      "args": "Arguments forwarded to the constructor of `T` via `std::forward<Args>(args)...`"
    },
    "returns": "`std::shared_ptr<T>` owning the newly allocated instance with reference counting.",
    "docUrl": "https://en.cppreference.com/w/cpp/memory/shared_ptr/make_shared",
    "complexity": {
      "time": "O(1)",
      "space": "O(1)"
    },
    "exceptionSafety": "Strong guarantee: if an exception is thrown by constructor, all allocated memory is released.",
    "example": "auto shared = std::make_shared<Texture>(\"diffuse.png\");\nassert(shared.use_count() == 1);\nauto copy = shared; // refcount increments to 2",
    "seeAlso": [
      "std::shared_ptr",
      "std::make_unique",
      "std::weak_ptr"
    ]
  },
  "std::unique_ptr": {
    "symbol": "std::unique_ptr",
    "canonicalSignature": "template <typename T, typename Deleter = std::default_delete<T>>\nclass unique_ptr;",
    "summary": "Smart pointer that exclusively owns and manages another object through a pointer and disposes of that object when the `unique_ptr` goes out of scope.",
    "header": "<memory>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/memory/unique_ptr",
    "complexity": {
      "time": "O(1) construction, dereference, destruction",
      "space": "Zero memory overhead (same size as raw pointer if Deleter is empty)"
    },
    "exceptionSafety": "No-throw guarantee for move operations and destruction.",
    "example": "std::unique_ptr<int> p1 = std::make_unique<int>(10);\n// std::unique_ptr<int> p2 = p1; // Compile error: non-copyable\nstd::unique_ptr<int> p2 = std::move(p1); // Ownership moved, p1 is now nullptr",
    "seeAlso": [
      "std::make_unique",
      "std::shared_ptr"
    ]
  },
  "std::shared_ptr": {
    "symbol": "std::shared_ptr",
    "canonicalSignature": "template <typename T>\nclass shared_ptr;",
    "summary": "Smart pointer that retains shared ownership of an object through a pointer. Several `shared_ptr` objects may own the same object. The object is destroyed when the last remaining owner is destroyed.",
    "header": "<memory>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/memory/shared_ptr",
    "complexity": {
      "time": "O(1) construction and dereference; atomic increment/decrement for reference counts",
      "space": "2 pointers (managed object ptr + control block ptr)"
    },
    "exceptionSafety": "Strong guarantee for copy and assignment.",
    "example": "std::shared_ptr<Node> n1 = std::make_shared<Node>();\nstd::shared_ptr<Node> n2 = n1;\nstd::cout << n1.use_count(); // Prints 2",
    "seeAlso": [
      "std::make_shared",
      "std::weak_ptr",
      "std::unique_ptr"
    ]
  },
  "std::weak_ptr": {
    "symbol": "std::weak_ptr",
    "canonicalSignature": "template <typename T>\nclass weak_ptr;",
    "summary": "Non-owning observer smart pointer that holds a weak reference to an object managed by `std::shared_ptr`. Used to break circular reference cycles and detect object lifetime expiry.",
    "header": "<memory>",
    "standard": "C++11",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/memory/weak_ptr",
    "complexity": {
      "time": "O(1) lock and expired check",
      "space": "2 pointers"
    },
    "exceptionSafety": "No-throw guarantee for copy and move constructors.",
    "example": "std::weak_ptr<Widget> weak = shared;\nif (auto locked = weak.lock()) {\n    locked->render();\n} else {\n    // Object already destroyed\n}",
    "seeAlso": [
      "std::shared_ptr"
    ]
  }
};

export const memoryModule: StlHeaderModule = {
  id: 'memory',
  headers: ["<memory>"],
  entries: MEMORY_ENTRIES
};
