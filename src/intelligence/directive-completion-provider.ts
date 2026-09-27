import * as vscode from 'vscode';

export interface DirectiveTemplate {
  label: string;
  filterKeywords: string[];
  detail: string;
  documentation: string;
  snippet: string;
  sortOrder: number;
  command?: vscode.Command;
}

export const PREPROCESSOR_DIRECTIVE_TEMPLATES: DirectiveTemplate[] = [
  {
    label: '#include <...>',
    filterKeywords: ['#include', 'include', '#inc', 'inc'],
    detail: 'Preprocessor: Include system or library header',
    documentation:
      'Includes an ISO C++ standard library or external system header file enclosed in angle brackets (< >).\n\nExample:\n```cpp\n#include <vector>\n#include <iostream>\n```',
    snippet: '#include <$0',
    sortOrder: 10,
    command: {
      command: 'editor.action.triggerSuggest',
      title: 'Trigger Suggestions'
    }
  },
  {
    label: '#include "..."',
    filterKeywords: ['#include', 'include', '#inc', 'inc'],
    detail: 'Preprocessor: Include local or project header',
    documentation:
      'Includes a local user-defined or project header file enclosed in quotes (" "). Searches current directory first before system include paths.\n\nExample:\n```cpp\n#include "my_header.h"\n```',
    snippet: '#include "$0',
    sortOrder: 11,
    command: {
      command: 'editor.action.triggerSuggest',
      title: 'Trigger Suggestions'
    }
  },
  {
    label: '#if ... #endif',
    filterKeywords: ['#if', 'if'],
    detail: 'Preprocessor: Conditional compilation block',
    documentation:
      'Conditionally compiles the enclosed code if the constant expression evaluates to non-zero.\n\nExample:\n```cpp\n#if DEBUG_LEVEL > 1\n    log_trace();\n#endif\n```',
    snippet: '#if ${1:0}\n\t$0\n#endif',
    sortOrder: 20
  },
  {
    label: '#if defined(...)',
    filterKeywords: ['#if', 'if', '#ifdef', 'defined'],
    detail: 'Preprocessor: Conditional defined check',
    documentation:
      'Checks whether one or more preprocessor macros are defined using the `defined` operator.\n\nExample:\n```cpp\n#if defined(_WIN32) || defined(__linux__)\n    init_platform();\n#endif\n```',
    snippet: '#if defined(${1:MACRO})\n\t$0\n#endif',
    sortOrder: 21
  },
  {
    label: '#ifdef ... #endif',
    filterKeywords: ['#ifdef', 'ifdef', '#if', 'if'],
    detail: 'Preprocessor: If macro defined',
    documentation:
      'Conditionally compiles the enclosed block if the specified identifier is currently defined as a macro.\n\nExample:\n```cpp\n#ifdef NDEBUG\n    // release mode optimization\n#endif\n```',
    snippet: '#ifdef ${1:MACRO}\n\t$0\n#endif',
    sortOrder: 22
  },
  {
    label: '#ifndef ... #endif',
    filterKeywords: ['#ifndef', 'ifndef', '#if', 'if'],
    detail: 'Preprocessor: If macro not defined',
    documentation:
      'Conditionally compiles the enclosed block if the specified identifier is not defined.\n\nExample:\n```cpp\n#ifndef VERSION_STRING\n#define VERSION_STRING "1.0.0"\n#endif\n```',
    snippet: '#ifndef ${1:MACRO}\n\t$0\n#endif',
    sortOrder: 23
  },
  {
    label: '#ifndef (Include Guard)',
    filterKeywords: ['#ifndef', 'ifndef', 'guard', 'headerguard'],
    detail: 'Preprocessor: Standard header include guard',
    documentation:
      'Standard portable header guard idiom preventing duplicate token inclusion.\n\nExample:\n```cpp\n#ifndef MY_CLASS_H\n#define MY_CLASS_H\n\n// declarations\n\n#endif // MY_CLASS_H\n```',
    snippet: '#ifndef ${1:HEADER_GUARD_H}\n#define ${1:HEADER_GUARD_H}\n\n$0\n\n#endif // ${1:HEADER_GUARD_H}',
    sortOrder: 24
  },
  {
    label: '#elif',
    filterKeywords: ['#elif', 'elif', 'else if'],
    detail: 'Preprocessor: Else-if condition',
    documentation:
      'Alternative condition in a preprocessor conditional chain.\n\nExample:\n```cpp\n#if defined(_WIN32)\n    // Windows\n#elif defined(__APPLE__)\n    // macOS\n#endif\n```',
    snippet: '#elif ${1:condition}',
    sortOrder: 30
  },
  {
    label: '#elifdef',
    filterKeywords: ['#elifdef', 'elifdef'],
    detail: 'Preprocessor: Else-if macro defined (C++23 / C23)',
    documentation:
      'Alternative macro defined branch. Standardized in ISO C++23 and ISO C23.\n\nExample:\n```cpp\n#if defined(BACKEND_VULKAN)\n    init_vk();\n#elifdef BACKEND_DX12\n    init_dx12();\n#endif\n```',
    snippet: '#elifdef ${1:MACRO}',
    sortOrder: 31
  },
  {
    label: '#elifndef',
    filterKeywords: ['#elifndef', 'elifndef'],
    detail: 'Preprocessor: Else-if macro not defined (C++23 / C23)',
    documentation:
      'Alternative macro not-defined branch. Standardized in ISO C++23 and ISO C23.',
    snippet: '#elifndef ${1:MACRO}',
    sortOrder: 32
  },
  {
    label: '#else',
    filterKeywords: ['#else', 'else'],
    detail: 'Preprocessor: Fallback branch',
    documentation:
      'Default fallback branch executed when preceding `#if` or `#elif` conditions evaluate to false.',
    snippet: '#else\n\t$0',
    sortOrder: 33
  },
  {
    label: '#endif',
    filterKeywords: ['#endif', 'endif'],
    detail: 'Preprocessor: End conditional block',
    documentation:
      'Closes a `#if`, `#ifdef`, or `#ifndef` conditional preprocessor directive block.',
    snippet: '#endif',
    sortOrder: 34
  },
  {
    label: '#define (Constant)',
    filterKeywords: ['#define', 'define', '#def', 'def'],
    detail: 'Preprocessor: Macro constant definition',
    documentation:
      'Defines a text replacement identifier constant.\n\nExample:\n```cpp\n#define BUFFER_CAPACITY 4096\n```',
    snippet: '#define ${1:CONSTANT} ${2:value}',
    sortOrder: 40
  },
  {
    label: '#define (Function Macro)',
    filterKeywords: ['#define', 'define', '#def', 'def', 'macro'],
    detail: 'Preprocessor: Function-like macro definition',
    documentation:
      'Defines a parameterized function-like preprocessor macro.\n\nExample:\n```cpp\n#define CLAMP(x, lo, hi) (((x) < (lo)) ? (lo) : (((x) > (hi)) ? (hi) : (x)))\n```',
    snippet: '#define ${1:MACRO_NAME}(${2:args}) (${3:body})',
    sortOrder: 41
  },
  {
    label: '#undef',
    filterKeywords: ['#undef', 'undef'],
    detail: 'Preprocessor: Undefine macro identifier',
    documentation:
      'Cancels the definition of a previously defined preprocessor macro identifier.\n\nExample:\n```cpp\n#undef MIN\n#undef MAX\n```',
    snippet: '#undef ${1:MACRO}',
    sortOrder: 42
  },
  {
    label: '#pragma once',
    filterKeywords: ['#pragma', 'pragma', 'once', '#pragma once'],
    detail: 'Preprocessor: Header include guard',
    documentation:
      'Non-standard but universally supported compiler directive that ensures the containing file is included only once per translation unit.\n\nSupported by MSVC, GCC, Clang, and Intel compilers.',
    snippet: '#pragma once\n\n$0',
    sortOrder: 50
  },
  {
    label: '#pragma pack',
    filterKeywords: ['#pragma', 'pragma', 'pack'],
    detail: 'Preprocessor: Structure member packing alignment',
    documentation:
      'Controls the byte alignment and packing boundaries of structure and union members in memory.\n\nExample:\n```cpp\n#pragma pack(push, 1)\nstruct BitmapHeader { ... };\n#pragma pack(pop)\n```',
    snippet: '#pragma pack(push, ${1:1})\n$0\n#pragma pack(pop)',
    sortOrder: 51
  },
  {
    label: '#error',
    filterKeywords: ['#error', 'error'],
    detail: 'Preprocessor: Emit compile-time fatal diagnostic',
    documentation:
      'Emits a fatal compiler diagnostic error message and halts compilation.\n\nExample:\n```cpp\n#if __cplusplus < 202002L\n#error "C++20 or later is required to compile TurboCpp."\n#endif\n```',
    snippet: '#error "${1:Unsupported compiler configuration}"',
    sortOrder: 60
  },
  {
    label: '#warning',
    filterKeywords: ['#warning', 'warning'],
    detail: 'Preprocessor: Emit compile-time diagnostic warning',
    documentation:
      'Emits a compiler diagnostic warning message without halting compilation.\n\nExample:\n```cpp\n#warning "Legacy API backend is deprecated."\n```',
    snippet: '#warning "${1:Warning description}"',
    sortOrder: 61
  },
  {
    label: '#line',
    filterKeywords: ['#line', 'line'],
    detail: 'Preprocessor: Set internal compiler line number',
    documentation:
      'Sets the compiler\'s internal line numbering and optional filename for diagnostics.',
    snippet: '#line ${1:100} "${2:filename}"',
    sortOrder: 70
  }
];

