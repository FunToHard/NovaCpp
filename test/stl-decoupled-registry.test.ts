import './vscode-mock';
import * as assert from 'assert';
import {
  findStlDocumentation,
  getStlEntriesByHeader,
  registerStlModule,
  stlRegistry,
  StlHeaderModule
} from '../src/intelligence/stl-knowledge-base';

describe('Decoupled STL & C-Standard Library Knowledge Base', () => {
  it('should look up ISO C++ standard symbols from decoupled modules', () => {
    const makeUnique = findStlDocumentation('std::make_unique');
    assert.ok(makeUnique);
    assert.strictEqual(makeUnique.header, '<memory>');
    assert.strictEqual(makeUnique.standard, 'C++14');
    assert.ok(makeUnique.complexity?.time);

    const vecPush = findStlDocumentation('push_back', 'std::vector<int>');
    assert.ok(vecPush);
    assert.strictEqual(vecPush.symbol, 'std::vector::push_back');
    assert.strictEqual(vecPush.header, '<vector>');
  });

  it('should look up C Standard Library symbols under cstd headers with both std:: and bare names', () => {
    // Math functions (<cmath> / <math.h>)
    const sqrtPrefixed = findStlDocumentation('std::sqrt');
    const sqrtBare = findStlDocumentation('sqrt');
    assert.ok(sqrtPrefixed);
    assert.ok(sqrtBare);
    assert.strictEqual(sqrtPrefixed.symbol, 'std::sqrt');
    assert.strictEqual(sqrtBare.symbol, 'std::sqrt');
    assert.strictEqual(sqrtPrefixed.header, '<cmath>');

    // Memory functions (<cstring> / <string.h>)
    const memcpyPrefixed = findStlDocumentation('std::memcpy');
    const memcpyBare = findStlDocumentation('memcpy');
    assert.ok(memcpyPrefixed);
    assert.ok(memcpyBare);
    assert.strictEqual(memcpyPrefixed.header, '<cstring>');

    // I/O functions (<cstdio> / <stdio.h>)
    const printfDoc = findStlDocumentation('printf');
    assert.ok(printfDoc);
    assert.strictEqual(printfDoc.symbol, 'std::printf');
    assert.strictEqual(printfDoc.header, '<cstdio>');

    // Heap allocation (<cstdlib> / <stdlib.h>)
    const mallocDoc = findStlDocumentation('malloc');
    assert.ok(mallocDoc);
    assert.strictEqual(mallocDoc.symbol, 'std::malloc');
    assert.strictEqual(mallocDoc.header, '<cstdlib>');
  });

  it('should retrieve entries indexed by header name', () => {
    const cmathEntries = getStlEntriesByHeader('<cmath>');
    assert.ok(cmathEntries.length >= 10);
    const symbols = cmathEntries.map((e) => e.symbol);
    assert.ok(symbols.includes('std::sqrt'));
    assert.ok(symbols.includes('std::pow'));
    assert.ok(symbols.includes('std::sin'));

    const cstdioEntries = getStlEntriesByHeader('cstdio');
    assert.ok(cstdioEntries.length >= 5);
    const ioSymbols = cstdioEntries.map((e) => e.symbol);
    assert.ok(ioSymbols.includes('std::printf'));
    assert.ok(ioSymbols.includes('std::fopen'));
  });

  it('should allow dynamically registering custom standard library headers', () => {
    const customModule: StlHeaderModule = {
      id: 'custom_std_lib',
      headers: ['<experimental/simd>'],
      entries: {
        'std::experimental::native_simd': {
          symbol: 'std::experimental::native_simd',
          canonicalSignature: 'template <typename T> using native_simd = simd<T, simd_abi::native<T>>;',
          summary: 'Vectorized SIMD register representation tailored to target architecture hardware lanes.',
          header: '<experimental/simd>',
          standard: 'C++26 TS',
          parameters: {},
          returns: '',
          docUrl: 'https://en.cppreference.com/w/cpp/experimental/simd',
          complexity: { time: 'O(1) vector execution' }
        }
      }
    };

    registerStlModule(customModule);

    const lookup = findStlDocumentation('std::experimental::native_simd');
    assert.ok(lookup);
    assert.strictEqual(lookup.header, '<experimental/simd>');
    assert.strictEqual(lookup.standard, 'C++26 TS');

    const byHeader = getStlEntriesByHeader('<experimental/simd>');
    assert.strictEqual(byHeader.length, 1);
    assert.strictEqual(byHeader[0].symbol, 'std::experimental::native_simd');
  });

  it('should report substantial symbol coverage in decoupled registry', () => {
    assert.ok(stlRegistry.size() >= 100);
  });

  it('should look up numerical and bit manipulation symbols (<numeric>, <bit>, <random>)', () => {
    // <numeric>
    const acc = findStlDocumentation('std::accumulate');
    assert.ok(acc);
    assert.strictEqual(acc.header, '<numeric>');
    assert.ok(acc.complexity?.time);

    const iotaDoc = findStlDocumentation('std::iota');
    assert.ok(iotaDoc);
    assert.strictEqual(iotaDoc.header, '<numeric>');

    const red = findStlDocumentation('std::reduce');
    assert.ok(red);
    assert.strictEqual(red.header, '<numeric>');

    const numericEntries = getStlEntriesByHeader('<numeric>');
    assert.ok(numericEntries.length >= 10);

    // <bit>
    const bitCast = findStlDocumentation('std::bit_cast');
    assert.ok(bitCast);
    assert.strictEqual(bitCast.header, '<bit>');
    assert.strictEqual(bitCast.standard, 'C++20');

    const popcount = findStlDocumentation('std::popcount');
    assert.ok(popcount);
    assert.strictEqual(popcount.header, '<bit>');

    const endianDoc = findStlDocumentation('std::endian');
    assert.ok(endianDoc);
    assert.strictEqual(endianDoc.header, '<bit>');

    const bitEntries = getStlEntriesByHeader('<bit>');
    assert.ok(bitEntries.length >= 10);

    // <random>
    const mt = findStlDocumentation('std::mt19937');
    assert.ok(mt);
    assert.strictEqual(mt.header, '<random>');

    const dist = findStlDocumentation('std::uniform_int_distribution');
    assert.ok(dist);
    assert.strictEqual(dist.header, '<random>');

    const rd = findStlDocumentation('std::random_device');
    assert.ok(rd);
    assert.strictEqual(rd.header, '<random>');

    const randomEntries = getStlEntriesByHeader('<random>');
    assert.ok(randomEntries.length >= 7);
  });

  it('should resolve newly added C Standard Library functions and their bare names', () => {
    // cmath
    const cbrtDoc = findStlDocumentation('cbrt');
    assert.ok(cbrtDoc);
    assert.strictEqual(cbrtDoc.symbol, 'std::cbrt');

    const lerpDoc = findStlDocumentation('std::lerp');
    assert.ok(lerpDoc);
    assert.strictEqual(lerpDoc.standard, 'C++20');

    // cstdlib
    const qsortDoc = findStlDocumentation('qsort');
    assert.ok(qsortDoc);
    assert.strictEqual(qsortDoc.symbol, 'std::qsort');

    const strtollDoc = findStlDocumentation('strtoll');
    assert.ok(strtollDoc);
    assert.strictEqual(strtollDoc.symbol, 'std::strtoll');

    // cstring
    const strrchrDoc = findStlDocumentation('strrchr');
    assert.ok(strrchrDoc);
    assert.strictEqual(strrchrDoc.symbol, 'std::strrchr');

    const strerrorDoc = findStlDocumentation('strerror');
    assert.ok(strerrorDoc);
    assert.strictEqual(strerrorDoc.symbol, 'std::strerror');
  });

  it('should resolve modern utility expansions, C++20 concepts, and type traits', () => {
    // Utility expansions
    const pairDoc = findStlDocumentation('std::pair');
    assert.ok(pairDoc);
    assert.strictEqual(pairDoc.header, '<utility>');

    const fwdLike = findStlDocumentation('std::forward_like');
    assert.ok(fwdLike);
    assert.strictEqual(fwdLike.standard, 'C++23');

    const toUnderlying = findStlDocumentation('std::to_underlying');
    assert.ok(toUnderlying);
    assert.strictEqual(toUnderlying.standard, 'C++23');

    const inRange = findStlDocumentation('std::in_range');
    assert.ok(inRange);
    assert.strictEqual(inRange.standard, 'C++20');

    const cmpEq = findStlDocumentation('std::cmp_equal');
    assert.ok(cmpEq);
    assert.strictEqual(cmpEq.standard, 'C++20');

    const applyDoc = findStlDocumentation('std::apply');
    assert.ok(applyDoc);
    assert.strictEqual(applyDoc.header, '<tuple>');

    const valOr = findStlDocumentation('value_or', 'std::optional<int>');
    assert.ok(valOr);
    assert.strictEqual(valOr.symbol, 'std::optional::value_or');

    const anyDoc = findStlDocumentation('std::any');
    assert.ok(anyDoc);
    assert.strictEqual(anyDoc.header, '<any>');

    // Concepts
    const sameAsDoc = findStlDocumentation('std::same_as');
    assert.ok(sameAsDoc);
    assert.strictEqual(sameAsDoc.header, '<concepts>');
    assert.strictEqual(sameAsDoc.standard, 'C++20');

    const derivedFromDoc = findStlDocumentation('std::derived_from');
    assert.ok(derivedFromDoc);
    assert.strictEqual(derivedFromDoc.header, '<concepts>');

    const integralDoc = findStlDocumentation('std::integral');
    assert.ok(integralDoc);
    assert.strictEqual(integralDoc.header, '<concepts>');

    const invocableDoc = findStlDocumentation('std::invocable');
    assert.ok(invocableDoc);
    assert.strictEqual(invocableDoc.header, '<concepts>');

    const conceptsEntries = getStlEntriesByHeader('<concepts>');
    assert.ok(conceptsEntries.length >= 20);

    // Type traits
    const isSameVDoc = findStlDocumentation('std::is_same_v');
    assert.ok(isSameVDoc);
    assert.strictEqual(isSameVDoc.header, '<type_traits>');

    const removeCvrefDoc = findStlDocumentation('std::remove_cvref_t');
    assert.ok(removeCvrefDoc);
    assert.strictEqual(removeCvrefDoc.standard, 'C++20');

    const enableIfDoc = findStlDocumentation('std::enable_if_t');
    assert.ok(enableIfDoc);
    assert.strictEqual(enableIfDoc.header, '<type_traits>');

    const typeTraitsEntries = getStlEntriesByHeader('<type_traits>');
    assert.ok(typeTraitsEntries.length >= 10);
  });

  it('should resolve algorithms entries (<algorithm>)', () => {
    // Non-modifying
    const allOfDoc = findStlDocumentation('std::all_of');
    assert.ok(allOfDoc);
    assert.strictEqual(allOfDoc.header, '<algorithm>');

    const countIfDoc = findStlDocumentation('std::count_if');
    assert.ok(countIfDoc);
    assert.strictEqual(countIfDoc.header, '<algorithm>');

    const adjFindDoc = findStlDocumentation('std::adjacent_find');
    assert.ok(adjFindDoc);
    assert.strictEqual(adjFindDoc.header, '<algorithm>');

    // Modifying
    const copyDoc = findStlDocumentation('std::copy');
    assert.ok(copyDoc);
    assert.strictEqual(copyDoc.header, '<algorithm>');

    const moveAlgoDoc = findStlDocumentation('std::move (algorithm)');
    assert.ok(moveAlgoDoc);
    assert.strictEqual(moveAlgoDoc.header, '<algorithm>');

    const rangesMoveDoc = findStlDocumentation('std::ranges::move');
    assert.ok(rangesMoveDoc);
    assert.strictEqual(rangesMoveDoc.header, '<algorithm>');

    const shuffleDoc = findStlDocumentation('std::shuffle');
    assert.ok(shuffleDoc);
    assert.strictEqual(shuffleDoc.standard, 'C++11');

    const uniqueDoc = findStlDocumentation('std::unique');
    assert.ok(uniqueDoc);
    assert.strictEqual(uniqueDoc.header, '<algorithm>');

    // Partitioning & Sorting
    const partDoc = findStlDocumentation('std::partition');
    assert.ok(partDoc);
    assert.strictEqual(partDoc.header, '<algorithm>');

    const stableSortDoc = findStlDocumentation('std::stable_sort');
    assert.ok(stableSortDoc);
    assert.strictEqual(stableSortDoc.header, '<algorithm>');

    const nthDoc = findStlDocumentation('std::nth_element');
    assert.ok(nthDoc);
    assert.strictEqual(nthDoc.header, '<algorithm>');

    const unionDoc = findStlDocumentation('std::set_union');
    assert.ok(unionDoc);
    assert.strictEqual(unionDoc.header, '<algorithm>');

    // Heap & Min/Max
    const makeHeapDoc = findStlDocumentation('std::make_heap');
    assert.ok(makeHeapDoc);
    assert.strictEqual(makeHeapDoc.header, '<algorithm>');

    const minElemDoc = findStlDocumentation('std::min_element');
    assert.ok(minElemDoc);
    assert.strictEqual(minElemDoc.header, '<algorithm>');

    const algoEntries = getStlEntriesByHeader('<algorithm>');
    assert.ok(algoEntries.length >= 35);
  });

  it('should resolve iterators entries (<iterator>)', () => {
    const beginDoc = findStlDocumentation('std::begin');
    assert.ok(beginDoc);
    assert.strictEqual(beginDoc.header, '<iterator>');

    const endDoc = findStlDocumentation('std::end');
    assert.ok(endDoc);
    assert.strictEqual(endDoc.header, '<iterator>');

    const sizeDoc = findStlDocumentation('std::size');
    assert.ok(sizeDoc);
    assert.strictEqual(sizeDoc.header, '<iterator>');
    assert.strictEqual(sizeDoc.standard, 'C++17');

    const ssizeDoc = findStlDocumentation('std::ssize');
    assert.ok(ssizeDoc);
    assert.strictEqual(ssizeDoc.header, '<iterator>');
    assert.strictEqual(ssizeDoc.standard, 'C++20');

    const advanceDoc = findStlDocumentation('std::advance');
    assert.ok(advanceDoc);
    assert.strictEqual(advanceDoc.header, '<iterator>');

    const distanceDoc = findStlDocumentation('std::distance');
    assert.ok(distanceDoc);
    assert.strictEqual(distanceDoc.header, '<iterator>');

    const backInserterDoc = findStlDocumentation('std::back_inserter');
    assert.ok(backInserterDoc);
    assert.strictEqual(backInserterDoc.header, '<iterator>');

    const revIterDoc = findStlDocumentation('std::reverse_iterator');
    assert.ok(revIterDoc);
    assert.strictEqual(revIterDoc.header, '<iterator>');

    const iterEntries = getStlEntriesByHeader('<iterator>');
    assert.strictEqual(iterEntries.length, 18);
  });

  it('should resolve ranges entries (<ranges>)', () => {
    const allDoc = findStlDocumentation('std::views::all');
    assert.ok(allDoc);
    assert.strictEqual(allDoc.header, '<ranges>');
    assert.strictEqual(allDoc.standard, 'C++20');

    const filterDoc = findStlDocumentation('std::views::filter');
    assert.ok(filterDoc);
    assert.strictEqual(filterDoc.header, '<ranges>');

    const transformDoc = findStlDocumentation('std::views::transform');
    assert.ok(transformDoc);
    assert.strictEqual(transformDoc.header, '<ranges>');

    const takeDoc = findStlDocumentation('std::views::take');
    assert.ok(takeDoc);
    assert.strictEqual(takeDoc.header, '<ranges>');

    const joinDoc = findStlDocumentation('std::views::join');
    assert.ok(joinDoc);
    assert.strictEqual(joinDoc.header, '<ranges>');

    const keysDoc = findStlDocumentation('std::views::keys');
    assert.ok(keysDoc);
    assert.strictEqual(keysDoc.header, '<ranges>');

    const toDoc = findStlDocumentation('std::ranges::to');
    assert.ok(toDoc);
    assert.strictEqual(toDoc.header, '<ranges>');
    assert.strictEqual(toDoc.standard, 'C++23');

    const rangesEntries = getStlEntriesByHeader('<ranges>');
    assert.strictEqual(rangesEntries.length, 13);
  });

  it('should resolve concurrency entries across headers (<thread>, <mutex>, <shared_mutex>, <condition_variable>, <future>, <atomic>)', () => {
    // Mutexes and locks
    const timedMutex = findStlDocumentation('std::timed_mutex');
    assert.ok(timedMutex);
    assert.strictEqual(timedMutex.header, '<mutex>');

    const recMutex = findStlDocumentation('std::recursive_mutex');
    assert.ok(recMutex);

    const sharedMutex = findStlDocumentation('std::shared_mutex');
    assert.ok(sharedMutex);
    assert.strictEqual(sharedMutex.header, '<shared_mutex>');

    const sharedLock = findStlDocumentation('std::shared_lock');
    assert.ok(sharedLock);
    assert.strictEqual(sharedLock.header, '<shared_mutex>');

    const uniqueLock = findStlDocumentation('std::unique_lock');
    assert.ok(uniqueLock);
    assert.strictEqual(uniqueLock.header, '<mutex>');

    const callOnce = findStlDocumentation('std::call_once');
    assert.ok(callOnce);

    const onceFlag = findStlDocumentation('std::once_flag');
    assert.ok(onceFlag);

    // Condition variables
    const cv = findStlDocumentation('std::condition_variable');
    assert.ok(cv);
    assert.strictEqual(cv.header, '<condition_variable>');

    const cvAny = findStlDocumentation('std::condition_variable_any');
    assert.ok(cvAny);
    assert.strictEqual(cvAny.header, '<condition_variable>');

    // Futures and async
    const asyncDoc = findStlDocumentation('std::async');
    assert.ok(asyncDoc);
    assert.strictEqual(asyncDoc.header, '<future>');

    const fut = findStlDocumentation('std::future');
    assert.ok(fut);
    assert.strictEqual(fut.header, '<future>');

    const sharedFut = findStlDocumentation('std::shared_future');
    assert.ok(sharedFut);

    const promiseDoc = findStlDocumentation('std::promise');
    assert.ok(promiseDoc);

    const packagedTask = findStlDocumentation('std::packaged_task');
    assert.ok(packagedTask);

    // this_thread
    const getId = findStlDocumentation('std::this_thread::get_id');
    assert.ok(getId);
    assert.strictEqual(getId.header, '<thread>');

    const yieldDoc = findStlDocumentation('std::this_thread::yield');
    assert.ok(yieldDoc);

    const sleepFor = findStlDocumentation('std::this_thread::sleep_for');
    assert.ok(sleepFor);

    const sleepUntil = findStlDocumentation('std::this_thread::sleep_until');
    assert.ok(sleepUntil);

    // Atomics
    const atomicRef = findStlDocumentation('std::atomic_ref');
    assert.ok(atomicRef);
    assert.strictEqual(atomicRef.header, '<atomic>');
    assert.strictEqual(atomicRef.standard, 'C++20');

    const atomicFlag = findStlDocumentation('std::atomic_flag');
    assert.ok(atomicFlag);

    const memOrder = findStlDocumentation('std::memory_order');
    assert.ok(memOrder);
  });

  it('should resolve filesystem entries (<filesystem>)', () => {
    const copyDoc = findStlDocumentation('std::filesystem::copy');
    assert.ok(copyDoc);
    assert.strictEqual(copyDoc.header, '<filesystem>');

    const copyFile = findStlDocumentation('std::filesystem::copy_file');
    assert.ok(copyFile);

    const removeDoc = findStlDocumentation('std::filesystem::remove');
    assert.ok(removeDoc);

    const removeAll = findStlDocumentation('std::filesystem::remove_all');
    assert.ok(removeAll);

    const fileSize = findStlDocumentation('std::filesystem::file_size');
    assert.ok(fileSize);

    const lastWrite = findStlDocumentation('std::filesystem::last_write_time');
    assert.ok(lastWrite);

    const perms = findStlDocumentation('std::filesystem::permissions');
    assert.ok(perms);

    const spaceDoc = findStlDocumentation('std::filesystem::space');
    assert.ok(spaceDoc);

    const isDir = findStlDocumentation('std::filesystem::is_directory');
    assert.ok(isDir);

    const isReg = findStlDocumentation('std::filesystem::is_regular_file');
    assert.ok(isReg);

    const recDirIter = findStlDocumentation('std::filesystem::recursive_directory_iterator');
    assert.ok(recDirIter);
    assert.strictEqual(recDirIter.header, '<filesystem>');

    const fsEntries = getStlEntriesByHeader('<filesystem>');
    assert.ok(fsEntries.length >= 12);
  });

  it('should resolve chrono entries (<chrono>)', () => {
    const tp = findStlDocumentation('std::chrono::time_point');
    assert.ok(tp);
    assert.strictEqual(tp.header, '<chrono>');

    const sysClk = findStlDocumentation('std::chrono::system_clock');
    assert.ok(sysClk);

    const steadyClk = findStlDocumentation('std::chrono::steady_clock');
    assert.ok(steadyClk);

    const highResClk = findStlDocumentation('std::chrono::high_resolution_clock');
    assert.ok(highResClk);

    const utcClk = findStlDocumentation('std::chrono::utc_clock');
    assert.ok(utcClk);
    assert.strictEqual(utcClk.standard, 'C++20');

    const durCast = findStlDocumentation('std::chrono::duration_cast');
    assert.ok(durCast);

    const tpCast = findStlDocumentation('std::chrono::time_point_cast');
    assert.ok(tpCast);

    const zonedTime = findStlDocumentation('std::chrono::zoned_time');
    assert.ok(zonedTime);
    assert.strictEqual(zonedTime.standard, 'C++20');

    const ymd = findStlDocumentation('std::chrono::year_month_day');
    assert.ok(ymd);
    assert.strictEqual(ymd.standard, 'C++20');

    const chronoEntries = getStlEntriesByHeader('<chrono>');
    assert.ok(chronoEntries.length >= 10);
  });

  it('should resolve coroutines entries (<coroutine>)', () => {
    const coroHandle = findStlDocumentation('std::coroutine_handle');
    assert.ok(coroHandle);
    assert.strictEqual(coroHandle.header, '<coroutine>');
    assert.strictEqual(coroHandle.standard, 'C++20');

    const suspAlways = findStlDocumentation('std::suspend_always');
    assert.ok(suspAlways);
    assert.strictEqual(suspAlways.header, '<coroutine>');

    const suspNever = findStlDocumentation('std::suspend_never');
    assert.ok(suspNever);

    const noopCoro = findStlDocumentation('std::noop_coroutine');
    assert.ok(noopCoro);

    const coroEntries = getStlEntriesByHeader('<coroutine>');
    assert.strictEqual(coroEntries.length, 4);
  });
});
