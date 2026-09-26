import { StlDocEntry, StlHeaderModule } from '../types';

export const FILESYSTEM_ENTRIES: Record<string, StlDocEntry> = {
  "std::filesystem::path": {
    "symbol": "std::filesystem::path",
    "canonicalSignature": "class path;",
    "summary": "Cross-platform filesystem path object. Automatically normalizes directory separators (/ vs \\\\), handles Unicode encodings, and provides path decomposition and manipulation methods.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/path",
    "complexity": {
      "time": "O(N) path decomposition and string conversion"
    },
    "exceptionSafety": "Throws std::bad_alloc if internal string allocation fails; member navigation operations are generally noexcept.",
    "example": "std::filesystem::path p = \"src/main.cpp\";\nstd::println(\"Extension: {}, Filename: {}\", p.extension().string(), p.filename().string());",
    "seeAlso": [
      "std::filesystem::exists",
      "std::filesystem::copy"
    ]
  },
  "std::filesystem::exists": {
    "symbol": "std::filesystem::exists",
    "canonicalSignature": "bool exists(const std::filesystem::path& p);\nbool exists(const std::filesystem::path& p, std::error_code& ec) noexcept;",
    "summary": "Checks if the given filesystem path p refers to an existing file or directory.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to check for existence.",
      "ec": "Output error code parameter for non-throwing overload."
    },
    "returns": "true if path exists, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/exists",
    "complexity": {
      "time": "OS filesystem stat syscall"
    },
    "exceptionSafety": "Non-error_code overload throws std::filesystem::filesystem_error; error_code overload is noexcept.",
    "example": "if (std::filesystem::exists(\"CMakeLists.txt\")) {\n    std::println(\"Found CMake project!\");\n}",
    "seeAlso": [
      "std::filesystem::is_regular_file",
      "std::filesystem::is_directory"
    ]
  },
  "std::filesystem::copy": {
    "symbol": "std::filesystem::copy",
    "canonicalSignature": "void copy(const std::filesystem::path& from, const std::filesystem::path& to);\nvoid copy(const std::filesystem::path& from, const std::filesystem::path& to, std::filesystem::copy_options options);\nvoid copy(const std::filesystem::path& from, const std::filesystem::path& to, std::error_code& ec) noexcept;\nvoid copy(const std::filesystem::path& from, const std::filesystem::path& to, std::filesystem::copy_options options, std::error_code& ec) noexcept;",
    "summary": "Copies files or directories from one filesystem location to another with configurable copy options (recursive, overwrite, symlinks, etc.).",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "from": "Path to source file, directory, or symlink.",
      "to": "Path to target destination.",
      "options": "Bitmask of std::filesystem::copy_options controlling recursive traversal, overwrite policy, etc.",
      "ec": "Output error code parameter for non-throwing overload."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/copy",
    "complexity": {
      "time": "O(N) filesystem I/O proportional to total file size and directory depth"
    },
    "exceptionSafety": "Non-error_code overloads throw std::filesystem::filesystem_error on OS I/O failure.",
    "example": "namespace fs = std::filesystem;\nfs::copy(\"config.json\", \"backup.json\", fs::copy_options::overwrite_existing);",
    "seeAlso": [
      "std::filesystem::copy_file",
      "std::filesystem::copy_options"
    ]
  },
  "std::filesystem::copy_file": {
    "symbol": "std::filesystem::copy_file",
    "canonicalSignature": "bool copy_file(const std::filesystem::path& from, const std::filesystem::path& to);\nbool copy_file(const std::filesystem::path& from, const std::filesystem::path& to, std::filesystem::copy_options options);\nbool copy_file(const std::filesystem::path& from, const std::filesystem::path& to, std::error_code& ec) noexcept;\nbool copy_file(const std::filesystem::path& from, const std::filesystem::path& to, std::filesystem::copy_options options, std::error_code& ec) noexcept;",
    "summary": "Copies a single regular file from from to to.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "from": "Path to source file.",
      "to": "Path to target destination.",
      "options": "Bitmask of copy_options specifying overwrite behavior.",
      "ec": "Output error code for non-throwing overload."
    },
    "returns": "true if file was copied, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/copy_file",
    "complexity": {
      "time": "O(N) bytes transferred via OS sendfile/CopyFile"
    },
    "exceptionSafety": "Throws std::filesystem::filesystem_error if source does not exist or target exists without overwrite option.",
    "example": "namespace fs = std::filesystem;\nfs::copy_file(\"input.txt\", \"output.txt\", fs::copy_options::overwrite_existing);",
    "seeAlso": [
      "std::filesystem::copy",
      "std::filesystem::copy_options"
    ]
  },
  "std::filesystem::remove": {
    "symbol": "std::filesystem::remove",
    "canonicalSignature": "bool remove(const std::filesystem::path& p);\nbool remove(const std::filesystem::path& p, std::error_code& ec) noexcept;",
    "summary": "Deletes a single file or empty directory designated by path p.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to file or empty directory to delete.",
      "ec": "Output error code for non-throwing overload."
    },
    "returns": "true if the file existed and was removed, false if it did not exist.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/remove",
    "complexity": {
      "time": "OS filesystem unlink/rmdir syscall"
    },
    "exceptionSafety": "Overload without error_code throws std::filesystem::filesystem_error on OS failure.",
    "example": "if (std::filesystem::remove(\"temporary.log\")) {\n    std::println(\"File removed successfully\");\n}",
    "seeAlso": [
      "std::filesystem::remove_all",
      "std::filesystem::exists"
    ]
  },
  "std::filesystem::remove_all": {
    "symbol": "std::filesystem::remove_all",
    "canonicalSignature": "std::uintmax_t remove_all(const std::filesystem::path& p);\nstd::uintmax_t remove_all(const std::filesystem::path& p, std::error_code& ec) noexcept;",
    "summary": "Recursively deletes a file or directory and all its contents.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to file or directory hierarchy to delete recursively.",
      "ec": "Output error code for non-throwing overload."
    },
    "returns": "Number of files and directories removed.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/remove_all",
    "complexity": {
      "time": "O(N) recursive traversal and deletion of all contained filesystem entries"
    },
    "exceptionSafety": "Overload without error_code throws std::filesystem::filesystem_error on permission error or OS failure.",
    "example": "std::uintmax_t count = std::filesystem::remove_all(\"build/cache\");\nstd::println(\"Removed {} files and directories\", count);",
    "seeAlso": [
      "std::filesystem::remove",
      "std::filesystem::recursive_directory_iterator"
    ]
  },
  "std::filesystem::file_size": {
    "symbol": "std::filesystem::file_size",
    "canonicalSignature": "std::uintmax_t file_size(const std::filesystem::path& p);\nstd::uintmax_t file_size(const std::filesystem::path& p, std::error_code& ec) noexcept;",
    "summary": "Returns the size in bytes of the regular file or symlink target designated by p.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to target regular file.",
      "ec": "Output error code parameter for non-throwing overload."
    },
    "returns": "File size in bytes as std::uintmax_t; static_cast<std::uintmax_t>(-1) on error.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/file_size",
    "complexity": {
      "time": "OS stat/GetFileAttributesEx syscall"
    },
    "exceptionSafety": "Throws std::filesystem::filesystem_error if path does not exist or refers to a directory.",
    "example": "std::uintmax_t sz = std::filesystem::file_size(\"output.bin\");\nstd::println(\"File size: {} bytes\", sz);",
    "seeAlso": [
      "std::filesystem::is_regular_file",
      "std::filesystem::space"
    ]
  },
  "std::filesystem::last_write_time": {
    "symbol": "std::filesystem::last_write_time",
    "canonicalSignature": "std::filesystem::file_time_type last_write_time(const std::filesystem::path& p);\nstd::filesystem::file_time_type last_write_time(const std::filesystem::path& p, std::error_code& ec) noexcept;\nvoid last_write_time(const std::filesystem::path& p, std::filesystem::file_time_type new_time);\nvoid last_write_time(const std::filesystem::path& p, std::filesystem::file_time_type new_time, std::error_code& ec) noexcept;",
    "summary": "Gets or sets the last modification timestamp of the file or directory designated by path p.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Target filesystem path.",
      "new_time": "New modification timestamp to apply.",
      "ec": "Output error code parameter for non-throwing overload."
    },
    "returns": "std::filesystem::file_time_type representing the last modification time (getter) or void (setter).",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/last_write_time",
    "complexity": {
      "time": "OS filesystem stat or touch syscall"
    },
    "exceptionSafety": "Throws std::filesystem::filesystem_error on non-error_code overloads if path is inaccessible.",
    "example": "auto ftime = std::filesystem::last_write_time(\"main.cpp\");\n// Can be converted to sys_time or logged",
    "seeAlso": [
      "std::chrono::file_clock",
      "std::filesystem::is_regular_file"
    ]
  },
  "std::filesystem::permissions": {
    "symbol": "std::filesystem::permissions",
    "canonicalSignature": "void permissions(const std::filesystem::path& p, std::filesystem::perms prms, std::filesystem::perm_options opts = std::filesystem::perm_options::replace);\nvoid permissions(const std::filesystem::path& p, std::filesystem::perms prms, std::error_code& ec) noexcept;\nvoid permissions(const std::filesystem::path& p, std::filesystem::perms prms, std::filesystem::perm_options opts, std::error_code& ec) noexcept;",
    "summary": "Modifies or replaces the POSIX/ACL permissions of the file or directory designated by p.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to target file or directory.",
      "prms": "Permissions bitmask (std::filesystem::perms).",
      "opts": "Operation mode: replace, add, or remove permissions.",
      "ec": "Output error code parameter."
    },
    "returns": "void",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/permissions",
    "complexity": {
      "time": "OS chmod/SetNamedSecurityInfo syscall"
    },
    "exceptionSafety": "Throws std::filesystem::filesystem_error if permissions cannot be altered.",
    "example": "namespace fs = std::filesystem;\nfs::permissions(\"run.sh\", fs::perms::owner_exec, fs::perm_options::add);",
    "seeAlso": [
      "std::filesystem::status",
      "std::filesystem::perms"
    ]
  },
  "std::filesystem::space": {
    "symbol": "std::filesystem::space",
    "canonicalSignature": "std::filesystem::space_info space(const std::filesystem::path& p);\nstd::filesystem::space_info space(const std::filesystem::path& p, std::error_code& ec) noexcept;",
    "summary": "Queries filesystem volume information (capacity, free space, and available space for non-privileged processes) for the drive containing p.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to any file or directory on the target filesystem volume.",
      "ec": "Output error code parameter."
    },
    "returns": "std::filesystem::space_info structure containing capacity, free, and available bytes.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/space",
    "complexity": {
      "time": "OS statvfs/GetDiskFreeSpaceEx syscall"
    },
    "exceptionSafety": "Throws std::filesystem::filesystem_error on non-error_code overload if filesystem is not accessible.",
    "example": "auto s = std::filesystem::space(\".\");\nstd::println(\"Available disk space: {} MB\", s.available / (1024 * 1024));",
    "seeAlso": [
      "std::filesystem::file_size",
      "std::filesystem::space_info"
    ]
  },
  "std::filesystem::is_directory": {
    "symbol": "std::filesystem::is_directory",
    "canonicalSignature": "bool is_directory(const std::filesystem::path& p);\nbool is_directory(const std::filesystem::path& p, std::error_code& ec) noexcept;\nbool is_directory(std::filesystem::file_status s) noexcept;",
    "summary": "Checks if the path p (or file_status s) resolves to an existing directory.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to inspect.",
      "s": "Pre-obtained file_status object.",
      "ec": "Output error code for non-throwing overload."
    },
    "returns": "true if path or status refers to a directory, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/is_directory",
    "complexity": {
      "time": "OS stat syscall"
    },
    "exceptionSafety": "Overload accepting path without error_code throws std::filesystem::filesystem_error on failure.",
    "example": "if (std::filesystem::is_directory(\"include\")) {\n    std::println(\"Found include directory\");\n}",
    "seeAlso": [
      "std::filesystem::is_regular_file",
      "std::filesystem::status"
    ]
  },
  "std::filesystem::is_regular_file": {
    "symbol": "std::filesystem::is_regular_file",
    "canonicalSignature": "bool is_regular_file(const std::filesystem::path& p);\nbool is_regular_file(const std::filesystem::path& p, std::error_code& ec) noexcept;\nbool is_regular_file(std::filesystem::file_status s) noexcept;",
    "summary": "Checks if the path p (or file_status s) resolves to a regular file.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {
      "p": "Path to inspect.",
      "s": "Pre-obtained file_status object.",
      "ec": "Output error code for non-throwing overload."
    },
    "returns": "true if target is a regular file, false otherwise.",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/is_regular_file",
    "complexity": {
      "time": "OS stat syscall"
    },
    "exceptionSafety": "Overload accepting path without error_code throws std::filesystem::filesystem_error on failure.",
    "example": "if (std::filesystem::is_regular_file(\"build.ninja\")) {\n    std::println(\"Ninja build manifest found\");\n}",
    "seeAlso": [
      "std::filesystem::is_directory",
      "std::filesystem::file_size"
    ]
  },
  "std::filesystem::recursive_directory_iterator": {
    "symbol": "std::filesystem::recursive_directory_iterator",
    "canonicalSignature": "class recursive_directory_iterator;",
    "summary": "InputIterator that iterates over the directory_entry elements of a directory and recursively descends into subdirectories.",
    "header": "<filesystem>",
    "standard": "C++17",
    "parameters": {},
    "returns": "",
    "docUrl": "https://en.cppreference.com/w/cpp/filesystem/recursive_directory_iterator",
    "complexity": {
      "time": "O(N) filesystem read operations over all entries in the directory subtree"
    },
    "exceptionSafety": "Constructor and increment throw std::filesystem::filesystem_error unless error_code overload is used.",
    "example": "namespace fs = std::filesystem;\nfor (const fs::directory_entry& entry : fs::recursive_directory_iterator(\"src\")) {\n    if (entry.is_regular_file() && entry.path().extension() == \".cpp\") {\n        std::println(\"C++ Source: {}\", entry.path().string());\n    }\n}",
    "seeAlso": [
      "std::filesystem::directory_iterator",
      "std::filesystem::directory_entry"
    ]
  }
};

export const filesystemModule: StlHeaderModule = {
  id: 'filesystem',
  headers: ["<filesystem>"],
  entries: FILESYSTEM_ENTRIES
};
