/**
 * Data models for Visual Studio Solution (.sln, .slnx) and C++ Project (.vcxproj) files.
 */

export interface SolutionConfiguration {
  configuration: string; // e.g. "Debug", "Release"
  platform: string;      // e.g. "x64", "x86", "ARM64", "Win32"
  key: string;           // e.g. "Debug|x64"
}

export interface SolutionProjectEntry {
  name: string;
  relativePath: string;
  fullPath: string;
  guid?: string;
  folder?: string;
}

export interface SolutionModel {
  format: 'sln' | 'slnx';
  filePath: string;
  name: string;
  configurations: SolutionConfiguration[];
  projects: SolutionProjectEntry[];
}

export interface ProjectCompileOptions {
  includeDirectories: string[];
  preprocessorDefinitions: string[];
  languageStandard?: string; // Normalized: "c++14", "c++17", "c++20", "c++23"
  additionalOptions?: string[];
  configurationType?: 'Application' | 'DynamicLibrary' | 'StaticLibrary' | 'Utility';
}

export interface VcxProjectModel {
  filePath: string;
  name: string;
  guid?: string;
  configurationType?: string;
  configurations: SolutionConfiguration[];
  compileOptionsByConfig: Map<string, ProjectCompileOptions>;
  defaultCompileOptions: ProjectCompileOptions;
  sourceFiles: string[]; // Absolute paths
  headerFiles: string[]; // Absolute paths
  targetName?: string;
  outDir?: string;
}

export interface CompileCommandEntry {
  directory: string;
  command: string;
  file: string;
}
