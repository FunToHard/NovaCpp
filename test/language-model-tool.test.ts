import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { NovaCppConfigurationTool } from '../src/ai/language-model-tool';
import { CompilerDetector } from '../src/prober/compiler-detector';

describe('Language Model Tools & Copilot Integration (#cpp)', () => {
  it('should build accurate project context', async () => {
    const detector = new CompilerDetector();
    const tool = new NovaCppConfigurationTool(detector, null);

    const ctx = await tool.getProjectContext();
    assert.ok(ctx.language);
    assert.ok(ctx.standard);
    assert.ok(ctx.compilerName);
    assert.ok(ctx.compilerFamily);
    assert.ok(ctx.platform);
    assert.ok(ctx.architecture);
  });

  it('should format context into a structured project summary string', () => {
    const detector = new CompilerDetector();
    const tool = new NovaCppConfigurationTool(detector, null);

    const dummyCtx = {
      language: 'C++',
      standard: 'c++23',
      compilerName: 'MSVC 14.51 (x64)',
      compilerFamily: 'msvc',
      architecture: 'x64',
      platform: 'win32',
      solution: {
        name: 'GeometryEngine',
        format: 'SLNX',
        configuration: 'Debug|x64'
      },
      vcpkgRoot: 'C:\\vcpkg',
      activeFile: 'main.cpp'
    };

    const formatted = tool.formatContextForLlm(dummyCtx);
    assert.ok(formatted.includes('The user is working on a C++ project.'));
    assert.ok(formatted.includes('targets language standard version C++23.'));
    assert.ok(formatted.includes('MSVC 14.51 (x64)'));
    assert.ok(formatted.includes("Visual Studio Solution 'GeometryEngine' (SLNX)"));
    assert.ok(formatted.includes('vcpkg dependencies located at C:\\vcpkg'));
    assert.ok(formatted.includes("active source file is 'main.cpp'"));
  });

  it('should execute invoke() and return valid result structure', async () => {
    const detector = new CompilerDetector();
    const tool = new NovaCppConfigurationTool(detector, null);

    const res = await tool.invoke({}, {} as any);
    assert.ok(res);
  });
});
