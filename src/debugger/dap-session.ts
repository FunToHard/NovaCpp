import * as vscode from 'vscode';
import * as fs from 'fs';
import { LldbDapLocator, DebuggerExecutable } from './lldb-dap';
import { LaunchGenerator, DebugLaunchConfiguration } from './launch-generator';

export class NovaCppDebugConfigurationProvider implements vscode.DebugConfigurationProvider {
  provideDebugConfigurations(
    _folder: vscode.WorkspaceFolder | undefined,
    _token?: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.DebugConfiguration[]> {
    return [
      LaunchGenerator.createDefaultConfiguration(),
      LaunchGenerator.createAttachConfiguration()
    ];
  }

  async resolveDebugConfiguration(
    folder: vscode.WorkspaceFolder | undefined,
    config: vscode.DebugConfiguration,
    _token?: vscode.CancellationToken
  ): Promise<vscode.DebugConfiguration | null | undefined> {
    const activeEditor = vscode.window.activeTextEditor;
    const activeFile = activeEditor?.document.fileName;
    const workspaceRoot = folder ? folder.uri.fsPath : undefined;

    // If config is completely empty (e.g. F5 on loose file without launch.json)
    if (!config.type && !config.request && !config.name) {
      if (!activeEditor) {
        vscode.window.showErrorMessage('NovaCpp: Select a C/C++ source file to debug.');
        return null;
      }
      const generated = LaunchGenerator.createDefaultConfiguration(activeFile, workspaceRoot);
      Object.assign(config, generated);
    }

    // Resolve variables in program path, cwd, coreDumpPath, and sourceFileMap
    if (config.program) {
      config.program = LaunchGenerator.resolveVariables(config.program, activeFile, workspaceRoot);
    }
    if (config.cwd) {
      config.cwd = LaunchGenerator.resolveVariables(config.cwd, activeFile, workspaceRoot);
    }
    if (config.coreDumpPath) {
      config.coreDumpPath = LaunchGenerator.resolveVariables(config.coreDumpPath, activeFile, workspaceRoot);
    }
    if (config.sourceFileMap) {
      const remapped: Record<string, string> = {};
      for (const [k, v] of Object.entries(config.sourceFileMap)) {
        remapped[LaunchGenerator.resolveVariables(k, activeFile, workspaceRoot)] =
          LaunchGenerator.resolveVariables(String(v), activeFile, workspaceRoot);
      }
      config.sourceFileMap = remapped;
      if (!config.sourceMap) {
        config.sourceMap = Object.entries(remapped);
      }
    }

    // Handle Attach mode
    if (config.request === 'attach') {
      if (!config.processId) {
        config.processId = '${command:novacpp.pickProcess}';
      } else if (typeof config.processId === 'string' && /^\d+$/.test(config.processId.trim())) {
        config.processId = parseInt(config.processId.trim(), 10);
      }
      return config;
    }

    if (!config.program) {
      vscode.window.showErrorMessage(
        'NovaCpp Debug: Missing "program" property in launch configuration.'
      );
      return null;
    }

    // Check if binary exists
    if (!fs.existsSync(config.program)) {
      const choice = await vscode.window.showWarningMessage(
        `NovaCpp: Target executable not found at "${config.program}". Would you like to build active file first?`,
        'Build and Debug',
        'Cancel'
      );
      if (choice === 'Build and Debug') {
        await vscode.commands.executeCommand('workbench.action.tasks.build');
        if (!fs.existsSync(config.program)) {
          vscode.window.showErrorMessage(`NovaCpp: Build completed but executable still not found.`);
          return null;
        }
      } else {
        return null;
      }
    }

    return config;
  }
}

export class NovaCppDebugAdapterDescriptorFactory
  implements vscode.DebugAdapterDescriptorFactory {
  createDebugAdapterDescriptor(
    session: vscode.DebugSession,
    _executable: vscode.DebugAdapterExecutable | undefined
  ): vscode.ProviderResult<vscode.DebugAdapterDescriptor> {
    const config = session.configuration as DebugLaunchConfiguration;

    const globalSettings = vscode.workspace.getConfiguration('novacpp');
    const customPath = config.debuggerPath || globalSettings.get<string>('debuggerPath');
    const preference = config.debuggerType ?? 'auto';

    const resolved: DebuggerExecutable | null = LldbDapLocator.resolvePreferredDebugger(
      preference,
      customPath
    );

    if (!resolved) {
      const message =
        'NovaCpp: No debugger backend found (lldb-dap or gdb). Please install LLVM or MinGW GDB or configure "novacpp.debuggerPath".';
      vscode.window.showErrorMessage(message);
      throw new Error(message);
    }

    // Return executable debug adapter communicating via stdio
    return new (vscode as any).DebugAdapterExecutable(
      resolved.path,
      resolved.args,
      {
        env: {
          ...process.env
        }
      }
    );
  }
}
