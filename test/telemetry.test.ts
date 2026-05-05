import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import { isAllowedStlSymbol, extractStlSymbolKey } from '../src/telemetry/allowlist';
import { StlRankingTable, DEFAULT_STL_EMPIRICAL_WEIGHTS } from '../src/telemetry/ranking-table';
import { StlUsageCollector } from '../src/telemetry/stl-collector';
import { BatchDispatcher } from '../src/telemetry/batch-dispatcher';

describe('STL Usage Telemetry & Adaptive Ranking Subsystem', () => {
  describe('Allowlist & Privacy Guardrails (allowlist.ts)', () => {
    it('should approve legitimate ISO C++ standard library symbol prefixes', () => {
      assert.strictEqual(isAllowedStlSymbol('std::vector::push_back'), true);
      assert.strictEqual(isAllowedStlSymbol('std::ranges::sort'), true);
      assert.strictEqual(isAllowedStlSymbol('std::views::filter'), true);
      assert.strictEqual(isAllowedStlSymbol('std::chrono::system_clock'), true);
      assert.strictEqual(isAllowedStlSymbol('std::filesystem::path'), true);
      assert.strictEqual(isAllowedStlSymbol('std::this_thread::sleep_for'), true);
      assert.strictEqual(isAllowedStlSymbol('std::make_unique'), true);
    });

    it('should strictly reject user code, third-party libraries, and arbitrary identifiers', () => {
      assert.strictEqual(isAllowedStlSymbol('my_custom_function'), false);
      assert.strictEqual(isAllowedStlSymbol('Entity::render'), false);
      assert.strictEqual(isAllowedStlSymbol('Shape3D::volume'), false);
      assert.strictEqual(isAllowedStlSymbol('Dummy::getValue'), false);
      assert.strictEqual(isAllowedStlSymbol('boost::shared_ptr'), false);
      assert.strictEqual(isAllowedStlSymbol('fmt::print'), false);
      assert.strictEqual(isAllowedStlSymbol(''), false);
    });

    it('should extract canonical STL key from fully-qualified completion items', () => {
      const item: vscode.CompletionItem = {
        label: 'std::format'
      };
      assert.strictEqual(extractStlSymbolKey(item), 'std::format');
    });

    it('should extract canonical STL key from container method completion items with detail', () => {
      const item: vscode.CompletionItem = {
        label: 'push_back',
        detail: 'void std::vector<int>::push_back(const int& val)'
      };
      assert.strictEqual(extractStlSymbolKey(item), 'std::vector::push_back');
    });

    it('should return null when completion item belongs to non-STL user types', () => {
      const item: vscode.CompletionItem = {
        label: 'getValue',
        detail: 'int Dummy::getValue() const'
      };
      assert.strictEqual(extractStlSymbolKey(item), null);
    });
  });

  describe('Empirical Ranking Table (ranking-table.ts)', () => {
    const rankingTable = new StlRankingTable();

    it('should contain high empirical weights for frequent STL functions', () => {
      assert.ok((rankingTable.getWeight('std::vector::push_back') ?? 0) >= 0.95);
      assert.ok((rankingTable.getWeight('std::string::substr') ?? 0) >= 0.90);
      assert.ok((rankingTable.getWeight('std::make_unique') ?? 0) >= 0.95);
      assert.ok((rankingTable.getWeight('std::format') ?? 0) >= 0.90);
    });

    it('should boost high-frequency STL completion items by prefixing sortText with low numerical bucket', () => {
      const item: vscode.CompletionItem = {
        label: 'push_back',
        detail: 'void std::vector<int>::push_back(const int& val)',
        sortText: '3f800000push_back'
      };

      const ranked = rankingTable.applyStlRanking(item);
      assert.strictEqual(ranked, true);
      assert.ok(item.sortText?.startsWith('0_002_'));
    });

    it('should not boost rare STL methods with weights below threshold', () => {
      const item: vscode.CompletionItem = {
        label: 'get_allocator',
        detail: 'allocator_type std::vector<int>::get_allocator() const',
        sortText: '3f800000get_allocator'
      };

      const ranked = rankingTable.applyStlRanking(item);
      assert.strictEqual(ranked, false);
      assert.strictEqual(item.sortText, '3f800000get_allocator');
    });

    it('should not alter sortText for non-STL completion items', () => {
      const item: vscode.CompletionItem = {
        label: 'render',
        detail: 'void Entity::render() const',
        sortText: '3f800000render'
      };

      const ranked = rankingTable.applyStlRanking(item);
      assert.strictEqual(ranked, false);
      assert.strictEqual(item.sortText, '3f800000render');
    });

    it('should allow dynamic weight updates from server telemetry models', () => {
      const customTable = new StlRankingTable();
      customTable.updateWeights({
        'std::vector::shrink_to_fit': 0.99
      });
      assert.strictEqual(customTable.getWeight('std::vector::shrink_to_fit'), 0.99);

      const item: vscode.CompletionItem = {
        label: 'shrink_to_fit',
        detail: 'void std::vector<int>::shrink_to_fit()',
        sortText: '3f800000shrink_to_fit'
      };
      const ranked = customTable.applyStlRanking(item);
      assert.strictEqual(ranked, true);
      assert.ok(item.sortText?.startsWith('0_001_'));
    });
  });

  describe('In-Memory Usage Collector (stl-collector.ts)', () => {
    let collector: StlUsageCollector;

    beforeEach(() => {
      collector = new StlUsageCollector();
    });

    it('should record accepted STL completion items and increment counters', () => {
      const item: vscode.CompletionItem = {
        label: 'push_back',
        detail: 'void std::vector<int>::push_back(const int&)'
      };

      assert.strictEqual(collector.recordCompletionAccepted(item), true);
      assert.strictEqual(collector.recordCompletionAccepted(item), true);

      const counts = collector.getPendingCounts();
      assert.strictEqual(counts['std::vector::push_back'], 2);
    });

    it('should ignore non-STL completion items completely', () => {
      const item: vscode.CompletionItem = {
        label: 'getValue',
        detail: 'int Dummy::getValue()'
      };

      assert.strictEqual(collector.recordCompletionAccepted(item), false);
      assert.strictEqual(collector.size(), 0);
    });

    it('should record AST function calls if they match approved STL prefixes', () => {
      assert.strictEqual(collector.recordAstCall('std::ranges::sort'), true);
      assert.strictEqual(collector.recordAstCall('std::make_unique'), true);
      assert.strictEqual(collector.recordAstCall('custom_func'), false);

      const counts = collector.getPendingCounts();
      assert.strictEqual(counts['std::ranges::sort'], 1);
      assert.strictEqual(counts['std::make_unique'], 1);
      assert.strictEqual(counts['custom_func'], undefined);
    });

    it('should apply k-anonymity filtering when flushing counts', () => {
      // Add 4 calls for push_back (>= 3)
      for (let i = 0; i < 4; i++) {
        collector.recordAstCall('std::vector::push_back');
      }
      // Add only 1 call for rare_func (< 3)
      collector.recordAstCall('std::pmr::polymorphic_allocator');

      // Flush with k=3
      const flushed = collector.flushCounts(3);

      // push_back preserved, rare_func discarded
      assert.strictEqual(flushed['std::vector::push_back'], 4);
      assert.strictEqual(flushed['std::pmr::polymorphic_allocator'], undefined);

      // Buffer must be empty after flush
      assert.strictEqual(collector.size(), 0);
    });
  });

  describe('Batch Dispatcher & Offline Queue (batch-dispatcher.ts)', () => {
    let tmpDir: string;
    let collector: StlUsageCollector;
    let dispatcher: BatchDispatcher;

    beforeEach(() => {
      tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-telemetry-'));
      collector = new StlUsageCollector();
      dispatcher = new BatchDispatcher(
        collector,
        tmpDir,
        'http://127.0.0.1:9999/v1/telemetry/stl-usage', // intentionally unreachable for offline test
        60000
      );
    });

    afterEach(() => {
      dispatcher.dispose();
      fs.rmSync(tmpDir, { recursive: true, force: true });
    });

    it('should save unreached telemetry batches to offline queue file', async () => {
      // Simulate 5 calls to std::format
      for (let i = 0; i < 5; i++) {
        collector.recordAstCall('std::format');
      }

      const flushed = await dispatcher.flushNow(3);
      // Since endpoint is unreachable, transmission fails and queues to disk
      assert.strictEqual(flushed, false);

      const queuePath = path.join(tmpDir, 'telemetry-queue.json');
      assert.ok(fs.existsSync(queuePath), 'Offline queue file must exist');

      const content = fs.readFileSync(queuePath, 'utf8');
      const data = JSON.parse(content);
      assert.ok(Array.isArray(data));
      assert.strictEqual(data.length, 1);
      assert.strictEqual(data[0].events[0].symbol, 'std::format');
      assert.strictEqual(data[0].events[0].count, 5);
    });
  });
});
