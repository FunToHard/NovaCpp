import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';

export interface DebugLaunchConfiguration extends vscode.DebugConfiguration {
  name: string;
  type: string;
  request: 'launch' | 'attach';
  program?: string;
  args?: string[];
  stopAtEntry?: boolean;
  cwd?: string;
  environment?: Array<{ name: string; value: string }>;
  externalConsole?: boolean;
  debuggerType?: 'auto' | 'lldb-dap' | 'gdb';
  debuggerPath?: string;
  processId?: string | number;
  sourceFileMap?: Record<string, string>;
  coreDumpPath?: string;
}

export class LaunchGenerator {
  /**
   * Generates the default debug configuration for an active C/C++ file.
   */
  public static createDefaultConfiguration(
    activeFile?: string,
    workspaceRoot?: string
  ): DebugLaunchConfiguration {
    const isWindows = process.platform === 'win32';
    const binaryExt = isWindows ? '.exe' : '';

    let programPath = '${workspaceFolder}/build/${fileBasenameNoExtension}' + binaryExt;

    if (activeFile && workspaceRoot) {
      const parsed = path.parse(activeFile);
      const relativeDir = path.relative(workspaceRoot, parsed.dir);
      // Check if build dir or local dir has the binary
      const buildCandidate = path.join(workspaceRoot, 'build', parsed.name + binaryExt);
      const rootCandidate = path.join(workspaceRoot, parsed.name + binaryExt);
      const sameDirCandidate = path.join(parsed.dir, parsed.name + binaryExt);

      if (fs.existsSync(buildCandidate)) {
        programPath = '${workspaceFolder}/build/' + parsed.name + binaryExt;
      } else if (fs.existsSync(rootCandidate)) {
        programPath = '${workspaceFolder}/' + parsed.name + binaryExt;
      } else if (fs.existsSync(sameDirCandidate)) {
        programPath = path.join('${workspaceFolder}', relativeDir, parsed.name + binaryExt).replace(/\\/g, '/');
      }
    }

    return {
      name: 'NovaCpp: Debug Active File',
      type: 'novacpp-debug',
      request: 'launch',
      program: programPath,
      args: [],
      stopAtEntry: false,
      cwd: '${workspaceFolder}',
      environment: [],
      externalConsole: false,
      debuggerType: 'auto'
    };
  }

  /**
   * Generates default attach-to-process configuration using process picker.
   */
  public static createAttachConfiguration(
    processId: string = '${command:novacpp.pickProcess}'
  ): DebugLaunchConfiguration {
    return {
      name: 'NovaCpp: Attach to Process',
      type: 'novacpp-debug',
      request: 'attach',
      processId,
      debuggerType: 'auto'
    };
  }

  /**
   * Resolves configuration variables like ${workspaceFolder}, ${fileBasenameNoExtension}, etc.
   */
  public static resolveVariables(
    value: string,
    activeFile?: string,
    workspaceRoot?: string
  ): string {
    let resolved = value;

    if (workspaceRoot) {
      resolved = resolved.replace(/\$\{workspaceFolder\}/g, workspaceRoot);
    }

    if (activeFile) {
      const parsed = path.parse(activeFile);
      resolved = resolved.replace(/\$\{file\}/g, activeFile);
      resolved = resolved.replace(/\$\{fileBasename\}/g, parsed.base);
      resolved = resolved.replace(/\$\{fileBasenameNoExtension\}/g, parsed.name);
      resolved = resolved.replace(/\$\{fileDirname\}/g, parsed.dir);
      resolved = resolved.replace(/\$\{fileExtname\}/g, parsed.ext);
    }

    return resolved;
  }

  /**
   * Scaffolds `.vscode/launch.json` in the given workspace directory if missing.
   */
  public static async scaffoldLaunchJson(workspaceRoot: string): Promise<string> {
    const vscodeDir = path.join(workspaceRoot, '.vscode');
    if (!fs.existsSync(vscodeDir)) {
      fs.mkdirSync(vscodeDir, { recursive: true });
    }

    const launchFile = path.join(vscodeDir, 'launch.json');
    if (fs.existsSync(launchFile)) {
      return launchFile;
    }

    const config = {
      version: '0.2.0',
      configurations: [this.createDefaultConfiguration(undefined, workspaceRoot)]
    };

    fs.writeFileSync(launchFile, JSON.stringify(config, null, 4), 'utf8');
    return launchFile;
  }
}
