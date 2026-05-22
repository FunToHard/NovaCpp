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
    activeConfiguration?: string,
    options: { includeHeaders?: boolean } = {}
  ): CompileCommandEntry[] {
    const entries: CompileCommandEntry[] = [];
    const seenFiles = new Set<string>();

    const targetConfig =
      activeConfiguration ||
      (solution.configurations.length > 0 ? solution.configurations[0].key : 'Debug|x64');

    for (const project of projects) {
      const projectDir = path.dirname(project.filePath).replace(/\\/g, '/');
      const projectOpts =
        project.compileOptionsByConfig.get(targetConfig) || project.defaultCompileOptions;

      const standard = projectOpts.languageStandard || 'c++20';

      // Assemble all includes: project directory + project additional includes + system includes
      const allIncludes = Array.from(
        new Set([
          projectDir,
          ...projectOpts.includeDirectories.map((d) => d.replace(/\\/g, '/')),
          ...systemIncludes.map((s) => s.replace(/\\/g, '/'))
        ])
      );

      const definitions = Array.from(new Set(projectOpts.preprocessorDefinitions));
      const extraOptions = projectOpts.additionalOptions || [];

      const projectFiles = [
        ...project.sourceFiles.map((f) => ({ filePath: f, isHeader: false })),
        ...(options.includeHeaders
          ? project.headerFiles.map((f) => ({ filePath: f, isHeader: true }))
          : [])
      ];

      for (const { filePath: targetFile, isHeader } of projectFiles) {
        const normalizedFile = targetFile.replace(/\\/g, '/');
        if (seenFiles.has(normalizedFile.toLowerCase())) {
          continue;
        }
        seenFiles.add(normalizedFile.toLowerCase());

        const compilerBin = compiler.path.replace(/\\/g, '/');
        const commandParts: string[] = [];
        const args: string[] = [];

        if (compiler.type === 'msvc') {
          args.push(compilerBin, '--driver-mode=cl', `/std:${standard}`, '/EHsc', '/TP', '/W4');
          commandParts.push(
            `"${compilerBin}"`,
            '--driver-mode=cl',
            `/std:${standard}`,
            '/EHsc',
            '/TP',
            '/W4'
          );

          for (const inc of allIncludes) {
            args.push(`-I${inc}`);
            commandParts.push(`-I"${inc}"`);
          }

          for (const def of definitions) {
            args.push(`-D${def}`);
            commandParts.push(`-D${def}`);
          }

          for (const opt of extraOptions) {
            args.push(opt);
            commandParts.push(opt);
          }

          args.push('/c', normalizedFile);
          commandParts.push('/c', `"${normalizedFile}"`);
        } else {
          args.push(compilerBin, isHeader ? '-xc++-header' : '-xc++', `-std=${standard}`, '-Wall');
          commandParts.push(
            `"${compilerBin}"`,
            isHeader ? '-xc++-header' : '-xc++',
            `-std=${standard}`,
            '-Wall'
          );

          for (const inc of allIncludes) {
            args.push(`-I${inc}`);
            commandParts.push(`-I"${inc}"`);
          }

          for (const def of definitions) {
            args.push(`-D${def}`);
            commandParts.push(`-D${def}`);
          }

          for (const opt of extraOptions) {
            args.push(opt);
            commandParts.push(opt);
          }

          args.push('-c', normalizedFile);
          commandParts.push('-c', `"${normalizedFile}"`);
        }

        entries.push({
          directory: projectDir,
          command: commandParts.join(' '),
          arguments: args,
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
