import './vscode-mock';
import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as vscode from 'vscode';
import { StlRemoteProvider } from '../src/intelligence/stl-remote-provider';
import { findStlDocumentationAsync, StlDocEntry } from '../src/intelligence/stl-knowledge-base';
import { HoverTransformer } from '../src/intelligence/hover-transformer';

describe('StlRemoteProvider & Asynchronous STL/System IntelliSense', () => {
  const provider = StlRemoteProvider.getInstance();

  it('should resolve built-in offline Win32 system headers', () => {
    const createFile = provider.lookupSync('CreateFileW');
    assert.ok(createFile);
    assert.strictEqual(createFile.symbol, 'CreateFileW');
    assert.strictEqual(createFile.header, '<windows.h>');
    assert.strictEqual(createFile.standard, 'Win32 API');
    assert.ok(createFile.parameters['lpFileName']);
    assert.ok(createFile.parameters['dwDesiredAccess']);
    assert.ok(createFile.example?.includes('CreateFileW'));

    const closeHandle = provider.lookupSync('CloseHandle');
    assert.ok(closeHandle);
    assert.strictEqual(closeHandle.header, '<windows.h>');

    const getLastError = provider.lookupSync('GetLastError');
    assert.ok(getLastError);
    assert.strictEqual(getLastError.header, '<windows.h>');
  });

  it('should resolve built-in offline POSIX system headers', () => {
    const forkDoc = provider.lookupSync('fork');
    assert.ok(forkDoc);
    assert.strictEqual(forkDoc.symbol, 'fork');
    assert.strictEqual(forkDoc.header, '<unistd.h>');

    const pthreadCreate = provider.lookupSync('pthread_create');
    assert.ok(pthreadCreate);
    assert.strictEqual(pthreadCreate.header, '<pthread.h>');
    assert.ok(pthreadCreate.parameters['start_routine']);
  });

  it('should read from and write to local disk cache', async () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cpp_pro_stl_cache_test_'));
    try {
      provider.setCacheDirectory(tempDir);

      const customEntry: StlDocEntry = {
        symbol: 'epoll_create1',
        canonicalSignature: 'int epoll_create1(int flags);',
        summary: 'Creates a new epoll file descriptor.',
        header: '<sys/epoll.h>',
        standard: 'Linux kernel 2.6.27',
        parameters: { flags: 'Zero or EPOLL_CLOEXEC' },
        returns: 'File descriptor or -1 on error',
        docUrl: 'https://man7.org/linux/man-pages/man2/epoll_create1.2.html',
        complexity: { time: 'O(1)' }
      };

      // Write directly to disk cache
      const filePath = path.join(tempDir, 'epoll_create1.json');
      fs.writeFileSync(filePath, JSON.stringify(customEntry, null, 2), 'utf-8');

      // Async lookup should retrieve from disk
      const resolved = await provider.lookup('epoll_create1');
      assert.ok(resolved);
      assert.strictEqual(resolved.symbol, 'epoll_create1');
      assert.strictEqual(resolved.header, '<sys/epoll.h>');
      assert.strictEqual(resolved.complexity?.time, 'O(1)');

      // Subsequent lookup should hit memory cache
      const memHit = provider.lookupSync('epoll_create1');
      assert.ok(memHit);
      assert.strictEqual(memHit.symbol, 'epoll_create1');
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('should findStlDocumentationAsync for both ISO C++ and system APIs', async () => {
    // 1. ISO C++ standard library
    const vecPush = await findStlDocumentationAsync('push_back', 'std::vector<int>');
    assert.ok(vecPush);
    assert.strictEqual(vecPush.symbol, 'std::vector::push_back');
    assert.strictEqual(vecPush.header, '<vector>');

    // 2. Win32 System API
    const winApi = await findStlDocumentationAsync('CreateFileW');
    assert.ok(winApi);
    assert.strictEqual(winApi.symbol, 'CreateFileW');
    assert.strictEqual(winApi.header, '<windows.h>');

    // 3. Unknown symbol
    const unknown = await findStlDocumentationAsync('non_existent_symbol_xyz');
    assert.strictEqual(unknown, null);
  });

  it('should enrich hover asynchronously with Win32 API documentation card', async () => {
    const rawCode = `\`\`\`c\nHANDLE CreateFileW(LPCWSTR lpFileName, DWORD dwDesiredAccess, DWORD dwShareMode, LPSECURITY_ATTRIBUTES lpSecurityAttributes, DWORD dwCreationDisposition, DWORD dwFlagsAndAttributes, HANDLE hTemplateFile)\n\`\`\``;

    const inputHover = new vscode.Hover([rawCode], new vscode.Range(0, 0, 0, 10));
    const transformed = await HoverTransformer.transformAsync(inputHover);

    assert.ok(transformed);
    const content = (transformed.contents[0] as vscode.MarkdownString).value;
    assert.ok(content.includes('### `CreateFileW` *(Standard Library)*'));
    assert.ok(content.includes('`[<windows.h>]`'));
    assert.ok(content.includes('`[Win32 API]`'));
    assert.ok(content.includes('Creates or opens a file, directory'));
    assert.ok(content.includes('| `lpFileName` |'));
    assert.ok(content.includes('An open handle to the specified file'));
    assert.ok(content.includes('#### Example'));
  });
});
