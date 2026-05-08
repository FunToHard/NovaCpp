import * as path from 'path';
import * as fs from 'fs';
import { SolutionModel, VcxProjectModel, CompileCommandEntry } from './solution-models';
import { CompilerInfo } from '../prober/compiler-detector';

export class CompilationDatabaseGenerator {
  /**
   * Generates compilation database entries for all projects in a solution.
   */
  public generateEntries(
    solution: SolutionModel,
    projects: VcxProjectModel[],
    compiler: CompilerInfo,
    systemIncludes: string[] = [],
    activeConfiguration?: string
  ): CompileCommandEntry[] {
    const entries: CompileCommandEntry[] = [];
    const seenFiles = new Set<string>();

    const targetConfig =
      activeConfiguration ||
      (solution.configurations.length > 0 ? solution.configurations[0].key : 'Debug|x64');

    for (const project of projects) {
      const projectDir = path.dirname(project.filePath).replace(/\\/g, '/');
      const options =
        project.compileOptionsByConfig.get(targetConfig) || project.defaultCompileOptions;

      const standard = options.languageStandard || 'c++20';

      // Assemble all includes: project directory + project additional includes + system includes
      const allIncludes = Array.from(
        new Set([
          projectDir,
          ...options.includeDirectories.map((d) => d.replace(/\\/g, '/')),
          ...systemIncludes.map((s) => s.replace(/\\/g, '/'))
        ])
      );

      const definitions = Array.from(new Set(options.preprocessorDefinitions));
      const extraOptions = options.additionalOptions || [];

      for (const sourceFile of project.sourceFiles) {
        const normalizedFile = sourceFile.replace(/\\/g, '/');
        if (seenFiles.has(normalizedFile.toLowerCase())) {
          continue;
        }
        seenFiles.add(normalizedFile.toLowerCase());

        const commandParts: string[] = [];

        if (compiler.type === 'msvc') {
          commandParts.push(
            `"${compiler.path.replace(/\\/g, '/')}"`,
            '--driver-mode=cl',
            `/std:${standard}`,
            '/EHsc',
            '/TP',
            '/W4'
          );

          for (const inc of allIncludes) {
            commandParts.push(`-I"${inc}"`);
          }

          for (const def of definitions) {
            commandParts.push(`-D${def}`);
          }

          for (const opt of extraOptions) {
            commandParts.push(opt);
          }

          commandParts.push('/c', `"${normalizedFile}"`);
        } else {
          commandParts.push(
            `"${compiler.path.replace(/\\/g, '/')}"`,
            `-std=${standard}`,
            '-Wall'
          );

          for (const inc of allIncludes) {
            commandParts.push(`-I"${inc}"`);
          }

          for (const def of definitions) {
            commandParts.push(`-D${def}`);
          }

          for (const opt of extraOptions) {
            commandParts.push(opt);
          }

          commandParts.push('-c', `"${normalizedFile}"`);
        }

        entries.push({
          directory: projectDir,
          command: commandParts.join(' '),
          file: normalizedFile
        });
      }
    }

    return entries;
  }

  /**
   * Writes the generated compilation database to compile_commands.json on disk.
   */
  public async writeCompilationDatabase(
    targetFilePath: string,
    entries: CompileCommandEntry[]
  ): Promise<string> {
    const dir = path.dirname(targetFilePath);
    if (!fs.existsSync(dir)) {
      await fs.promises.mkdir(dir, { recursive: true });
    }

    const content = JSON.stringify(entries, null, 2) + '\n';
    await fs.promises.writeFile(targetFilePath, content, 'utf8');
    return targetFilePath;
  }
}
