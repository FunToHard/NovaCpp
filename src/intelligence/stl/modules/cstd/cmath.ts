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
  },
  'std::cbrt': {
    symbol: 'std::cbrt',
    canonicalSignature: 'float cbrt(float arg);\ndouble cbrt(double arg);\nlong double cbrt(long double arg);',
    summary: 'Computes the cubic root of arg.',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      arg: 'Floating-point or integer value'
    },
    returns: 'Cube root of arg.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/cbrt',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double root = std::cbrt(27.0); // 3.0',
    seeAlso: ['std::sqrt', 'std::pow']
  },
  'std::atan2': {
    symbol: 'std::atan2',
    canonicalSignature: 'float atan2(float y, float x);\ndouble atan2(double y, double x);\nlong double atan2(long double y, long double x);',
    summary: 'Computes the arc tangent of y/x using the signs of arguments to determine the quadrant of the return angle in radians in range [-pi, +pi].',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      y: 'Y-coordinate value (floating-point or integer)',
      x: 'X-coordinate value (floating-point or integer)'
    },
    returns: 'Principal arc tangent of y/x in radians, in range [-pi, +pi].',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/atan2',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double angle = std::atan2(1.0, 1.0); // pi / 4 (~0.785398 rad)',
    seeAlso: ['std::tan', 'std::sin', 'std::cos']
  },
  'std::fma': {
    symbol: 'std::fma',
    canonicalSignature: 'float fma(float x, float y, float z);\ndouble fma(double x, double y, double z);\nlong double fma(long double x, long double y, long double z);',
    summary: 'Computes fused multiply-add (x * y + z) as a single operation with only one rounding error.',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      x: 'First multiplier',
      y: 'Second multiplier',
      z: 'Addend'
    },
    returns: 'Result of (x * y) + z without intermediate rounding.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/fma',
    complexity: { time: 'O(1) hardware FMA instruction when supported' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double res = std::fma(2.0, 3.0, 4.0); // 10.0',
    seeAlso: ['std::remainder', 'std::fmod']
  },
  'std::remainder': {
    symbol: 'std::remainder',
    canonicalSignature: 'float remainder(float x, float y);\ndouble remainder(double x, double y);\nlong double remainder(long double x, long double y);',
    summary: 'Computes the IEEE floating-point remainder of x / y (rounded to the nearest integer quotient n, rounding ties to even).',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      x: 'Floating-point dividend',
      y: 'Floating-point divisor'
    },
    returns: 'Floating-point remainder of x/y.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/remainder',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double rem = std::remainder(5.1, 3.0); // -0.9',
    seeAlso: ['std::fmod']
  },
  'std::fmod': {
    symbol: 'std::fmod',
    canonicalSignature: 'float fmod(float x, float y);\ndouble fmod(double x, double y);\nlong double fmod(long double x, long double y);',
    summary: 'Computes the floating-point remainder of the division x / y (truncated toward zero).',
    header: '<cmath>',
    standard: 'C++98',
    parameters: {
      x: 'Floating-point dividend',
      y: 'Floating-point divisor'
    },
    returns: 'Remainder of x / y with same sign as x.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/fmod',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double rem = std::fmod(5.1, 3.0); // 2.1',
    seeAlso: ['std::remainder']
  },
  'std::isinf': {
    symbol: 'std::isinf',
    canonicalSignature: 'bool isinf(float num);\nbool isinf(double num);\nbool isinf(long double num);',
    summary: 'Determines if the given floating-point number num is positive or negative infinity.',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      num: 'Floating-point or integer value'
    },
    returns: 'true if num is positive or negative infinity, false otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/isinf',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'bool inf = std::isinf(1.0 / 0.0); // true',
    seeAlso: ['std::isnan', 'std::isfinite']
  },
  'std::isnan': {
    symbol: 'std::isnan',
    canonicalSignature: 'bool isnan(float num);\nbool isnan(double num);\nbool isnan(long double num);',
    summary: 'Determines if the given floating-point number num is a not-a-number (NaN) value.',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      num: 'Floating-point or integer value'
    },
    returns: 'true if num is NaN, false otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/isnan',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'bool check = std::isnan(std::sqrt(-1.0)); // true',
    seeAlso: ['std::isinf', 'std::isfinite']
  },
  'std::isfinite': {
    symbol: 'std::isfinite',
    canonicalSignature: 'bool isfinite(float num);\nbool isfinite(double num);\nbool isfinite(long double num);',
    summary: 'Determines if the given floating-point number num has finite value (neither infinite nor NaN).',
    header: '<cmath>',
    standard: 'C++11',
    parameters: {
      num: 'Floating-point or integer value'
    },
    returns: 'true if num is not infinite and not NaN, false otherwise.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/math/isfinite',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'bool finite = std::isfinite(42.0); // true',
    seeAlso: ['std::isinf', 'std::isnan']
  },
  'std::lerp': {
    symbol: 'std::lerp',
    canonicalSignature: 'constexpr float lerp(float a, float b, float t) noexcept;\nconstexpr double lerp(double a, double b, double t) noexcept;\nconstexpr long double lerp(long double a, long double b, long double t) noexcept;',
    summary: 'Computes the linear interpolation between a and b for parameter t (a + t * (b - a)) with monotonicity and exact boundary guarantees.',
    header: '<cmath>',
    standard: 'C++20',
    parameters: {
      a: 'Start of interpolation range',
      b: 'End of interpolation range',
      t: 'Interpolation factor'
    },
    returns: 'Linearly interpolated value.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/lerp',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'double mid = std::lerp(10.0, 20.0, 0.5); // 15.0',
    seeAlso: ['std::midpoint']
  },
  'std::midpoint': {
    symbol: 'std::midpoint',
    canonicalSignature: 'template <typename T>\nconstexpr T midpoint(T a, T b) noexcept;',
    summary: 'Computes the midpoint (halfway point) of two integers, floating-point numbers, or pointers without intermediate overflow.',
    header: '<cmath>',
    standard: 'C++20',
    parameters: {
      a: 'First value or pointer',
      b: 'Second value or pointer'
    },
    returns: 'Halfway point between a and b.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/midpoint',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'int mid = std::midpoint(10, 20); // 15',
    seeAlso: ['std::lerp']
  }
};

export const cmathModule: StlHeaderModule = {
  id: 'cmath',
  headers: ['<cmath>', '<math.h>'],
  entries: CMATH_ENTRIES
};
