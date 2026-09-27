import * as assert from 'assert';
import { getPathIdentity } from '../src/platform/path-identity';

describe('Host Path Identity', () => {
  it('should preserve case for POSIX paths', () => {
    assert.notStrictEqual(
      getPathIdentity('/workspace/Foo.cpp', 'linux'),
      getPathIdentity('/workspace/foo.cpp', 'linux')
    );
  });

  it('should normalize case for Windows paths', () => {
    assert.strictEqual(
      getPathIdentity('C:\\Workspace\\Foo.cpp', 'win32'),
      getPathIdentity('c:\\workspace\\foo.cpp', 'win32')
    );
  });
});
