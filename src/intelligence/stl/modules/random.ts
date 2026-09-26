import { StlDocEntry, StlHeaderModule } from '../types';

export const RANDOM_ENTRIES: Record<string, StlDocEntry> = {
  'std::random_device': {
    symbol: 'std::random_device',
    canonicalSignature: 'class random_device;',
    summary: 'Hardware-based non-deterministic uniform random number generator (entropy source), typically wrapping OS entropy (/dev/urandom or BCryptGenRandom). Commonly used to seed PRNGs like std::mt19937.',
    header: '<random>',
    standard: 'C++11',
    parameters: {},
    returns: 'Unsigned 32-bit random integer value via operator().',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/random_device',
    complexity: { time: 'O(1) system call or hardware RNG read' },
    exceptionSafety: 'May throw std::system_error if hardware entropy device fails to open.',
    example: 'std::random_device rd;\nstd::mt19937 gen(rd());',
    seeAlso: ['std::mt19937', 'std::mt19937_64']
  },
  'std::mt19937': {
    symbol: 'std::mt19937',
    canonicalSignature: 'using mt19937 = std::mersenne_twister_engine<uint_fast32_t, 32, 624, 397, 31, 0x9908b0df, 11, 0xffffffff, 7, 0x9d2c5680, 15, 0xefc60000, 18, 1812433253>;',
    summary: 'Mersenne Twister pseudo-random number generator producing 32-bit unsigned integers with an enormous period of 2^19937-1. High statistical quality for general simulation.',
    header: '<random>',
    standard: 'C++11',
    parameters: {
      seed: 'Integral seed value or seed sequence'
    },
    returns: '32-bit pseudo-random unsigned integer via operator().',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/mersenne_twister_engine',
    complexity: { time: 'O(1) amortized state transition' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::random_device rd;\nstd::mt19937 gen(rd());\nuint32_t r = gen();',
    seeAlso: ['std::mt19937_64', 'std::random_device', 'std::uniform_int_distribution']
  },
  'std::mt19937_64': {
    symbol: 'std::mt19937_64',
    canonicalSignature: 'using mt19937_64 = std::mersenne_twister_engine<uint_fast64_t, 64, 312, 156, 31, 0xb5026f5aa96619e9ULL, 29, 0x5555555555555555ULL, 17, 0x71d67fffeda60000ULL, 37, 0xfff7eee000000000ULL, 43, 6364136223846793005ULL>;',
    summary: '64-bit Mersenne Twister pseudo-random number generator producing 64-bit unsigned integers with a period of 2^19937-1.',
    header: '<random>',
    standard: 'C++11',
    parameters: {
      seed: '64-bit integral seed value or seed sequence'
    },
    returns: '64-bit pseudo-random unsigned integer via operator().',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/mersenne_twister_engine',
    complexity: { time: 'O(1) amortized' },
    exceptionSafety: 'No-throw guarantee.',
    example: 'std::random_device rd;\nstd::mt19937_64 gen64(rd());\nuint64_t largeNum = gen64();',
    seeAlso: ['std::mt19937', 'std::uniform_int_distribution']
  },
  'std::uniform_int_distribution': {
    symbol: 'std::uniform_int_distribution',
    canonicalSignature: 'template <typename IntType = int>\nclass uniform_int_distribution;',
    summary: 'Produces integer values evenly distributed across the closed interval [a, b]. Eliminates modulo bias present in std::rand() % N.',
    header: '<random>',
    standard: 'C++11',
    parameters: {
      a: 'Inclusive minimum integer bound (default 0)',
      b: 'Inclusive maximum integer bound (default max)'
    },
    returns: 'Random integer in range [a, b] when invoked with an engine: dist(gen).',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/uniform_int_distribution',
    complexity: { time: 'O(1) amortized rejection sampling' },
    exceptionSafety: 'No-throw guarantee if engine does not throw.',
    example: 'std::mt19937 gen(std::random_device{}());\nstd::uniform_int_distribution<int> dice(1, 6);\nint roll = dice(gen);',
    seeAlso: ['std::uniform_real_distribution', 'std::bernoulli_distribution']
  },
  'std::uniform_real_distribution': {
    symbol: 'std::uniform_real_distribution',
    canonicalSignature: 'template <typename RealType = double>\nclass uniform_real_distribution;',
    summary: 'Produces floating-point values uniformly distributed across the half-open interval [a, b).',
    header: '<random>',
    standard: 'C++11',
    parameters: {
      a: 'Inclusive lower bound (default 0.0)',
      b: 'Exclusive upper bound (default 1.0)'
    },
    returns: 'Random floating-point value in range [a, b) when invoked with an engine: dist(gen).',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/uniform_real_distribution',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee if engine does not throw.',
    example: 'std::mt19937 gen(std::random_device{}());\nstd::uniform_real_distribution<double> dist(0.0, 1.0);\ndouble prob = dist(gen);',
    seeAlso: ['std::uniform_int_distribution', 'std::normal_distribution']
  },
  'std::normal_distribution': {
    symbol: 'std::normal_distribution',
    canonicalSignature: 'template <typename RealType = double>\nclass normal_distribution;',
    summary: 'Generates random floating-point values distributed according to Gaussian (normal) probability density function with specified mean and standard deviation.',
    header: '<random>',
    standard: 'C++11',
    parameters: {
      mean: 'Mean (center) of the distribution (default 0.0)',
      stddev: 'Standard deviation (spread) of the distribution (default 1.0)'
    },
    returns: 'Random floating-point value according to normal distribution.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/normal_distribution',
    complexity: { time: 'O(1) amortized' },
    exceptionSafety: 'No-throw guarantee if engine does not throw.',
    example: 'std::mt19937 gen(std::random_device{}());\nstd::normal_distribution<double> dist(170.0, 10.0);\ndouble height = dist(gen);',
    seeAlso: ['std::uniform_real_distribution']
  },
  'std::bernoulli_distribution': {
    symbol: 'std::bernoulli_distribution',
    canonicalSignature: 'class bernoulli_distribution;',
    summary: 'Generates boolean values (true or false) according to Bernoulli distribution with success probability p.',
    header: '<random>',
    standard: 'C++11',
    parameters: {
      p: 'Probability of generating true, in range [0.0, 1.0] (default 0.5)'
    },
    returns: 'Random boolean value.',
    docUrl: 'https://en.cppreference.com/w/cpp/numeric/random/bernoulli_distribution',
    complexity: { time: 'O(1)' },
    exceptionSafety: 'No-throw guarantee if engine does not throw.',
    example: 'std::mt19937 gen(std::random_device{}());\nstd::bernoulli_distribution coin(0.5);\nbool heads = coin(gen);',
    seeAlso: ['std::uniform_int_distribution']
  }
};

export const randomModule: StlHeaderModule = {
  id: 'random',
  headers: ['<random>'],
  entries: RANDOM_ENTRIES
};