/**
 * Provides autocompletion items for preprocessor directives (#include, #if, #ifdef, #define, #pragma, etc.)
 * with intelligent snippet insertion, tab stops, and standard documentation.
 */
export class PreprocessorDirectiveCompletionProvider implements vscode.CompletionItemProvider {
  public static readonly triggerCharacters = ['#'];

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position,
    _token: vscode.CancellationToken,
    _context: vscode.CompletionContext
  ): vscode.ProviderResult<vscode.CompletionItem[] | vscode.CompletionList> {
    const lineText = document.lineAt(position.line).text;
    const textBeforeCursor = lineText.substring(0, position.character);

    // Directive completions are valid when preceding text on the line is purely whitespace
    // followed by an optional '#' and optional directive prefix.
    const match = textBeforeCursor.match(/^(\s*)(#?)([a-zA-Z_]*)$/);
    if (!match) {
      return [];
    }

    const whitespace = match[1];
    const hashChar = match[2];
    const wordPrefix = match[3];

    // Compute replacement range from the '#' (or first word character) to the cursor position
    const startChar = whitespace.length;
    const replacementRange = new vscode.Range(
      new vscode.Position(position.line, startChar),
      position
    );

    const items: vscode.CompletionItem[] = [];

    for (const template of PREPROCESSOR_DIRECTIVE_TEMPLATES) {
      // Filter if user has already typed a prefix (e.g. user typed '#inc' or 'inc')
      if (wordPrefix.length > 0) {
        const matches = template.filterKeywords.some((kw) => {
          const strippedKw = kw.replace(/^#/, '');
          return (
            kw.toLowerCase().startsWith(wordPrefix.toLowerCase()) ||
            strippedKw.toLowerCase().startsWith(wordPrefix.toLowerCase()) ||
            (hashChar === '#' && kw.toLowerCase().startsWith(`#${wordPrefix.toLowerCase()}`))
          );
        });
        if (!matches) {
          continue;
        }
      }

      const item = new vscode.CompletionItem(template.label, vscode.CompletionItemKind.Keyword);
      item.detail = template.detail;
      const md = new vscode.MarkdownString();
      md.appendMarkdown(`**${template.detail}**\n\n${template.documentation}`);
      item.documentation = md;
      item.range = replacementRange;
      item.insertText = new vscode.SnippetString(template.snippet);

      // Provide filterText that works whether user typed `#include` or `include`
      item.filterText = hashChar === '#' ? template.label.split(' ')[0] : template.label.replace(/^#/, '').split(' ')[0];
      item.sortText = `0_${String(template.sortOrder).padStart(2, '0')}_${template.label}`;
      if (template.command) {
        item.command = template.command;
      }

      items.push(item);
    }

    return items;
  }
}
