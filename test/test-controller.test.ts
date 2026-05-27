import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { extractTestsFromSource, CppTestController } from '../src/testing/test-controller';

describe('Modern C++ Test Explorer Integration', () => {
  describe('extractTestsFromSource', () => {
    it('should extract GoogleTest macros with suite and case name', () => {
      const code = `
#include <gtest/gtest.h>

TEST(MathTestSuite, FactorialZero) {
    EXPECT_EQ(Factorial(0), 1);
}

TEST_F(DatabaseFixture, ConnectionPool) {
    ASSERT_TRUE(pool.isConnected());
}
`;
      const tests = extractTestsFromSource(code);
      assert.strictEqual(tests.length, 2);

      assert.strictEqual(tests[0].framework, 'gtest');
      assert.strictEqual(tests[0].suite, 'MathTestSuite');
      assert.strictEqual(tests[0].id, 'MathTestSuite.FactorialZero');
      assert.strictEqual(tests[0].filterArg, '--gtest_filter=MathTestSuite.FactorialZero');

      assert.strictEqual(tests[1].framework, 'gtest');
      assert.strictEqual(tests[1].suite, 'DatabaseFixture');
      assert.strictEqual(tests[1].id, 'DatabaseFixture.ConnectionPool');
      assert.strictEqual(tests[1].filterArg, '--gtest_filter=DatabaseFixture.ConnectionPool');
    });

    it('should extract Catch2 test cases and scenarios', () => {
      const code = `
#include <catch2/catch_test_macros.hpp>

TEST_CASE("Vectors can be sized and resized", "[vector]") {
    std::vector<int> v(5);
    REQUIRE(v.size() == 5);
}

SCENARIO("User authentication flow", "[auth]") {
    GIVEN("A valid username and password") {
    }
}
`;
      const tests = extractTestsFromSource(code);
      assert.strictEqual(tests.length, 2);

      assert.strictEqual(tests[0].framework, 'catch2');
      assert.strictEqual(tests[0].label, 'Vectors can be sized and resized [vector]');
      assert.strictEqual(tests[0].filterArg, '"Vectors can be sized and resized"');

      assert.strictEqual(tests[1].framework, 'catch2');
      assert.strictEqual(tests[1].label, 'Scenario: User authentication flow [auth]');
      assert.strictEqual(tests[1].filterArg, '"User authentication flow"');
    });

    it('should extract Boost.Test and doctest test cases', () => {
      const code = `
BOOST_AUTO_TEST_CASE(BoostMathTest) {
    BOOST_CHECK_EQUAL(2 + 2, 4);
}

DOCTEST_TEST_CASE("DoctestSample") {
    CHECK(1 == 1);
}
`;
      const tests = extractTestsFromSource(code);
      assert.strictEqual(tests.length, 2);

      assert.strictEqual(tests[0].framework, 'boost');
      assert.strictEqual(tests[0].label, 'BoostMathTest');
      assert.strictEqual(tests[0].filterArg, '--run_test=BoostMathTest');

      assert.strictEqual(tests[1].framework, 'doctest');
      assert.strictEqual(tests[1].label, 'DoctestSample');
      assert.strictEqual(tests[1].filterArg, '-tc="DoctestSample"');
    });
  });

  describe('CppTestController', () => {
    it('should initialize test controller and discover tests in active document', () => {
      const controller = new CppTestController();
      assert.ok(controller.getController());

      const mockDoc = {
        fileName: 'F:/DEV/projects/test/math_test.cpp',
        uri: { toString: () => 'file:///F:/DEV/projects/test/math_test.cpp' },
        getText: () => `
TEST(SuiteA, TestOne) {}
TEST(SuiteA, TestTwo) {}
`
      } as unknown as vscode.TextDocument;

      const discovered = controller.discoverTestsInDocument(mockDoc);
      assert.strictEqual(discovered.length, 2);

      const items = controller.getController().items;
      const fileItem = items.get('file:///F:/DEV/projects/test/math_test.cpp');
      assert.ok(fileItem, 'File item must exist in controller');

      controller.dispose();
    });
  });
});
