import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import {
  findCounterpartFile,
  prioritizeDefinitionLocations,
  isSystemHeader,
  getCppReferenceUrl
} from '../src/intelligence/smart-definition';

describe('Smart Definition & Navigation', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'novacpp-smart-def-'));
  });

  afterEach(() => {
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore
    }
  });

  describe('findCounterpartFile', () => {
    it('should find source file in the same directory for a header', () => {
      const headerPath = path.join(tempDir, 'entity.h');
      const sourcePath = path.join(tempDir, 'entity.cpp');
      fs.writeFileSync(headerPath, '// header');
      fs.writeFileSync(sourcePath, '// source');

      const found = findCounterpartFile(headerPath);
      assert.strictEqual(found, sourcePath);
    });

    it('should find header file in the same directory for a source file', () => {
      const headerPath = path.join(tempDir, 'player.hpp');
      const sourcePath = path.join(tempDir, 'player.cpp');
      fs.writeFileSync(headerPath, '// header');
      fs.writeFileSync(sourcePath, '// source');

      const found = findCounterpartFile(sourcePath);
      assert.strictEqual(found, headerPath);
    });

    it('should find source file in mirrored src/ directory when header is in include/', () => {
      const includeDir = path.join(tempDir, 'include');
      const srcDir = path.join(tempDir, 'src');
      fs.mkdirSync(includeDir, { recursive: true });
      fs.mkdirSync(srcDir, { recursive: true });

      const headerPath = path.join(includeDir, 'math.hpp');
      const sourcePath = path.join(srcDir, 'math.cpp');
      fs.writeFileSync(headerPath, '// header');
      fs.writeFileSync(sourcePath, '// source');

      const found = findCounterpartFile(headerPath, tempDir);
      assert.strictEqual(found, sourcePath);
    });

    it('should return null when no counterpart exists', () => {
      const orphanPath = path.join(tempDir, 'orphan.cpp');
      fs.writeFileSync(orphanPath, '// orphan');

      const found = findCounterpartFile(orphanPath);
      assert.strictEqual(found, null);
    });
  });

  describe('prioritizeDefinitionLocations', () => {
    it('should sort source locations ahead of header locations', () => {
      const locHeader = new vscode.Location(
        vscode.Uri.file('F:/project/include/entity.h'),
        new vscode.Position(10, 0)
      );
      const locSource = new vscode.Location(
        vscode.Uri.file('F:/project/src/entity.cpp'),
        new vscode.Position(42, 0)
      );

      const input = [locHeader, locSource];
      const sorted = prioritizeDefinitionLocations(input) as vscode.Location[];

      assert.strictEqual(sorted.length, 2);
      assert.strictEqual(sorted[0].uri.fsPath, locSource.uri.fsPath);
      assert.strictEqual(sorted[1].uri.fsPath, locHeader.uri.fsPath);
    });

    it('should return single location unchanged', () => {
      const singleLoc = new vscode.Location(
        vscode.Uri.file('F:/project/header.h'),
        new vscode.Position(0, 0)
      );
      const res = prioritizeDefinitionLocations(singleLoc);
      assert.strictEqual(res, singleLoc);
    });
  });

  describe('isSystemHeader', () => {
    it('should identify MSVC STL and Windows SDK headers as system files', () => {
      assert.strictEqual(
        isSystemHeader('C:/Program Files/Microsoft Visual Studio/18/Enterprise/VC/Tools/MSVC/14.51.36231/include/vector'),
        true
      );
      assert.strictEqual(
        isSystemHeader('C:/Program Files (x86)/Windows Kits/10/Include/10.0.26100.0/ucrt/stdio.h'),
        true
      );
    });

    it('should identify GCC/MinGW and Linux system headers as system files', () => {
      assert.strictEqual(
        isSystemHeader('C:/ProgramData/mingw64/include/c++/15.2.0/vector'),
        true
      );
      assert.strictEqual(isSystemHeader('/usr/include/stdio.h'), true);
    });

    it('should identify user project files as non-system headers', () => {
      assert.strictEqual(isSystemHeader('F:/project/src/main.cpp'), false);
      assert.strictEqual(isSystemHeader('F:/project/include/entity.h'), false);
    });
  });

  describe('getCppReferenceUrl', () => {
    it('should resolve standard container and utility symbols to canonical URLs', () => {
      assert.strictEqual(
        getCppReferenceUrl('std::vector'),
        'https://en.cppreference.com/w/cpp/container/vector'
      );
      assert.strictEqual(
        getCppReferenceUrl('std::unique_ptr'),
        'https://en.cppreference.com/w/cpp/memory/unique_ptr'
      );
      assert.strictEqual(
        getCppReferenceUrl('std::format'),
        'https://en.cppreference.com/w/cpp/utility/format/format'
      );
      assert.strictEqual(
        getCppReferenceUrl('printf'),
        'https://en.cppreference.com/w/cpp/io/c/fprintf'
      );
    });

    it('should generate search fallback URL for other standard symbols', () => {
      const url = getCppReferenceUrl('std::filesystem::path');
      assert.ok(url);
      assert.ok(url.includes('cppreference.com'));
      assert.ok(url.includes('search='));
    });
  });
});
