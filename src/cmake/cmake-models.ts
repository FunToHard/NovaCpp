export interface CMakeTargetInfo {
  name: string;
  type: 'executable' | 'library' | 'interface' | 'custom';
  sourceFiles: string[];
  includeDirectories: string[];
  compileDefinitions: string[];
}

export interface CMakeProjectInfo {
  workspaceRoot: string;
  cmakeListsPath: string;
  includeDirectories: string[];
  compileDefinitions: string[];
  cppStandard?: string;
  cStandard?: string;
  targets: CMakeTargetInfo[];
  subdirectories: string[];
}
