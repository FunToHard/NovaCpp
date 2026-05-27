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

/**
 * Extracts unit test definitions from C++ source files (GoogleTest, Catch2, doctest, Boost.Test).
 */
export function extractTestsFromSource(content: string, uri?: vscode.Uri): CppTestCase[] {
  const tests: CppTestCase[] = [];
  const lines = content.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('/*')) continue;

    // 1. GoogleTest: TEST(Suite, Name), TEST_F(Fixture, Name), TEST_P(ParamFixture, Name)
    const gtestMatch = line.match(/\b(TEST|TEST_F|TEST_P)\s*\(\s*([a-zA-Z_]\w*)\s*,\s*([a-zA-Z_]\w*)\s*\)/);
    if (gtestMatch) {
      const suite = gtestMatch[2];
      const name = gtestMatch[3];
      const col = line.indexOf(gtestMatch[0]);
      tests.push({
        id: `${suite}.${name}`,
        label: `${suite}.${name}`,
        suite,
        framework: 'gtest',
        line: i,
        column: Math.max(0, col),
        filterArg: `--gtest_filter=${suite}.${name}`
      });
      continue;
    }

    // 2. Catch2: TEST_CASE("Name", "[tag]"), SCENARIO("Name", "[tag]")
    const catchMatch = line.match(/\b(TEST_CASE|SCENARIO)\s*\(\s*"([^"]+)"(?:\s*,\s*"([^"]*)")?\s*\)/);
    if (catchMatch) {
      const macro = catchMatch[1];
      const name = catchMatch[2];
      const rawTag = catchMatch[3]?.trim();
      const tag = rawTag ? (rawTag.startsWith('[') ? ` ${rawTag}` : ` [${rawTag}]`) : '';
      const col = line.indexOf(catchMatch[0]);
      tests.push({
        id: `catch2:${name}`,
        label: `${macro === 'SCENARIO' ? 'Scenario: ' : ''}${name}${tag}`,
        framework: 'catch2',
        line: i,
        column: Math.max(0, col),
        filterArg: `"${name}"`
      });
      continue;
    }

    // 3. Boost.Test: BOOST_AUTO_TEST_CASE(Name)
    const boostMatch = line.match(/\bBOOST_AUTO_TEST_CASE\s*\(\s*([a-zA-Z_]\w*)\s*\)/);
    if (boostMatch) {
      const name = boostMatch[1];
      const col = line.indexOf(boostMatch[0]);
      tests.push({
        id: `boost:${name}`,
        label: name,
        framework: 'boost',
        line: i,
        column: Math.max(0, col),
        filterArg: `--run_test=${name}`
      });
      continue;
    }

    // 4. doctest: DOCTEST_TEST_CASE("Name")
    const doctestMatch = line.match(/\bDOCTEST_TEST_CASE\s*\(\s*"([^"]+)"\s*\)/);
    if (doctestMatch) {
      const name = doctestMatch[1];
      const col = line.indexOf(doctestMatch[0]);
      tests.push({
        id: `doctest:${name}`,
        label: name,
        framework: 'doctest',
        line: i,
        column: Math.max(0, col),
        filterArg: `-tc="${name}"`
      });
      continue;
    }
  }

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
    request: vscode.TestRunRequest,
    token: vscode.CancellationToken,
    isDebug: boolean = false
  ): Promise<void> {
    vscode.window.showInformationMessage(
      `NovaCpp: ${isDebug ? 'Debugging' : 'Running'} tests selected in Test Explorer.`
    );
  }
}
