import * as vscode from 'vscode';
import * as path from 'path';

export type CppTestFramework = 'gtest' | 'catch2' | 'doctest' | 'boost';

export interface CppTestCase {
  id: string;
  label: string;
  suite?: string;
  framework: CppTestFramework;
  line: number;
  column: number;
  filterArg: string;
}

function maskComments(source: string): string {
  const chars = source.split('');
  let inString: string | null = null;
  let inLineComment = false;
  let inBlockComment = false;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (inLineComment) {
      if (ch === '\n') {
        inLineComment = false;
      } else if (ch !== '\r') {
        chars[i] = ' ';
      }
      continue;
    }

    if (inBlockComment) {
      if (ch === '*' && next === '/') {
        chars[i] = ' ';
        chars[i + 1] = ' ';
        i++;
        inBlockComment = false;
      } else if (ch !== '\n' && ch !== '\r') {
        chars[i] = ' ';
      }
      continue;
    }

    if (inString) {
      if (ch === '\\') {
        i++; // skip escaped char
      } else if (ch === inString) {
        inString = null;
      }
      continue;
    }

    if (ch === '"' || ch === "'") {
      inString = ch;
      continue;
    }

    if (ch === '/' && next === '/') {
      inLineComment = true;
      chars[i] = ' ';
      chars[i + 1] = ' ';
      i++;
    } else if (ch === '/' && next === '*') {
      inBlockComment = true;
      chars[i] = ' ';
      chars[i + 1] = ' ';
      i++;
    }
  }

  return chars.join('');
}

