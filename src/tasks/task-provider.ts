import * as vscode from 'vscode';
import { CompilerDetector } from '../prober/compiler-detector';
import { isCppFile, getOutputBinaryPath, createBuildExecution } from './runner';

export interface NovaCppTaskDefinition extends vscode.TaskDefinition {
  type: 'novacpp';
  task: string;
  file?: string;
}

export class NovaCppTaskProvider implements vscode.TaskProvider {
  static readonly taskType = 'novacpp';

  constructor(private readonly detector: CompilerDetector = new CompilerDetector()) {}

  public async provideTasks(): Promise<vscode.Task[]> {
    const tasks: vscode.Task[] = [];
    const editor = vscode.window.activeTextEditor;

    if (!editor || !isCppFile(editor.document)) {
      return tasks;
    }

    const activeFile = editor.document.fileName;
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    const workspaceRoot = workspaceFolder ? workspaceFolder.uri.fsPath : undefined;

    const compiler = await this.detector.getPreferredCompiler();
    if (!compiler) {
      return tasks;
    }

    const config = vscode.workspace.getConfiguration('novacpp');
    const standard = config.get<string>('cppStandard') ?? 'c++20';

    const outputFile = getOutputBinaryPath(activeFile, workspaceRoot);
    const execution = createBuildExecution(compiler, activeFile, outputFile, standard);
    const problemMatchers = compiler.type === 'msvc' ? ['$msvc'] : ['$gcc'];

    const taskDefinition: NovaCppTaskDefinition = {
      type: NovaCppTaskProvider.taskType,
      task: 'buildActiveFile',
      file: activeFile
    };

    const task = new vscode.Task(
      taskDefinition,
      workspaceFolder ?? vscode.TaskScope.Workspace,
      'C/C++: Build Active File',
      'NovaCpp',
      execution,
      problemMatchers
    );

    task.group = (vscode as any).TaskGroup?.Build ?? { isDefault: true };
    tasks.push(task);

    return tasks;
  }

  public async resolveTask(task: vscode.Task): Promise<vscode.Task | undefined> {
    const definition = task.definition as NovaCppTaskDefinition;
    if (definition.type !== NovaCppTaskProvider.taskType) {
      return undefined;
    }

    const editor = vscode.window.activeTextEditor;
    const targetFile = definition.file ?? (editor && isCppFile(editor.document) ? editor.document.fileName : undefined);

    if (!targetFile) {
      return undefined;
    }

    const compiler = await this.detector.getPreferredCompiler();
    if (!compiler) {
      return undefined;
    }

    const config = vscode.workspace.getConfiguration('novacpp');
    const standard = config.get<string>('cppStandard') ?? 'c++20';

    const outputFile = getOutputBinaryPath(targetFile);
    const execution = createBuildExecution(compiler, targetFile, outputFile, standard);
    const problemMatchers = compiler.type === 'msvc' ? ['$msvc'] : ['$gcc'];

    const resolved = new vscode.Task(
      definition,
      task.scope ?? vscode.TaskScope.Workspace,
      task.name || 'C/C++: Build Active File',
      'NovaCpp',
      execution,
      problemMatchers
    );

    resolved.group = (vscode as any).TaskGroup?.Build ?? { isDefault: true };
    return resolved;
  }
}
