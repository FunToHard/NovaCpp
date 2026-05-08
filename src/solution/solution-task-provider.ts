import * as vscode from 'vscode';
import * as path from 'path';
import { CompilerDetector } from '../prober/compiler-detector';
import { SolutionModel, SolutionProjectEntry } from './solution-models';

export interface MSBuildTaskDefinition extends vscode.TaskDefinition {
  type: 'msbuild';
  solution: string;
  target?: 'Build' | 'Rebuild' | 'Clean';
  configuration?: string;
  platform?: string;
  project?: string;
}

export class SolutionTaskProvider implements vscode.TaskProvider {
  static readonly taskType = 'msbuild';

  constructor(
    private readonly detector: CompilerDetector,
    private readonly getActiveSolution: () => SolutionModel | null,
    private readonly getActiveConfiguration: () => { configuration: string; platform: string; key: string }
  ) {}

  public async provideTasks(): Promise<vscode.Task[]> {
    const tasks: vscode.Task[] = [];
    const solution = this.getActiveSolution();
    if (!solution) {
      return tasks;
    }

    const msbuildPath = this.detector.findMsBuild();
    if (!msbuildPath) {
      return tasks;
    }

    const activeConfig = this.getActiveConfiguration();
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

    // 1. Build Solution Task
    tasks.push(
      this.createSolutionTask(
        solution,
        activeConfig.configuration,
        activeConfig.platform,
        'Build',
        msbuildPath,
        workspaceFolder,
        true // isDefault
      )
    );

    // 2. Rebuild Solution Task
    tasks.push(
      this.createSolutionTask(
        solution,
        activeConfig.configuration,
        activeConfig.platform,
        'Rebuild',
        msbuildPath,
        workspaceFolder,
        false
      )
    );

    // 3. Clean Solution Task
    tasks.push(
      this.createSolutionTask(
        solution,
        activeConfig.configuration,
        activeConfig.platform,
        'Clean',
        msbuildPath,
        workspaceFolder,
        false
      )
    );

    // 4. Per-Project Build Tasks
    for (const proj of solution.projects) {
      tasks.push(
        this.createProjectTask(
          solution,
          proj,
          activeConfig.configuration,
          activeConfig.platform,
          msbuildPath,
          workspaceFolder
        )
      );
    }

    return tasks;
  }

  public async resolveTask(task: vscode.Task): Promise<vscode.Task | undefined> {
    const definition = task.definition as MSBuildTaskDefinition;
    if (definition.type !== SolutionTaskProvider.taskType) {
      return undefined;
    }

    const msbuildPath = this.detector.findMsBuild();
    if (!msbuildPath) {
      return undefined;
    }

    const solution = this.getActiveSolution();
    const activeConfig = this.getActiveConfiguration();
    const conf = definition.configuration || activeConfig.configuration;
    const plat = definition.platform || activeConfig.platform;
    const target = definition.target || 'Build';

    const args = this.buildArgs(
      msbuildPath,
      definition.project || definition.solution || (solution ? solution.filePath : ''),
      conf,
      plat,
      target
    );

    const cwd = solution ? path.dirname(solution.filePath) : process.cwd();
    const execution = new vscode.ProcessExecution(msbuildPath, args, { cwd });

    return new vscode.Task(
      definition,
      task.scope ?? vscode.TaskScope.Workspace,
      task.name || `MSBuild: ${target}`,
      'NovaCpp',
      execution,
      ['$msvc']
    );
  }

  private createSolutionTask(
    solution: SolutionModel,
    configuration: string,
    platform: string,
    target: 'Build' | 'Rebuild' | 'Clean',
    msbuildPath: string,
    workspaceFolder?: vscode.WorkspaceFolder,
    isDefault: boolean = false
  ): vscode.Task {
    const taskDefinition: MSBuildTaskDefinition = {
      type: SolutionTaskProvider.taskType,
      solution: solution.filePath,
      configuration,
      platform,
      target
    };

    const args = this.buildArgs(msbuildPath, solution.filePath, configuration, platform, target);
    const execution = new vscode.ProcessExecution(msbuildPath, args, {
      cwd: path.dirname(solution.filePath)
    });

    const task = new vscode.Task(
      taskDefinition,
      workspaceFolder ?? vscode.TaskScope.Workspace,
      `MSBuild: ${target} Solution (${solution.name} [${configuration}|${platform}])`,
      'NovaCpp',
      execution,
      ['$msvc']
    );

    if (isDefault) {
      task.group = (vscode as any).TaskGroup?.Build ?? { isDefault: true };
    } else if (target === 'Clean') {
      task.group = (vscode as any).TaskGroup?.Clean;
    } else {
      task.group = (vscode as any).TaskGroup?.Build;
    }

    return task;
  }

  private createProjectTask(
    solution: SolutionModel,
    project: SolutionProjectEntry,
    configuration: string,
    platform: string,
    msbuildPath: string,
    workspaceFolder?: vscode.WorkspaceFolder
  ): vscode.Task {
    const taskDefinition: MSBuildTaskDefinition = {
      type: SolutionTaskProvider.taskType,
      solution: solution.filePath,
      project: project.fullPath,
      configuration,
      platform,
      target: 'Build'
    };

    const args = this.buildArgs(msbuildPath, project.fullPath, configuration, platform, 'Build');
    const execution = new vscode.ProcessExecution(msbuildPath, args, {
      cwd: path.dirname(project.fullPath)
    });

    const task = new vscode.Task(
      taskDefinition,
      workspaceFolder ?? vscode.TaskScope.Workspace,
      `MSBuild: Build Project (${project.name} [${configuration}|${platform}])`,
      'NovaCpp',
      execution,
      ['$msvc']
    );

    task.group = (vscode as any).TaskGroup?.Build;
    return task;
  }

  private buildArgs(
    msbuildPath: string,
    targetFile: string,
    configuration: string,
    platform: string,
    target: 'Build' | 'Rebuild' | 'Clean'
  ): string[] {
    const isDotnet = path.basename(msbuildPath).toLowerCase().startsWith('dotnet');

    if (isDotnet) {
      const args = ['build', targetFile, '-c', configuration, `-p:Platform=${platform}`];
      if (target === 'Rebuild') {
        args.push('--no-incremental');
      }
      return args;
    }

    const args = [targetFile, `/p:Configuration=${configuration}`, `/p:Platform=${platform}`, '/m'];
    if (target === 'Rebuild') {
      args.push('/t:Rebuild');
    } else if (target === 'Clean') {
      args.push('/t:Clean');
    }
    return args;
  }
}
