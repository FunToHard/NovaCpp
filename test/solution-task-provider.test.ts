import './vscode-mock';
import * as assert from 'assert';
import * as vscode from 'vscode';
import { SolutionTaskProvider, MSBuildTaskDefinition } from '../src/solution/solution-task-provider';
import { CompilerDetector } from '../src/prober/compiler-detector';
import { SolutionModel } from '../src/solution/solution-models';

describe('Visual Studio Solution Subsystem: SolutionTaskProvider', () => {
  const mockSolution: SolutionModel = {
    format: 'slnx',
    filePath: 'F:/Projects/App/App.slnx',
    name: 'App',
    configurations: [
      { configuration: 'Debug', platform: 'x64', key: 'Debug|x64' },
      { configuration: 'Release', platform: 'x64', key: 'Release|x64' }
    ],
    projects: [
      {
        name: 'App',
        relativePath: 'App.vcxproj',
        fullPath: 'F:/Projects/App/App.vcxproj'
      },
      {
        name: 'MathLib',
        relativePath: 'MathLib/MathLib.vcxproj',
        fullPath: 'F:/Projects/App/MathLib/MathLib.vcxproj'
      }
    ]
  };

  const mockDetector = {
    findMsBuild: () => 'C:/Program Files/MSVC/MSBuild/Current/Bin/MSBuild.exe'
  } as unknown as CompilerDetector;

  it('should generate build, rebuild, clean, and per-project tasks for active solution', async () => {
    const provider = new SolutionTaskProvider(
      mockDetector,
      () => mockSolution,
      () => ({ configuration: 'Debug', platform: 'x64', key: 'Debug|x64' })
    );

    const tasks = await provider.provideTasks();
    assert.strictEqual(tasks.length, 5); // Build, Rebuild, Clean, + 2 projects

    // Build solution task
    const buildTask = tasks[0];
    assert.ok(buildTask.name.includes('Build Solution (App [Debug|x64])'));
    assert.strictEqual(buildTask.definition.type, 'msbuild');
    assert.strictEqual((buildTask.definition as MSBuildTaskDefinition).target, 'Build');
    assert.strictEqual((buildTask.definition as MSBuildTaskDefinition).configuration, 'Debug');
    assert.strictEqual((buildTask.definition as MSBuildTaskDefinition).platform, 'x64');

    const exec = buildTask.execution as vscode.ProcessExecution;
    assert.strictEqual(exec.process, 'C:/Program Files/MSVC/MSBuild/Current/Bin/MSBuild.exe');
    assert.ok(exec.args.includes('F:/Projects/App/App.slnx'));
    assert.ok(exec.args.includes('/p:Configuration=Debug'));
    assert.ok(exec.args.includes('/p:Platform=x64'));
    assert.ok(exec.args.includes('/m'));

    // Rebuild task
    const rebuildTask = tasks[1];
    assert.ok(rebuildTask.name.includes('Rebuild Solution'));
    const rebuildExec = rebuildTask.execution as vscode.ProcessExecution;
    assert.ok(rebuildExec.args.includes('/t:Rebuild'));

    // Clean task
    const cleanTask = tasks[2];
    assert.ok(cleanTask.name.includes('Clean Solution'));
    const cleanExec = cleanTask.execution as vscode.ProcessExecution;
    assert.ok(cleanExec.args.includes('/t:Clean'));

    // Project tasks
    const proj1Task = tasks[3];
    assert.ok(proj1Task.name.includes('Build Project (App [Debug|x64])'));
    const proj2Task = tasks[4];
    assert.ok(proj2Task.name.includes('Build Project (MathLib [Debug|x64])'));
  });

  it('should return empty task list when no active solution is present', async () => {
    const provider = new SolutionTaskProvider(
      mockDetector,
      () => null,
      () => ({ configuration: 'Debug', platform: 'x64', key: 'Debug|x64' })
    );

    const tasks = await provider.provideTasks();
    assert.strictEqual(tasks.length, 0);
  });

  it('should resolve defined task correctly', async () => {
    const provider = new SolutionTaskProvider(
      mockDetector,
      () => mockSolution,
      () => ({ configuration: 'Release', platform: 'x64', key: 'Release|x64' })
    );

    const definition: MSBuildTaskDefinition = {
      type: 'msbuild',
      solution: 'F:/Projects/App/App.slnx',
      configuration: 'Release',
      platform: 'x64',
      target: 'Rebuild'
    };

    const dummyTask = new vscode.Task(
      definition,
      vscode.TaskScope.Workspace,
      'MSBuild: Rebuild',
      'NovaCpp'
    );

    const resolved = await provider.resolveTask(dummyTask);
    assert.ok(resolved);
    const exec = resolved.execution as vscode.ProcessExecution;
    assert.ok(exec.args.includes('/t:Rebuild'));
    assert.ok(exec.args.includes('/p:Configuration=Release'));
  });
});
