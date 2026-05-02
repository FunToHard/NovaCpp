import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { CompilerInfo } from '../prober/compiler-detector';

export function isCppFile(documentOrPath: vscode.TextDocument | string): boolean {
  const filePath = typeof documentOrPath === 'string' ? documentOrPath : documentOrPath.fileName;
  const ext = path.extname(filePath).toLowerCase();
  return ['.c', '.cpp', '.cc', '.cxx', '.c++', '.cp', '.cu'].includes(ext);
}

export function getOutputBinaryPath(sourceFile: string, workspaceRoot?: string): string {
  const parsed = path.parse(sourceFile);
  const isWindows = process.platform === 'win32';
  const binaryExt = isWindows ? '.exe' : '';

  if (workspaceRoot) {
    const buildDir = path.join(workspaceRoot, 'build');
    if (fs.existsSync(buildDir)) {
      return path.join(buildDir, parsed.name + binaryExt);
    }
  }

  return path.join(parsed.dir, parsed.name + binaryExt);
}

export function createBuildExecution(
  compiler: CompilerInfo,
  sourceFile: string,
  outputFile: string,
  standard: string = 'c++20'
): vscode.ProcessExecution {
  const isWindows = process.platform === 'win32';
  const args: string[] = [];

  if (compiler.type === 'msvc') {
    // MSVC flags: /EHsc (C++ exception handling), /Zi (debug info), /std:c++20, /Fe:outputFile, sourceFile
    args.push('/EHsc', '/Zi', `/std:${standard}`, `/Fe:${outputFile}`, sourceFile);
  } else {
    // GCC / Clang flags
    args.push(sourceFile, `-std=${standard}`, '-g', '-o', outputFile);
    if (compiler.type === 'gcc' && isWindows) {
      args.push('-static-libgcc', '-static-libstdc++');
    }
  }

  return new vscode.ProcessExecution(compiler.path, args, {
    cwd: path.dirname(sourceFile)
  });
}
