import { StlDocEntry, StlHeaderModule } from '../../types';

export const CCTYPE_ENTRIES: Record<string, StlDocEntry> = {
  'std::isalpha': {
    symbol: 'std::isalpha',
    canonicalSignature: 'int isalpha(int ch);',
    summary: 'Checks if the given character is an alphabetic character (a-z, A-Z) in the current C locale.',
    header: '<cctype>',
    standard: 'C++98',
    parameters: {
      ch: 'Character to classify, represented as unsigned char or EOF'
    },
    returns: 'Non-zero value if character is alphabetic, 0 otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/isalpha',
    complexity: { time: 'O(1) table lookup' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'bool valid = std::isalpha(static_cast<unsigned char>(c));',
    seeAlso: ['std::isdigit', 'std::isalnum']
  },
  'std::isdigit': {
    symbol: 'std::isdigit',
    canonicalSignature: 'int isdigit(int ch);',
    summary: 'Checks if the given character is a numeric decimal digit (0-9).',
    header: '<cctype>',
    standard: 'C++98',
    parameters: {
      ch: 'Character to classify, represented as unsigned char or EOF'
    },
    returns: 'Non-zero value if character is numeric digit, 0 otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/isdigit',
    complexity: { time: 'O(1) table lookup' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'if (std::isdigit(static_cast<unsigned char>(c))) { /* digit */ }',
    seeAlso: ['std::isalpha', 'std::isxdigit']
  },
  'std::isalnum': {
    symbol: 'std::isalnum',
    canonicalSignature: 'int isalnum(int ch);',
    summary: 'Checks if the given character is alphanumeric (a-z, A-Z, or 0-9).',
    header: '<cctype>',
    standard: 'C++98',
    parameters: {
      ch: 'Character to classify'
    },
    returns: 'Non-zero value if alphanumeric, 0 otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/isalnum',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'bool ok = std::isalnum(static_cast<unsigned char>(ch));',
    seeAlso: ['std::isalpha', 'std::isdigit']
  },
  'std::isspace': {
    symbol: 'std::isspace',
    canonicalSignature: 'int isspace(int ch);',
    summary: 'Checks if the given character is a whitespace character (space, form feed, newline, carriage return, horizontal tab, vertical tab).',
    header: '<cctype>',
    standard: 'C++98',
    parameters: {
      ch: 'Character to classify'
    },
    returns: 'Non-zero value if whitespace, 0 otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/isspace',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'while (std::isspace(static_cast<unsigned char>(*p))) ++p;',
    seeAlso: ['std::iscntrl', 'std::isblank']
  },
  'std::tolower': {
    symbol: 'std::tolower',
    canonicalSignature: 'int tolower(int ch);',
    summary: 'Converts the given character to lowercase according to the character conversion rules defined by the current C locale.',
    header: '<cctype>',
    standard: 'C++98',
    parameters: {
      ch: 'Character to convert'
    },
    returns: 'Lowercase version of ch or unmodified ch if no lowercase equivalent exists.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/tolower',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char lower = static_cast<char>(std::tolower(static_cast<unsigned char>(\'A\'))); // \'a\'',
    seeAlso: ['std::toupper']
  },
  'std::toupper': {
    symbol: 'std::toupper',
    canonicalSignature: 'int toupper(int ch);',
    summary: 'Converts the given character to uppercase according to the character conversion rules defined by the current C locale.',
    header: '<cctype>',
    standard: 'C++98',
    parameters: {
      ch: 'Character to convert'
    },
    returns: 'Uppercase version of ch or unmodified ch if no uppercase equivalent exists.',
    docUrl: 'https://en.cppreference.com/w/cpp/string/byte/toupper',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'char upper = static_cast<char>(std::toupper(static_cast<unsigned char>(\'b\'))); // \'B\'',
    seeAlso: ['std::tolower']
  }
};

export const cctypeModule: StlHeaderModule = {
  id: 'cctype',
  headers: ['<cctype>', '<ctype.h>'],
  entries: CCTYPE_ENTRIES
};
