import * as vscode from 'vscode';

export interface TypedefInfo {
  name: string;
  underlyingType: string;
  category: 'cstdint' | 'cstddef' | 'std' | 'win32' | 'posix' | 'user';
  categoryLabel: string;
  header: string;
  standard?: string;
  summary: string;
  bitWidth?: number;
  byteSize?: string;
  valueRange?: string;
  formatSpecifier?: string;
  invalidValue?: string;
  docUrl?: string;
  notes?: string;
}

/**
 * Curated knowledge base of standard C/C++, Windows SDK, and POSIX typedefs and type aliases.
 */
export const TYPEDEF_KNOWLEDGE_BASE: Record<string, TypedefInfo> = {
  // --- Fixed-Width Integers (<cstdint> / <stdint.h>) ---
  uint8_t: {
    name: 'uint8_t',
    underlyingType: 'unsigned char',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '8-bit unsigned integer with exact width, containing no padding bits.',
    bitWidth: 8,
    byteSize: '1 byte',
    valueRange: '0 to 255 (2^8 - 1)',
    formatSpecifier: 'PRIu8 (%u)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  uint16_t: {
    name: 'uint16_t',
    underlyingType: 'unsigned short',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '16-bit unsigned integer with exact width, containing no padding bits.',
    bitWidth: 16,
    byteSize: '2 bytes',
    valueRange: '0 to 65,535 (2^16 - 1)',
    formatSpecifier: 'PRIu16 (%u)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  uint32_t: {
    name: 'uint32_t',
    underlyingType: 'unsigned int',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '32-bit unsigned integer with exact width, containing no padding bits.',
    bitWidth: 32,
    byteSize: '4 bytes',
    valueRange: '0 to 4,294,967,295 (2^32 - 1)',
    formatSpecifier: 'PRIu32 (%u)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  uint64_t: {
    name: 'uint64_t',
    underlyingType: 'unsigned long long',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '64-bit unsigned integer with exact width, containing no padding bits.',
    bitWidth: 64,
    byteSize: '8 bytes',
    valueRange: '0 to 18,446,744,073,709,551,615 (2^64 - 1)',
    formatSpecifier: 'PRIu64 (%llu)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  int8_t: {
    name: 'int8_t',
    underlyingType: 'signed char',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Signed Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '8-bit signed two\'s complement integer with exact width.',
    bitWidth: 8,
    byteSize: '1 byte',
    valueRange: '-128 to 127',
    formatSpecifier: 'PRId8 (%d)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  int16_t: {
    name: 'int16_t',
    underlyingType: 'short',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Signed Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '16-bit signed two\'s complement integer with exact width.',
    bitWidth: 16,
    byteSize: '2 bytes',
    valueRange: '-32,768 to 32,767',
    formatSpecifier: 'PRId16 (%d)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  int32_t: {
    name: 'int32_t',
    underlyingType: 'int',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Signed Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '32-bit signed two\'s complement integer with exact width.',
    bitWidth: 32,
    byteSize: '4 bytes',
    valueRange: '-2,147,483,648 to 2,147,483,647',
    formatSpecifier: 'PRId32 (%d)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  int64_t: {
    name: 'int64_t',
    underlyingType: 'long long',
    category: 'cstdint',
    categoryLabel: 'Fixed-Width Signed Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: '64-bit signed two\'s complement integer with exact width.',
    bitWidth: 64,
    byteSize: '8 bytes',
    valueRange: '-9,223,372,036,854,775,808 to 9,223,372,036,854,775,807',
    formatSpecifier: 'PRId64 (%lld)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  uintptr_t: {
    name: 'uintptr_t',
    underlyingType: 'unsigned int / unsigned long long',
    category: 'cstdint',
    categoryLabel: 'Pointer-Sized Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: 'Unsigned integer type guaranteed to hold any object pointer value without truncation or loss of precision.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    formatSpecifier: 'PRIuPTR (%p)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  intptr_t: {
    name: 'intptr_t',
    underlyingType: 'int / long long',
    category: 'cstdint',
    categoryLabel: 'Pointer-Sized Signed Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: 'Signed integer type guaranteed to hold any object pointer value without truncation.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    formatSpecifier: 'PRIdPTR',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  uintmax_t: {
    name: 'uintmax_t',
    underlyingType: 'unsigned long long',
    category: 'cstdint',
    categoryLabel: 'Maximum-Width Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: 'Maximum-width unsigned integer type supported by the compiler implementation.',
    bitWidth: 64,
    byteSize: '8 bytes',
    formatSpecifier: 'PRIuMAX',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },
  intmax_t: {
    name: 'intmax_t',
    underlyingType: 'long long',
    category: 'cstdint',
    categoryLabel: 'Maximum-Width Signed Integer',
    header: '<cstdint>',
    standard: 'C++11 / C99',
    summary: 'Maximum-width signed integer type supported by the compiler implementation.',
    bitWidth: 64,
    byteSize: '8 bytes',
    formatSpecifier: 'PRIdMAX',
    docUrl: 'https://en.cppreference.com/w/cpp/types/integer'
  },

  // --- Standard Types & Memory (<cstddef>, <ctime>, <cwchar>, <ios>) ---
  size_t: {
    name: 'size_t',
    underlyingType: 'unsigned int / unsigned long long',
    category: 'cstddef',
    categoryLabel: 'Object Size Type',
    header: '<cstddef>',
    standard: 'C++98 / C89',
    summary: 'Unsigned integer type representing the byte size of any object in memory. Returned by the sizeof, alignof, and offsetof operators.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    formatSpecifier: '%zu',
    docUrl: 'https://en.cppreference.com/w/cpp/types/size_t'
  },
  ptrdiff_t: {
    name: 'ptrdiff_t',
    underlyingType: 'int / long long',
    category: 'cstddef',
    categoryLabel: 'Pointer Difference Type',
    header: '<cstddef>',
    standard: 'C++98 / C89',
    summary: 'Signed integer type resulting from subtracting one pointer from another (ptr1 - ptr2) within the same array.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    formatSpecifier: '%td',
    docUrl: 'https://en.cppreference.com/w/cpp/types/ptrdiff_t'
  },
  nullptr_t: {
    name: 'nullptr_t',
    underlyingType: 'decltype(nullptr)',
    category: 'cstddef',
    categoryLabel: 'Null Pointer Literal Type',
    header: '<cstddef>',
    standard: 'C++11',
    summary: 'The type of the null pointer literal nullptr. Explicitly convertible to any raw pointer or pointer-to-member type.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    docUrl: 'https://en.cppreference.com/w/cpp/types/nullptr_t'
  },
  time_t: {
    name: 'time_t',
    underlyingType: 'long long / __time64_t',
    category: 'std',
    categoryLabel: 'Calendar Time Type',
    header: '<ctime>',
    standard: 'C++98 / C89',
    summary: 'Real calendar time represented as seconds elapsed since the Unix epoch (1970-01-01 00:00:00 UTC).',
    byteSize: '8 bytes (modern 64-bit timestamp)',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/c/time_t'
  },
  clock_t: {
    name: 'clock_t',
    underlyingType: 'long',
    category: 'std',
    categoryLabel: 'Processor Time Type',
    header: '<ctime>',
    standard: 'C++98 / C89',
    summary: 'Processor clock tick counter consumed by the current process. Divided by CLOCKS_PER_SEC to determine execution duration in seconds.',
    docUrl: 'https://en.cppreference.com/w/cpp/chrono/c/clock_t'
  },
  wint_t: {
    name: 'wint_t',
    underlyingType: 'unsigned short / int',
    category: 'std',
    categoryLabel: 'Wide Character Integer Type',
    header: '<cwchar>',
    standard: 'C++98 / C95',
    summary: 'Integer type capable of representing any valid wchar_t character code point as well as the special WEOF constant.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/wide'
  },
  streampos: {
    name: 'streampos',
    underlyingType: 'std::fpos<std::mbstate_t>',
    category: 'std',
    categoryLabel: 'Stream Position Type',
    header: '<ios>',
    standard: 'C++98',
    summary: 'Type representation for seek and tell operations on character streams (std::istream, std::ostream, std::fstream).',
    docUrl: 'https://en.cppreference.com/w/cpp/io/fpos'
  },
  streamoff: {
    name: 'streamoff',
    underlyingType: 'long long',
    category: 'std',
    categoryLabel: 'Stream Offset Type',
    header: '<ios>',
    standard: 'C++98',
    summary: 'Signed integer type used to represent relative character offsets within I/O streams.',
    docUrl: 'https://en.cppreference.com/w/cpp/io/streamoff'
  },

  // --- Windows SDK Handles (<windows.h>, <windef.h>, <winnt.h>) ---
  HWND: {
    name: 'HWND',
    underlyingType: 'struct HWND__*',
    category: 'win32',
    categoryLabel: 'Win32 Window Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a window or GUI control in the Win32 window manager. Identifies an open top-level window, child window, dialog box, or button control. Passed to functions like CreateWindowEx, ShowWindow, SendMessage, and window procedures (WndProc).',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL / nullptr',
    notes: 'Opaque pointer handle. Validated by the operating system kernel before performing window manager operations.'
  },
  HANDLE: {
    name: 'HANDLE',
    underlyingType: 'void*',
    category: 'win32',
    categoryLabel: 'Win32 Kernel Object Handle',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: 'Generic handle to an operating system kernel object, such as a process, execution thread, event, mutex, pipe, access token, or disk file. Must be released with CloseHandle when no longer required.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'INVALID_HANDLE_VALUE ((HANDLE)(LONG_PTR)-1) or NULL',
    notes: 'Handles index the per-process kernel handle table maintained by Windows executive.'
  },
  HMODULE: {
    name: 'HMODULE',
    underlyingType: 'HINSTANCE (void*)',
    category: 'win32',
    categoryLabel: 'Win32 Module Handle',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a loaded executable module (.exe) or dynamic-link library (.dll) mapped into the process virtual address space. Represents the base virtual memory address of the image.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL',
    notes: 'Returned by LoadLibrary, LoadLibraryEx, and GetModuleHandle.'
  },
  HINSTANCE: {
    name: 'HINSTANCE',
    underlyingType: 'void*',
    category: 'win32',
    categoryLabel: 'Win32 Instance Handle',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: 'Handle to an instance of an application module or DLL. In 32-bit and 64-bit Windows, HINSTANCE and HMODULE are completely identical and interchangeable.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HDC: {
    name: 'HDC',
    underlyingType: 'struct HDC__*',
    category: 'win32',
    categoryLabel: 'GDI Device Context Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a Device Context (GDI drawing context). Represents drawing state, fonts, brushes, clipping regions, and color palettes for painting onto windows, memory bitmaps, or printers.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL',
    notes: 'Obtained via GetDC, BeginPaint, or CreateCompatibleDC. Must be released with ReleaseDC or EndPaint.'
  },
  HBITMAP: {
    name: 'HBITMAP',
    underlyingType: 'struct HBITMAP__*',
    category: 'win32',
    categoryLabel: 'GDI Bitmap Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a GDI raster graphic bitmap resource. Created via CreateCompatibleBitmap, CreateDIBSection, or LoadImage. Must be deleted with DeleteObject.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HICON: {
    name: 'HICON',
    underlyingType: 'struct HICON__*',
    category: 'win32',
    categoryLabel: 'Win32 Icon Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a Win32 icon resource. Created with CreateIcon, LoadIcon, or LoadImage. Must be destroyed with DestroyIcon when finished.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HCURSOR: {
    name: 'HCURSOR',
    underlyingType: 'HICON (struct HICON__*)',
    category: 'win32',
    categoryLabel: 'Win32 Cursor Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a Win32 mouse cursor resource. Used with SetCursor to modify the cursor shape on screen.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HBRUSH: {
    name: 'HBRUSH',
    underlyingType: 'struct HBRUSH__*',
    category: 'win32',
    categoryLabel: 'GDI Brush Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a GDI brush resource used for filling shapes, polygons, and window client backgrounds. Created with CreateSolidBrush or GetSysColorBrush.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HFONT: {
    name: 'HFONT',
    underlyingType: 'struct HFONT__*',
    category: 'win32',
    categoryLabel: 'GDI Font Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a GDI logical font resource used for text rendering. Created with CreateFont or CreateFontIndirect. Must be deleted with DeleteObject.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HMENU: {
    name: 'HMENU',
    underlyingType: 'struct HMENU__*',
    category: 'win32',
    categoryLabel: 'Win32 Menu Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a Win32 top-level window menu bar or popup context menu. Created with CreateMenu or CreatePopupMenu. Destroyed with DestroyMenu.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HPEN: {
    name: 'HPEN',
    underlyingType: 'struct HPEN__*',
    category: 'win32',
    categoryLabel: 'GDI Pen Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a GDI pen resource used for drawing lines, curves, and shape borders. Created with CreatePen or ExtCreatePen. Deleted with DeleteObject.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HRGN: {
    name: 'HRGN',
    underlyingType: 'struct HRGN__*',
    category: 'win32',
    categoryLabel: 'GDI Region Handle',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Handle to a GDI geometric region used for clipping boundaries and hit-testing.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },
  HKEY: {
    name: 'HKEY',
    underlyingType: 'struct HKEY__*',
    category: 'win32',
    categoryLabel: 'Windows Registry Key Handle',
    header: '<windows.h> / <winreg.h>',
    standard: 'Win32 API',
    summary: 'Handle to an open Windows Registry key. Predefined keys include HKEY_CURRENT_USER and HKEY_LOCAL_MACHINE. Custom opened keys must be closed with RegCloseKey.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)',
    invalidValue: 'NULL'
  },

  // --- Windows SDK Primitive Types & Message Parameters ---
  DWORD: {
    name: 'DWORD',
    underlyingType: 'unsigned long',
    category: 'win32',
    categoryLabel: 'Win32 Primitive Type',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: '32-bit unsigned integer (Double Word). Found ubiquitously across the Win32 API for flags, buffer sizes, error codes, and thread identifiers.',
    bitWidth: 32,
    byteSize: '4 bytes',
    valueRange: '0 to 4,294,967,295 (2^32 - 1)',
    formatSpecifier: '%lu'
  },
  WORD: {
    name: 'WORD',
    underlyingType: 'unsigned short',
    category: 'win32',
    categoryLabel: 'Win32 Primitive Type',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: '16-bit unsigned integer (Word). Used for port numbers, virtual key codes, and low/high word extractions (LOWORD, HIWORD).',
    bitWidth: 16,
    byteSize: '2 bytes',
    valueRange: '0 to 65,535 (2^16 - 1)'
  },
  BYTE: {
    name: 'BYTE',
    underlyingType: 'unsigned char',
    category: 'win32',
    categoryLabel: 'Win32 Primitive Type',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: '8-bit unsigned integer (Byte). Used for raw byte buffers, binary serialization, and color channels.',
    bitWidth: 8,
    byteSize: '1 byte',
    valueRange: '0 to 255'
  },
  BOOL: {
    name: 'BOOL',
    underlyingType: 'int',
    category: 'win32',
    categoryLabel: 'Win32 Boolean Type',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: 'Win32 boolean integer type. 0 represents FALSE, and non-zero (typically 1) represents TRUE. Unlike C++ bool, sizeof(BOOL) is 4 bytes.',
    byteSize: '4 bytes',
    valueRange: '0 (FALSE) or 1 (TRUE)',
    notes: 'Do not test directly against TRUE with ==, as any non-zero value is valid truth.'
  },
  BOOLEAN: {
    name: 'BOOLEAN',
    underlyingType: 'BYTE (unsigned char)',
    category: 'win32',
    categoryLabel: 'Win32 Byte Boolean Type',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: 'Byte-sized boolean type used primarily by the Windows NT kernel subsystem. sizeof(BOOLEAN) is 1 byte.',
    bitWidth: 8,
    byteSize: '1 byte'
  },
  LRESULT: {
    name: 'LRESULT',
    underlyingType: 'LONG_PTR (long / long long)',
    category: 'win32',
    categoryLabel: 'Win32 Message Return Value',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Signed integer returned by a window procedure (WndProc) or SendMessage call to indicate message processing result.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  WPARAM: {
    name: 'WPARAM',
    underlyingType: 'UINT_PTR (unsigned int / unsigned long long)',
    category: 'win32',
    categoryLabel: 'Win32 Message Word Parameter',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Pointer-sized message parameter integer used with Win32 window messages. Historically 16-bit word, now pointer-sized for architecture independence.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LPARAM: {
    name: 'LPARAM',
    underlyingType: 'LONG_PTR (long / long long)',
    category: 'win32',
    categoryLabel: 'Win32 Message Long Parameter',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: 'Pointer-sized message parameter integer used with Win32 window messages. Frequently casts to pointers, coordinate pairs, or packed structs.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  HRESULT: {
    name: 'HRESULT',
    underlyingType: 'long',
    category: 'win32',
    categoryLabel: 'COM / Win32 Status Code',
    header: '<windows.h> / <winerror.h>',
    standard: 'Win32 API',
    summary: '32-bit signed integer status return code used in COM and Windows APIs. Negative values indicate failure (checked with FAILED(hr)), non-negative indicates success (SUCCEEDED(hr)).',
    bitWidth: 32,
    byteSize: '4 bytes',
    valueRange: 'S_OK (0x00000000), E_FAIL (0x80004005), E_INVALIDARG (0x80070057), etc.',
    notes: 'Encoded with Severity bit, Facility code, and Status code.'
  },
  ULONG: {
    name: 'ULONG',
    underlyingType: 'unsigned long',
    category: 'win32',
    categoryLabel: 'Win32 Primitive Type',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: '32-bit unsigned long integer in Windows data models (LLP64).',
    bitWidth: 32,
    byteSize: '4 bytes'
  },
  LONG: {
    name: 'LONG',
    underlyingType: 'long',
    category: 'win32',
    categoryLabel: 'Win32 Primitive Type',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: '32-bit signed long integer in Windows data models (LLP64).',
    bitWidth: 32,
    byteSize: '4 bytes'
  },
  LONGLONG: {
    name: 'LONGLONG',
    underlyingType: '__int64 (long long)',
    category: 'win32',
    categoryLabel: 'Win32 64-Bit Integer',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: '64-bit signed integer.',
    bitWidth: 64,
    byteSize: '8 bytes'
  },
  ULONGLONG: {
    name: 'ULONGLONG',
    underlyingType: 'unsigned __int64 (unsigned long long)',
    category: 'win32',
    categoryLabel: 'Win32 64-Bit Unsigned Integer',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: '64-bit unsigned integer.',
    bitWidth: 64,
    byteSize: '8 bytes'
  },
  ULONG_PTR: {
    name: 'ULONG_PTR',
    underlyingType: 'unsigned int / unsigned long long',
    category: 'win32',
    categoryLabel: 'Win32 Pointer-Sized Unsigned Integer',
    header: '<windows.h> / <basetsd.h>',
    standard: 'Win32 API',
    summary: 'Unsigned integer capable of holding a pointer without loss of precision. 32-bit on x86, 64-bit on x64.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LONG_PTR: {
    name: 'LONG_PTR',
    underlyingType: 'int / long long',
    category: 'win32',
    categoryLabel: 'Win32 Pointer-Sized Signed Integer',
    header: '<windows.h> / <basetsd.h>',
    standard: 'Win32 API',
    summary: 'Signed integer capable of holding a pointer without loss of precision. 32-bit on x86, 64-bit on x64.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  UINT_PTR: {
    name: 'UINT_PTR',
    underlyingType: 'unsigned int / unsigned long long',
    category: 'win32',
    categoryLabel: 'Win32 Pointer-Sized Unsigned Integer',
    header: '<windows.h> / <basetsd.h>',
    standard: 'Win32 API',
    summary: 'Unsigned integer capable of holding a memory pointer without truncation.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  INT_PTR: {
    name: 'INT_PTR',
    underlyingType: 'int / long long',
    category: 'win32',
    categoryLabel: 'Win32 Pointer-Sized Signed Integer',
    header: '<windows.h> / <basetsd.h>',
    standard: 'Win32 API',
    summary: 'Signed integer capable of holding a memory pointer without truncation.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  DWORD_PTR: {
    name: 'DWORD_PTR',
    underlyingType: 'ULONG_PTR',
    category: 'win32',
    categoryLabel: 'Win32 Pointer-Sized Unsigned Integer',
    header: '<windows.h> / <basetsd.h>',
    standard: 'Win32 API',
    summary: 'Pointer-sized unsigned integer used for casting between DWORD and pointer values.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LPSTR: {
    name: 'LPSTR',
    underlyingType: 'char*',
    category: 'win32',
    categoryLabel: 'Win32 String Pointer',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: 'Pointer to a null-terminated 8-bit ANSI / ASCII character string.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LPCSTR: {
    name: 'LPCSTR',
    underlyingType: 'const char*',
    category: 'win32',
    categoryLabel: 'Win32 Const String Pointer',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: 'Pointer to a constant null-terminated 8-bit ANSI / ASCII character string.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LPWSTR: {
    name: 'LPWSTR',
    underlyingType: 'wchar_t*',
    category: 'win32',
    categoryLabel: 'Win32 Wide String Pointer',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: 'Pointer to a null-terminated UTF-16 wide character string (16-bit code units).',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LPCWSTR: {
    name: 'LPCWSTR',
    underlyingType: 'const wchar_t*',
    category: 'win32',
    categoryLabel: 'Win32 Const Wide String Pointer',
    header: '<windows.h> / <winnt.h>',
    standard: 'Win32 API',
    summary: 'Pointer to a constant null-terminated UTF-16 wide character string (16-bit code units).',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LPTSTR: {
    name: 'LPTSTR',
    underlyingType: 'LPWSTR (Unicode) / LPSTR (ANSI)',
    category: 'win32',
    categoryLabel: 'Win32 Generic String Pointer',
    header: '<windows.h> / <tchar.h>',
    standard: 'Win32 API',
    summary: 'Pointer to a null-terminated character string. Resolves to LPWSTR when UNICODE is defined, or LPSTR in legacy ANSI builds.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  LPCTSTR: {
    name: 'LPCTSTR',
    underlyingType: 'LPCWSTR (Unicode) / LPCSTR (ANSI)',
    category: 'win32',
    categoryLabel: 'Win32 Const Generic String Pointer',
    header: '<windows.h> / <tchar.h>',
    standard: 'Win32 API',
    summary: 'Pointer to a constant null-terminated character string. Resolves to LPCWSTR when UNICODE is defined, or LPCSTR in legacy ANSI builds.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  COLORREF: {
    name: 'COLORREF',
    underlyingType: 'DWORD (unsigned long)',
    category: 'win32',
    categoryLabel: 'Win32 RGB Color Value',
    header: '<windows.h> / <windef.h>',
    standard: 'Win32 API',
    summary: '32-bit RGB color representation formatted as 0x00bbggrr. Created using the RGB(r, g, b) macro and decomposed via GetRValue, GetGValue, and GetBValue.',
    bitWidth: 32,
    byteSize: '4 bytes'
  },
  ATOM: {
    name: 'ATOM',
    underlyingType: 'WORD (unsigned short)',
    category: 'win32',
    categoryLabel: 'Win32 Atom Table Identifier',
    header: '<windows.h> / <minwindef.h>',
    standard: 'Win32 API',
    summary: '16-bit integer identifying a string stored in the local or global Windows atom table. Returned by RegisterClassEx and GlobalAddAtom.',
    bitWidth: 16,
    byteSize: '2 bytes'
  },
  SIZE_T: {
    name: 'SIZE_T',
    underlyingType: 'ULONG_PTR',
    category: 'win32',
    categoryLabel: 'Win32 Memory Size Type',
    header: '<windows.h> / <basetsd.h>',
    standard: 'Win32 API',
    summary: 'Pointer-sized unsigned integer representing maximum memory allocation sizes in the Win32 subsystem.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },
  SSIZE_T: {
    name: 'SSIZE_T',
    underlyingType: 'LONG_PTR',
    category: 'win32',
    categoryLabel: 'Win32 Signed Memory Size Type',
    header: '<windows.h> / <basetsd.h>',
    standard: 'Win32 API',
    summary: 'Pointer-sized signed integer representing memory allocation sizes or byte counts.',
    byteSize: '4 bytes (x86) / 8 bytes (x64)'
  },

  // --- POSIX System Typedefs (<sys/types.h>, <unistd.h>) ---
  pid_t: {
    name: 'pid_t',
    underlyingType: 'int',
    category: 'posix',
    categoryLabel: 'POSIX Process ID',
    header: '<sys/types.h>',
    standard: 'POSIX.1-2001',
    summary: 'Signed integer type used to represent process identifiers (PIDs) and process group IDs. Returned by fork(), getpid(), and getppid().',
    bitWidth: 32,
    byteSize: '4 bytes'
  },
  uid_t: {
    name: 'uid_t',
    underlyingType: 'unsigned int',
    category: 'posix',
    categoryLabel: 'POSIX User ID',
    header: '<sys/types.h>',
    standard: 'POSIX.1-2001',
    summary: 'Unsigned integer type representing POSIX user account IDs. Returned by getuid() and geteuid().',
    bitWidth: 32,
    byteSize: '4 bytes'
  },
  gid_t: {
    name: 'gid_t',
    underlyingType: 'unsigned int',
    category: 'posix',
    categoryLabel: 'POSIX Group ID',
    header: '<sys/types.h>',
    standard: 'POSIX.1-2001',
    summary: 'Unsigned integer type representing POSIX group account IDs. Returned by getgid() and getegid().',
    bitWidth: 32,
    byteSize: '4 bytes'
  },
  mode_t: {
    name: 'mode_t',
    underlyingType: 'unsigned int',
    category: 'posix',
    categoryLabel: 'POSIX File Mode / Permission Mask',
    header: '<sys/types.h>',
    standard: 'POSIX.1-2001',
    summary: 'Bitmask integer representing file system modes, file types (S_IFREG, S_IFDIR), and access permissions (S_IRWXU, S_IRWXG, S_IRWXO).',
    bitWidth: 32,
    byteSize: '4 bytes'
  },
  off_t: {
    name: 'off_t',
    underlyingType: 'long long',
    category: 'posix',
    categoryLabel: 'POSIX File Offset Type',
    header: '<sys/types.h>',
    standard: 'POSIX.1-2001',
    summary: 'Signed integer type representing file offsets, seek boundaries, and file sizes. Typically 64 bits.',
    bitWidth: 64,
    byteSize: '8 bytes'
  },
  ssize_t: {
    name: 'ssize_t',
    underlyingType: 'long / long long',
    category: 'posix',
    categoryLabel: 'POSIX Signed Size Type',
    header: '<sys/types.h> / <unistd.h>',
    standard: 'POSIX.1-2001',
    summary: 'Signed integer type used for byte counts that can indicate an error condition (-1), such as return values from read(), write(), and socket calls.',
    byteSize: '4 bytes (32-bit) / 8 bytes (64-bit)'
  },
  socklen_t: {
    name: 'socklen_t',
    underlyingType: 'unsigned int / int',
    category: 'posix',
    categoryLabel: 'POSIX Socket Length Type',
    header: '<sys/socket.h>',
    standard: 'POSIX.1-2001',
    summary: 'Integer type representing lengths of socket address structures (e.g. struct sockaddr) in the Berkeley sockets API.',
    bitWidth: 32,
    byteSize: '4 bytes'
  }
};

/**
 * Parses raw C++ typedef or using alias code blocks emitted by Clangd.
 */
export function parseTypedefCodeBlock(
  codeBlock: string
): { name: string; underlyingType: string; isTypedef: boolean } | null {
  if (!codeBlock) return null;

  const normalized = codeBlock.replace(/\r\n/g, '\n').trim();

  // Strip comment lines
  const clean = normalized
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join(' ')
    .trim();

  // 1. Match `using Alias = Underlying;`
  const usingMatch = clean.match(/\busing\s+([A-Za-z0-9_:]+)\s*=\s*([^;]+);?/);
  if (usingMatch) {
    const rawName = usingMatch[1].trim();
    const cleanName = rawName.split('::').pop() || rawName;
    const underlying = usingMatch[2].trim();
    return { name: cleanName, underlyingType: underlying, isTypedef: true };
  }

  // 2. Match function pointer typedef: `typedef ReturnType (*Alias)(Args...);`
  // Supports pointer return types (e.g. void* (*Fn)()) and Win32 calling conventions (CALLBACK, WINAPI, __stdcall, __cdecl)
  const fnPtrMatch = clean.match(
    /\btypedef\s+([^;()]+?)\s*(?:\b(CALLBACK|WINAPI|APIENTRY|__stdcall|__cdecl|__fastcall)\s+)?\(\s*(?:(CALLBACK|WINAPI|APIENTRY|__stdcall|__cdecl|__fastcall)\s+)?\*([A-Za-z0-9_]+)\s*\)\s*\(([^)]*)\);?/
  );
  if (fnPtrMatch) {
    const retType = fnPtrMatch[1].trim();
    const conv = (fnPtrMatch[2] || fnPtrMatch[3] || '').trim();
    const name = fnPtrMatch[4].trim();
    const args = fnPtrMatch[5].trim();
    const convPrefix = conv ? `${conv} ` : '';
    return {
      name,
      underlyingType: `${retType} (${convPrefix}*)(${args})`,
      isTypedef: true
    };
  }

  // 3. Match standard typedef: `typedef <underlyingType> <aliasName>;`
  // May include pointer stars and struct tags: `typedef struct HWND__ *HWND;` or `typedef void *HANDLE;`
  const match = clean.match(/\btypedef\s+(.+?)\s*;?$/);
  if (match) {
    const body = match[1].trim();
    const lastWordMatch = body.match(/^(.*?)(?:\s+|\s*(\*+)\s*|\s*(&+)\s*)([A-Za-z0-9_]+)$/);
    if (lastWordMatch) {
      const baseType = lastWordMatch[1].trim();
      const pointerStar = lastWordMatch[2] || '';
      const refAmp = lastWordMatch[3] || '';
      const name = lastWordMatch[4].trim();
      const underlying = pointerStar ? `${baseType}*` : refAmp ? `${baseType}&` : baseType;
      return { name, underlyingType: underlying.trim(), isTypedef: true };
    }
  }

  return null;
}

/**
 * Searches the curated typedef database for a given type symbol.
 */
export function lookupTypedef(symbol: string): TypedefInfo | null {
  if (!symbol) return null;

  const clean = symbol.trim().replace(/^std::/, '').replace(/^::/, '');

  if (TYPEDEF_KNOWLEDGE_BASE[clean]) {
    return TYPEDEF_KNOWLEDGE_BASE[clean];
  }

  return null;
}

/**
 * Formats a rich hover card for a known curated typedef.
 */
export function formatTypedefHover(
  info: TypedefInfo,
  codeBlock?: string,
  range?: vscode.Range
): vscode.Hover {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;

  md.appendMarkdown(`### \`${info.name}\` *(Type Alias / ${info.categoryLabel})*\n\n`);

  const stdBadge = info.standard ? `\`[${info.standard}]\`` : '';
  const headerBadge = info.header ? `\`[${info.header}]\`` : '';
  md.appendMarkdown(`**Category**: \`[${info.categoryLabel}]\` ${headerBadge} ${stdBadge}\n\n`);

  const codeToShow = codeBlock || `typedef ${info.underlyingType} ${info.name};`;
  md.appendCodeblock(codeToShow, 'cpp');
  md.appendMarkdown(`${info.summary}\n\n`);

  md.appendMarkdown('#### Type Details\n\n');
  md.appendMarkdown(`- **Underlying Type**: \`${info.underlyingType}\`\n`);

  if (info.bitWidth) {
    const byteStr = info.byteSize || `${info.bitWidth / 8} byte${info.bitWidth > 8 ? 's' : ''}`;
    md.appendMarkdown(`- **Bit Width**: ${info.bitWidth} bits (${byteStr})\n`);
  } else if (info.byteSize) {
    md.appendMarkdown(`- **Memory Size**: ${info.byteSize}\n`);
  }

  if (info.valueRange) {
    md.appendMarkdown(`- **Value Range**: \`${info.valueRange}\`\n`);
  }

  if (info.invalidValue) {
    md.appendMarkdown(`- **Invalid / Sentinel Value**: \`${info.invalidValue}\`\n`);
  }

  if (info.formatSpecifier) {
    md.appendMarkdown(`- **Format Specifier**: \`${info.formatSpecifier}\`\n`);
  }

  if (info.notes) {
    md.appendMarkdown(`- **Usage Note**: ${info.notes}\n`);
  }

  md.appendMarkdown('\n---\n');

  const docLink = info.docUrl ? `[cppreference: ${info.name}](${info.docUrl}) | ` : '';
  md.appendMarkdown(
    `${docLink}[Switch Header/Source](command:novacpp.switchSourceHeader) | [Find References](command:editor.action.findReferences)`
  );

  return new vscode.Hover(md, range);
}

/**
 * Formats a clean hover card for a user-defined or un-cataloged typedef.
 */
export function formatUserTypedefHover(
  name: string,
  underlyingType: string,
  codeBlock: string,
  range?: vscode.Range
): vscode.Hover {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;

  md.appendMarkdown(`### \`${name}\` *(Type Alias)*\n\n`);
  md.appendCodeblock(codeBlock, 'cpp');

  md.appendMarkdown('#### Type Details\n\n');
  md.appendMarkdown(`- **Underlying Type**: \`${underlyingType}\`\n`);

  md.appendMarkdown('\n---\n');
  md.appendMarkdown(
    '[Switch Header/Source](command:novacpp.switchSourceHeader) | [Find References](command:editor.action.findReferences)'
  );

  return new vscode.Hover(md, range);
}

/**
 * Main provider evaluating hovers for typedefs and type aliases.
 */
export class TypedefProvider {
  /**
   * Attempts to provide a rich typedef hover from a code block or hovered identifier.
   */
  public static provideTypedefHover(
    codeBlock: string,
    hoveredWord?: string,
    range?: vscode.Range
  ): vscode.Hover | null {
    const parsed = parseTypedefCodeBlock(codeBlock);

    // 1. Try curated lookup using hoveredWord first
    if (hoveredWord) {
      const info = lookupTypedef(hoveredWord);
      if (info) {
        return formatTypedefHover(info, codeBlock, range);
      }
    }

    // 2. Try curated lookup using parsed alias name
    if (parsed) {
      const info = lookupTypedef(parsed.name);
      if (info) {
        return formatTypedefHover(info, codeBlock, range);
      }

      // 3. Fallback to structured user-defined typedef card
      return formatUserTypedefHover(parsed.name, parsed.underlyingType, codeBlock, range);
    }

    return null;
  }
}
