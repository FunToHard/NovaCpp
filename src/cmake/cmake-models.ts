import * as vscode from 'vscode';

export type CMakeBuildType = 'Debug' | 'Release' | 'RelWithDebInfo' | 'MinSizeRel';

export interface CMakePreset {
  name: string;
  displayName?: string;
  description?: string;
  binaryDir?: string;
  generator?: string;
  cacheVariables?: Record<string, string | boolean | number>;
}

export interface CMakeProjectInfo {
  workspaceRoot: string;
  sourceDir: string;
  buildDir: string;
  cmakeListsPath: string;
  buildType: CMakeBuildType;
  compilationDatabasePath?: string;
  preset?: CMakePreset;
}

export interface CMakeTaskDefinition extends vscode.TaskDefinition {
  type: 'cmake';
  task: 'configure' | 'build' | 'clean' | 'rebuild';
  target?: string;
  buildDirectory?: string;
  buildType?: string;
  preset?: string;
}
