import './vscode-mock';
import * as assert from 'assert';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import * as vscode from 'vscode';
import {
  findCounterpartFile,
  prioritizeDefinitionLocations
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
});
