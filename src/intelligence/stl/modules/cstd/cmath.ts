import { StlDocEntry, StlHeaderModule } from '../../types';

export const CMATH_ENTRIES: Record<string, StlDocEntry> = {
  'std::sqrt': {
    symbol: 'std::sqrt',
    canonicalSignature: 'float sqrt(float arg);\ndouble sqrt(double arg);\nlong double sqrt(long double arg);',
    summary: 'Computes the square root of the argument. If the argument is negative, a domain error occurs and NaN is returned.',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Value of a floating-point or integer type. If integer, it is cast to double.'
    },
    returns: 'Square root of arg. Returns NaN on negative numbers.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/sqrt',
    complexity: { time: 'O(1) typically hardware-accelerated instruction (SQRTSS/SQRTSD)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double r = std::sqrt(25.0); // r = 5.0\ndouble diag = std::sqrt(w * w + h * h);',
    seeAlso: ['std::pow', 'std::hypot', 'std::cbrt']
  },
  'std::pow': {
    symbol: 'std::pow',
    canonicalSignature: 'double pow(double base, double exp);',
    summary: 'Computes the value of base raised to the power exp (base^exp).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      base: 'Base value',
      exp: 'Exponent value'
    },
    returns: 'base raised to the power exp.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/pow',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double x = std::pow(2.0, 10.0); // 1024.0',
    seeAlso: ['std::sqrt', 'std::exp']
  },
  'std::abs': {
    symbol: 'std::abs',
    canonicalSignature: 'int abs(int n);\ndouble abs(double n);',
    summary: 'Computes the absolute value of the argument. Overloaded for both integer and floating-point types.',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      n: 'Integral or floating-point value'
    },
    returns: 'Absolute value |n|.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/abs',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int diff = std::abs(target - current);',
    seeAlso: ['std::fabs', 'std::labs']
  },
  'std::sin': {
    symbol: 'std::sin',
    canonicalSignature: 'double sin(double arg);',
    summary: 'Computes the sine of arg (measured in radians).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Floating-point angle in radians'
    },
    returns: 'Sine of arg in range [-1, +1].',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/sin',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double s = std::sin(3.14159265 / 2.0); // approximately 1.0',
    seeAlso: ['std::cos', 'std::tan', 'std::asin']
  },
  'std::cos': {
    symbol: 'std::cos',
    canonicalSignature: 'double cos(double arg);',
    summary: 'Computes the cosine of arg (measured in radians).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Floating-point angle in radians'
    },
    returns: 'Cosine of arg in range [-1, +1].',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/cos',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double c = std::cos(0.0); // 1.0',
    seeAlso: ['std::sin', 'std::acos']
  },
  'std::tan': {
    symbol: 'std::tan',
    canonicalSignature: 'double tan(double arg);',
    summary: 'Computes the tangent of arg (measured in radians).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Floating-point angle in radians'
    },
    returns: 'Tangent of arg.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/tan',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double t = std::tan(0.785398); // tan(pi/4) ~ 1.0',
    seeAlso: ['std::sin', 'std::cos', 'std::atan']
  },
  'std::floor': {
    symbol: 'std::floor',
    canonicalSignature: 'double floor(double arg);',
    summary: 'Computes the largest integer value not greater than arg (rounds down toward negative infinity).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Floating-point value'
    },
    returns: 'Largest integer value <= arg.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/floor',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double f = std::floor(2.8); // 2.0\ndouble neg = std::floor(-2.1); // -3.0',
    seeAlso: ['std::ceil', 'std::round', 'std::trunc']
  },
  'std::ceil': {
    symbol: 'std::ceil',
    canonicalSignature: 'double ceil(double arg);',
    summary: 'Computes the smallest integer value not less than arg (rounds up toward positive infinity).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Floating-point value'
    },
    returns: 'Smallest integer value >= arg.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/ceil',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double c = std::ceil(2.1); // 3.0',
    seeAlso: ['std::floor', 'std::round']
  },
  'std::round': {
    symbol: 'std::round',
    canonicalSignature: 'double round(double arg);',
    summary: 'Computes the nearest integer value to arg, rounding halfway cases away from zero.',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      arg: 'Floating-point value'
    },
    returns: 'Nearest integer value to arg.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/round',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double r = std::round(2.5); // 3.0',
    seeAlso: ['std::floor', 'std::ceil', 'std::trunc']
  },
  'std::hypot': {
    symbol: 'std::hypot',
    canonicalSignature: 'double hypot(double x, double y);\ndouble hypot(double x, double y, double z);',
    summary: 'Computes the hypotenuse sqrt(x^2 + y^2) or 3D Euclidean distance sqrt(x^2 + y^2 + z^2) without intermediate overflow or underflow.',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      x: 'First coordinate distance',
      y: 'Second coordinate distance',
      z: 'Optional third coordinate distance (C++17)'
    },
    returns: 'Euclidean distance.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/hypot',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double dist = std::hypot(3.0, 4.0); // 5.0\ndouble dist3d = std::hypot(1.0, 2.0, 2.0); // 3.0 (C++17)',
    seeAlso: ['std::sqrt', 'std::pow']
  },
  'std::log': {
    symbol: 'std::log',
    canonicalSignature: 'double log(double arg);',
    summary: 'Computes the natural (base e) logarithm of arg.',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Floating-point value > 0'
    },
    returns: 'Natural logarithm ln(arg).',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/log',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double l = std::log(std::numbers::e); // 1.0',
    seeAlso: ['std::log2', 'std::log10', 'std::exp']
  },
  'std::log2': {
    symbol: 'std::log2',
    canonicalSignature: 'double log2(double arg);',
    summary: 'Computes the binary (base 2) logarithm of arg.',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      arg: 'Floating-point value > 0'
    },
    returns: 'Base-2 logarithm log2(arg).',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/log2',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double bits = std::log2(1024.0); // 10.0',
    seeAlso: ['std::log', 'std::log10']
  },
  'std::exp': {
    symbol: 'std::exp',
    canonicalSignature: 'double exp(double arg);',
    summary: 'Computes e raised to the given power (e^arg).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      arg: 'Exponent value'
    },
    returns: 'e^arg.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/exp',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double v = std::exp(1.0); // ~2.71828',
    seeAlso: ['std::log', 'std::pow']
  }
};

export const cmathModule: StlHeaderModule = {
  id: 'cmath',
  headers: ['<cmath>', '<math.h>'],
  entries: CMATH_ENTRIES
};
