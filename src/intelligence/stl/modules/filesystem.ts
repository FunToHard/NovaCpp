import { StlDocEntry, StlHeaderModule } from '../types';

export const FILESYSTEM_ENTRIES: Record<string, StlDocEntry> = {
  "std::filesystem::path": {
    "symbol": "std::filesystem::path",
    "canonicalSignature": "class path;",
    "summary": "Cross-platform filesystem path object. Automatically normalizes directory separators (`/` vs `\\\\`), handles Unicode encodings, and provides path manipulation methods.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/path",
    "complexity": {
      "time": "O(N) path decomposition and string conversion"
    },
    "example": "std::filesystem::path p = \"src/main.cpp\";\nstd::println(\"Extension: {}, Filename: {}\", p.extension().string(), p.filename().string());",
    "seeAlso": [
      "std::filesystem::exists",
      "std::filesystem::copy"
    ]
  },
  "std::filesystem::exists": {
    "symbol": "std::filesystem::exists",
    "canonicalSignature": "bool exists(const std::filesystem::path& p);\nbool exists(const std::filesystem::path& p, std::error_code& ec) noexcept;",
    "summary": "Checks if the given filesystem path `p` refers to an existing file or directory.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to check for existence."
    },
    "returns": "`true` if path exists, `false` otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/exists",
    "complexity": {
      "time": "OS filesystem stat syscall"
    },
    "example": "if (std::filesystem::exists(\"CMakeLists.txt\")) {\n    std::println(\"Found CMake project!\");\n}",
    "seeAlso": [
      "std::filesystem::is_regular_file",
      "std::filesystem::is_directory"
    ]
  }
};

export const filesystemModule: StlHeaderModule = {
  id: 'filesystem',
  headers: ["<filesystem>"],
  entries: FILESYSTEM_ENTRIES
};
