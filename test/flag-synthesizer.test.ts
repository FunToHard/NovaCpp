import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { CompilerDetector, CompilerInfo } from '../src/prober/compiler-detector';
import { SystemIncludeExtractor } from '../src/prober/system-includes';
import { FlagSynthesizer } from '../src/prober/flag-synthesizer';

describe('Compiler Prober & Flags Synthesizer', () => {
  const detector = new CompilerDetector();
  const extractor = new SystemIncludeExtractor();
  const synthesizer = new FlagSynthesizer(detector, extractor);

  describe('Compiler Discovery', () => {
    it('should detect installed compilers on the system', async () => {
      const compilers = await detector.detectAllCompilers();
      assert.ok(compilers.length > 0, 'Should find at least one compiler');
      const compilerNames = compilers.map((c) => c.name);
      console.log('    Found compilers:', compilerNames);

      // Verify each compiler has a valid file path
      for (const c of compilers) {
        if (!c.path.startsWith('wsl.exe')) {
          assert.ok(fs.existsSync(c.path), `Compiler executable must exist: ${c.path}`);
        }
      }
    });

    it('should select a valid preferred compiler', async () => {
      const preferred = await detector.getPreferredCompiler();
      assert.ok(preferred !== null, 'Preferred compiler must not be null');
      console.log('    Preferred compiler:', preferred.name, preferred.path);
      assert.ok(preferred.type === 'msvc' || preferred.type === 'gcc' || preferred.type === 'clang');
    });
  });

  describe('System Include Extraction', () => {
    it('should parse GCC/Clang search list correctly', () => {
      const sampleStderr = `
ignoring duplicate directory "C:/some/dup"
#include <...> search starts here:
 ${path.resolve('.')}
End of search list.
# 0 "<stdin>"
`;
      const parsed = extractor.parseSearchList(sampleStderr);
      assert.strictEqual(parsed.length, 1);
      assert.strictEqual(parsed[0], path.resolve('.'));
    });

    it('should extract valid system includes for detected compiler', async () => {
      const preferred = await detector.getPreferredCompiler();
      if (preferred) {
        const includes = await extractor.extractSystemIncludes(preferred);
        console.log(`    Extracted ${includes.length} include directories for ${preferred.name}`);
        assert.ok(includes.length > 0, 'Should extract at least one system include path');
        for (const inc of includes) {
          assert.ok(fs.existsSync(inc), `Include path must exist: ${inc}`);
        }
      }
    });
  });

  describe('Flag Synthesis & compile_flags.txt Generation', () => {
    it('should synthesize standard flags for GCC/Clang compilers', async () => {
      const dummyGcc: CompilerInfo = {
        name: 'GCC Test',
        type: 'gcc',
        path: 'gcc'
      };

      // Mock extractor to return a known include path
      const mockExtractor = new SystemIncludeExtractor();
      mockExtractor.extractSystemIncludes = async () => ['C:/dummy/include'];

      const synth = new FlagSynthesizer(detector, mockExtractor);
      const flags = await synth.generateFlags(dummyGcc, { standard: 'c++20' });

      assert.ok(flags.includes('-xc++'));
      assert.ok(flags.includes('-std=c++20'));
      assert.ok(flags.includes('-Wall'));
      assert.ok(flags.includes('-IC:/dummy/include'));
    });

    it('should synthesize MSVC driver mode flags for MSVC compilers', async () => {
      const dummyMsvc: CompilerInfo = {
        name: 'MSVC Test',
        type: 'msvc',
        path: 'cl.exe'
      };

      const mockExtractor = new SystemIncludeExtractor();
      mockExtractor.extractSystemIncludes = async () => ['C:/msvc/include'];

      const synth = new FlagSynthesizer(detector, mockExtractor);
      const flags = await synth.generateFlags(dummyMsvc, { standard: 'c++20' });

      assert.ok(flags.includes('--driver-mode=cl'));
      assert.ok(flags.includes('-std:c++20'));
      assert.ok(flags.includes('/EHsc'));
      assert.ok(flags.includes('/TP'));
      assert.ok(flags.includes('-IC:/msvc/include'));
    });

    it('should write compile_flags.txt in target directory when missing compilation db', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-test-'));
      try {
        assert.strictEqual(synthesizer.hasCompilationDatabase(tmpDir), false);

        const generatedPath = await synthesizer.synthesizeFlagsFile(tmpDir, { standard: 'c++20' });
        assert.ok(generatedPath !== null);
        assert.ok(fs.existsSync(generatedPath));

        const content = fs.readFileSync(generatedPath, 'utf8');
        assert.ok(content.includes('c++20'));
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });

    it('should respect existing compile_commands.json', async () => {
      const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-test-'));
      try {
        fs.writeFileSync(path.join(tmpDir, 'compile_commands.json'), '[]', 'utf8');
        assert.strictEqual(synthesizer.hasCompilationDatabase(tmpDir), true);

        const result = await synthesizer.synthesizeFlagsFile(tmpDir);
        assert.strictEqual(result, null);
      } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true });
      }
    });
  });
});
