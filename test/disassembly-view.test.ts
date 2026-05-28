import './vscode-mock';
import * as assert from 'assert';
import { CompilerInfo } from '../src/prober/compiler-detector';
import { buildDisassemblyArgs, filterAssembly, DisassemblyContentProvider } from '../src/compiler/disassembly-view';

describe('Compiler Explorer & Inline Disassembly View', () => {
  describe('buildDisassemblyArgs', () => {
    it('should build GCC / Clang disassembly arguments with Intel syntax and optimization flag', () => {
      const gcc: CompilerInfo = {
        name: 'GCC 14',
        type: 'gcc',
        path: '/usr/bin/g++'
      };

      const result = buildDisassemblyArgs(gcc, 'main.cpp', 'main.s', {
        optimizationLevel: 'O3',
        intelSyntax: true,
        demangle: true,
        filterDirectives: true
      });

      assert.strictEqual(result.command, '/usr/bin/g++');
      assert.ok(result.args.includes('-S'));
      assert.ok(result.args.includes('-O3'));
      assert.ok(result.args.includes('-masm=intel'));
      assert.ok(result.args.includes('main.cpp'));
      assert.ok(result.args.includes('main.s'));
    });

    it('should build MSVC arguments with /FA and /Fa', () => {
      const msvc: CompilerInfo = {
        name: 'MSVC 19',
        type: 'msvc',
        path: 'C:\\Program Files\\MSVC\\cl.exe'
      };

      const result = buildDisassemblyArgs(msvc, 'F:\\test.cpp', 'F:\\test.asm', {
        optimizationLevel: 'O2',
        intelSyntax: true,
        demangle: true,
        filterDirectives: true
      });

      assert.strictEqual(result.command, 'C:\\Program Files\\MSVC\\cl.exe');
      assert.ok(result.args.includes('/c'));
      assert.ok(result.args.includes('/FA'));
      assert.ok(result.args.includes('/FaF:\\test.asm'));
      assert.ok(result.args.includes('/O2'));
    });
  });

  describe('filterAssembly', () => {
    it('should strip .cfi directives, debug metadata, and keep machine instructions', () => {
      const rawAsm = `
	.file	"test.cpp"
	.text
	.globl	main
main:
	.cfi_startproc
	.seh_proc	main
	mov	eax, 42
	.cfi_def_cfa_offset 16
	add	eax, 10
	ret
	.cfi_endproc
	.ident	"GCC: (Rev2) 14.2.0"
`;

      const clean = filterAssembly(rawAsm, { filterDirectives: true });
      assert.ok(clean.includes('mov	eax, 42'));
      assert.ok(clean.includes('add	eax, 10'));
      assert.ok(clean.includes('ret'));
      assert.strictEqual(clean.includes('.cfi_startproc'), false);
      assert.strictEqual(clean.includes('.seh_proc'), false);
      assert.strictEqual(clean.includes('.file'), false);
      assert.strictEqual(clean.includes('.ident'), false);
    });
  });

  describe('DisassemblyContentProvider', () => {
    it('should initialize and register novacpp-disasm scheme', () => {
      const mockDetector = {
        getPreferredCompiler: async () => null
      } as any;

      const provider = new DisassemblyContentProvider(mockDetector);
      assert.strictEqual(DisassemblyContentProvider.scheme, 'novacpp-disasm');
      provider.dispose();
    });
  });
});