function offsetToPosition(offset: number, lineOffsets: number[]): { line: number; column: number } {
  let low = 0;
  let high = lineOffsets.length - 1;
  let line = 0;
  while (low <= high) {
    const mid = (low + high) >> 1;
    if (lineOffsets[mid] <= offset) {
      line = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  const column = offset - lineOffsets[line];
  return { line, column };
}

/**
 * Extracts unit test definitions from C++ source files (GoogleTest, Catch2, doctest, Boost.Test),
 * handling multiline macros and multiline comments.
 */
export function extractTestsFromSource(content: string, _uri?: vscode.Uri): CppTestCase[] {
  const tests: CppTestCase[] = [];
  const lineOffsets: number[] = [0];
  for (let i = 0; i < content.length; i++) {
    if (content[i] === '\n') {
      lineOffsets.push(i + 1);
    }
  }

  const masked = maskComments(content);

  // 1. GoogleTest: TEST(Suite, Name), TEST_F(Fixture, Name), TEST_P(ParamFixture, Name)
  const gtestRegex = /\b(TEST|TEST_F|TEST_P)\s*\(\s*([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s*\)/g;
  let match: RegExpExecArray | null;
  while ((match = gtestRegex.exec(masked)) !== null) {
    const suite = match[2];
    const name = match[3];
    const pos = offsetToPosition(match.index, lineOffsets);
    tests.push({
      id: `${suite}.${name}`,
      label: `${suite}.${name}`,
      suite,
      framework: 'gtest',
      line: pos.line,
      column: pos.column,
      filterArg: `--gtest_filter=${suite}.${name}`
    });
  }

  // 2. Catch2: TEST_CASE("Name", "[tag]"), SCENARIO("Name", "[tag]")
  const catchRegex = /\b(TEST_CASE|SCENARIO)\s*\(\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?\s*\)/g;
  while ((match = catchRegex.exec(masked)) !== null) {
    const macro = match[1];
    const name = match[2];
    const rawTag = match[3]?.trim();
    const tag = rawTag ? (rawTag.startsWith('[') ? ` ${rawTag}` : ` [${rawTag}]`) : '';
    const pos = offsetToPosition(match.index, lineOffsets);
    tests.push({
      id: `catch2:${name}`,
      label: `${macro === 'SCENARIO' ? 'Scenario: ' : ''}${name}${tag}`,
      framework: 'catch2',
      line: pos.line,
      column: pos.column,
      filterArg: `"${name}"`
    });
  }

  // 3. Boost.Test: BOOST_AUTO_TEST_CASE(Name)
  const boostRegex = /\bBOOST_AUTO_TEST_CASE\s*\(\s*([a-zA-Z_]\w*)\s*\)/g;
  while ((match = boostRegex.exec(masked)) !== null) {
    const name = match[1];
    const pos = offsetToPosition(match.index, lineOffsets);
    tests.push({
      id: `boost:${name}`,
      label: name,
      framework: 'boost',
      line: pos.line,
      column: pos.column,
      filterArg: `--run_test=${name}`
    });
  }

  // 4. doctest: DOCTEST_TEST_CASE("Name")
  const doctestRegex = /\bDOCTEST_TEST_CASE\s*\(\s*"([^"]+)"\s*\)/g;
  while ((match = doctestRegex.exec(masked)) !== null) {
    const name = match[1];
    const pos = offsetToPosition(match.index, lineOffsets);
    tests.push({
      id: `doctest:${name}`,
      label: name,
      framework: 'doctest',
      line: pos.line,
      column: pos.column,
      filterArg: `-tc="${name}"`
    });
  }

  tests.sort((a, b) => (a.line !== b.line ? a.line - b.line : a.column - b.column));
  return tests;
}

/**
 * Controller integrating C/C++ unit test discovery with the VS Code native Test Explorer.
 */
export class CppTestController implements vscode.Disposable {
  private controller: vscode.TestController;
  private disposables: vscode.Disposable[] = [];
  private runProfile: vscode.TestRunProfile;
  private debugProfile: vscode.TestRunProfile;

  constructor() {
    this.controller = vscode.tests.createTestController(
      'novacpp-test-controller',
      'NovaCpp: C/C++ Tests'
    );

    this.runProfile = this.controller.createRunProfile(
      'Run C++ Test',
      vscode.TestRunProfileKind.Run,
      (request, token) => this.runHandler(request, token)
    );

    this.debugProfile = this.controller.createRunProfile(
      'Debug C++ Test',
      vscode.TestRunProfileKind.Debug,
      (request, token) => this.runHandler(request, token, true)
    );

    // Watch active and opened documents
    this.disposables.push(
      vscode.workspace.onDidOpenTextDocument((doc) => this.discoverTestsInDocument(doc)),
      vscode.workspace.onDidChangeTextDocument((e) => this.discoverTestsInDocument(e.document)),
      vscode.workspace.onDidCloseTextDocument((doc) => {
        this.controller.items.delete(doc.uri.toString());
      })
    );

    // Initial discovery for open editors
    if (vscode.window.activeTextEditor) {
      this.discoverTestsInDocument(vscode.window.activeTextEditor.document);
    }
  }

  public dispose(): void {
    this.runProfile.dispose();
    this.debugProfile.dispose();
    this.controller.dispose();
    for (const d of this.disposables) {
      d.dispose();
    }
    this.disposables = [];
  }

  public getController(): vscode.TestController {
    return this.controller;
  }

  public discoverTestsInDocument(document: vscode.TextDocument): CppTestCase[] {
    const fileName = document.fileName.toLowerCase();
    if (!fileName.endsWith('.cpp') && !fileName.endsWith('.cc') && !fileName.endsWith('.cxx')) {
      return [];
    }

    const content = document.getText();
    const discovered = extractTestsFromSource(content, document.uri);
    const fileItem = this.controller.createTestItem(
      document.uri.toString(),
      path.basename(document.fileName),
      document.uri
    );

    if (discovered.length === 0) {
      this.controller.items.delete(document.uri.toString());
      return [];
    }

    // Populate child test items
    for (const test of discovered) {
      const testItem = this.controller.createTestItem(
        `${document.uri.toString()}::${test.id}`,
        test.label,
        document.uri
      );
      testItem.range = new vscode.Range(test.line, test.column, test.line, test.column + test.label.length);
      fileItem.children.add(testItem);
    }

    this.controller.items.add(fileItem);
    return discovered;
  }

  public async refreshAll(): Promise<number> {
    let total = 0;
    const docs = await vscode.workspace.findFiles('**/*.{cpp,cc,cxx}', '**/node_modules/**');
    for (const uri of docs) {
      try {
        const doc = await vscode.workspace.openTextDocument(uri);
        const found = this.discoverTestsInDocument(doc);
        total += found.length;
      } catch {
        // Skip unreadable files
      }
    }
    return total;
  }

  private async runHandler(
    _request: vscode.TestRunRequest,
    _token: vscode.CancellationToken,
    isDebug: boolean = false
  ): Promise<void> {
    vscode.window.showInformationMessage(
      `NovaCpp: ${isDebug ? 'Debugging' : 'Running'} tests selected in Test Explorer.`
    );
  }
}
