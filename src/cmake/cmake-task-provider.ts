import * as vscode from 'vscode';
import * as path from 'path';
import { CMakeManager } from './cmake-manager';
import { CMakeDetector } from './cmake-detector';
import { CMakeTaskDefinition } from './cmake-models';

export class CMakeTaskProvider implements vscode.TaskProvider {
  public static readonly taskType = 'cmake';

  constructor(private readonly manager: CMakeManager) {}

  public async provideTasks(): Promise<vscode.Task[]> {
    const project = this.manager.getActiveProject();
    if (!project) {
      return [];
    }

    const config = vscode.workspace.getConfiguration('novacpp.cmake');
    const customCmake = config.get<string>('cmakePath');
    const cmakeBin = (await CMakeDetector.findCMake(customCmake)) || 'cmake';

    const tasks: vscode.Task[] = [];
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    const scope = workspaceFolder || vscode.TaskScope.Workspace;

    const buildDir = project.buildDir;
    const buildType = project.buildType;
    const rootPath = project.workspaceRoot;

    // 1. Configure Task
    const configDef: CMakeTaskDefinition = {
      type: CMakeTaskProvider.taskType,
      task: 'configure',
      buildDirectory: buildDir,
      buildType
    };
    const configArgs = [
      '-B',
      buildDir,
      '-S',
      rootPath,
      '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON',
      `-DCMAKE_BUILD_TYPE=${buildType}`
    ];
    const configExec = new vscode.ProcessExecution(cmakeBin, configArgs, {
      cwd: rootPath
    });
    const configTask = new vscode.Task(
      configDef,
      scope,
      `Configure (${buildType})`,
      'CMake',
      configExec
    );
    configTask.group = vscode.TaskGroup.Build;
    tasks.push(configTask);

    // 2. Build Task
    const buildDef: CMakeTaskDefinition = {
      type: CMakeTaskProvider.taskType,
      task: 'build',
      buildDirectory: buildDir,
      buildType
    };
    const buildArgs = ['--build', buildDir, '--config', buildType];
    const buildExec = new vscode.ProcessExecution(cmakeBin, buildArgs, {
      cwd: rootPath
    });
    const buildTask = new vscode.Task(
      buildDef,
      scope,
      `Build (${buildType})`,
      'CMake',
      buildExec,
      ['$gcc', '$msCompile']
    );
    buildTask.group = vscode.TaskGroup.Build;
    tasks.push(buildTask);

    // 3. Clean Task
    const cleanDef: CMakeTaskDefinition = {
      type: CMakeTaskProvider.taskType,
      task: 'clean',
      buildDirectory: buildDir
    };
    const cleanArgs = ['--build', buildDir, '--target', 'clean'];
    const cleanExec = new vscode.ProcessExecution(cmakeBin, cleanArgs, {
      cwd: rootPath
    });
    const cleanTask = new vscode.Task(
      cleanDef,
      scope,
      `Clean (${buildType})`,
      'CMake',
      cleanExec
    );
    cleanTask.group = vscode.TaskGroup.Clean;
    tasks.push(cleanTask);

    // 4. Rebuild Task
    const rebuildDef: CMakeTaskDefinition = {
      type: CMakeTaskProvider.taskType,
      task: 'rebuild',
      buildDirectory: buildDir,
      buildType
    };
    const rebuildArgs = ['--build', buildDir, '--clean-first', '--config', buildType];
    const rebuildExec = new vscode.ProcessExecution(cmakeBin, rebuildArgs, {
      cwd: rootPath
    });
    const rebuildTask = new vscode.Task(
      rebuildDef,
      scope,
      `Rebuild (${buildType})`,
      'CMake',
      rebuildExec,
      ['$gcc', '$msCompile']
    );
    rebuildTask.group = vscode.TaskGroup.Rebuild;
    tasks.push(rebuildTask);

    return tasks;
  }

  public async resolveTask(task: vscode.Task): Promise<vscode.Task | undefined> {
    const definition = task.definition as CMakeTaskDefinition;
    if (!definition || definition.type !== CMakeTaskProvider.taskType) {
      return undefined;
    }

    const config = vscode.workspace.getConfiguration('novacpp.cmake');
    const customCmake = config.get<string>('cmakePath');
    const cmakeBin = (await CMakeDetector.findCMake(customCmake)) || 'cmake';

    const project = this.manager.getActiveProject();
    const rootPath = project?.workspaceRoot || vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || '.';
    const buildDir = definition.buildDirectory || project?.buildDir || path.join(rootPath, 'build');
    const buildType = definition.buildType || project?.buildType || 'Debug';

    let args: string[] = [];
    switch (definition.task) {
      case 'configure':
        args = [
          '-B',
          buildDir,
          '-S',
          rootPath,
          '-DCMAKE_EXPORT_COMPILE_COMMANDS=ON',
          `-DCMAKE_BUILD_TYPE=${buildType}`
        ];
        break;
      case 'clean':
        args = ['--build', buildDir, '--target', 'clean'];
        break;
      case 'rebuild':
        args = ['--build', buildDir, '--clean-first', '--config', buildType];
        break;
      case 'build':
      default:
        args = ['--build', buildDir, '--config', buildType];
        if (definition.target) {
          args.push('--target', definition.target);
        }
        break;
    }

    const exec = new vscode.ProcessExecution(cmakeBin, args, { cwd: rootPath });
    const resolved = new vscode.Task(
      definition,
      task.scope || vscode.TaskScope.Workspace,
      task.name || `CMake: ${definition.task}`,
      'CMake',
      exec,
      ['$gcc', '$msCompile']
    );

    return resolved;
  }
}
