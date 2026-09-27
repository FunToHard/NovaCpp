export type ProjectTemplateType =
  | 'console'
  | 'static-lib'
  | 'shared-lib'
  | 'header-only'
  | 'test-suite';

export type ProjectBuildSystem =
  | 'cmake'
  | 'solution'
  | 'makefile'
  | 'lightweight';

export type LanguageType = 'cpp' | 'c';

export type CppStandard = 'c++11' | 'c++14' | 'c++17' | 'c++20' | 'c++23';
export type CStandard = 'c99' | 'c11' | 'c17' | 'c23';

export type TestFramework = 'catch2' | 'googletest' | 'doctest';

export interface ProjectCreationOptions {
  projectName: string;
  targetDirectory: string;
  language: LanguageType;
  standard: CppStandard | CStandard;
  templateType: ProjectTemplateType;
  buildSystem: ProjectBuildSystem;
  testFramework?: TestFramework;
  compilerPath?: string;
  isWindows?: boolean;
  platform?: NodeJS.Platform;
}

export interface GeneratedFile {
  relativePath: string;
  content: string;
}

export interface ProjectScaffoldResult {
  success: boolean;
  projectRoot: string;
  filesCreated: string[];
  mainFilePath?: string;
  error?: string;
}
