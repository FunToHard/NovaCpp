import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { CompilerDetector, CompilerInfo } from '../prober/compiler-detector';
import { SystemIncludeExtractor } from '../prober/system-includes';
import { SolutionManager } from '../solution/solution-manager';
import { StlUsageCollector } from '../telemetry/stl-collector';

export class DiagnosticsLogger {
  private static channel: vscode.OutputChannel | null = null;

  public static getChannel(): vscode.OutputChannel {
    if (!this.channel) {
      this.channel = vscode.window.createOutputChannel('NovaCpp Diagnostics');
    }
    return this.channel;
  }

  /**
   * Generates a comprehensive diagnostic report of active compilers, flags,
   * includes, solutions, and language server status.
   */
  public static async logDiagnostics(
    detector: CompilerDetector,
    extractor: SystemIncludeExtractor,
    solutionManager?: SolutionManager | null,
    stlCollector?: StlUsageCollector | null
  ): Promise<string> {
    const channel = this.getChannel();
    channel.clear();

    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const lines: string[] = [];

    lines.push(`-------- NovaCpp Diagnostics - ${timestamp} --------`);
    lines.push(`NovaCpp Extension Version : 0.1.0`);
    lines.push(`VS Code Version           : ${vscode.version}`);
    lines.push(`Operating System          : ${process.platform} (${process.arch})`);

    const activeEditor = vscode.window.activeTextEditor;
    const activeDoc = activeEditor?.document;
    const workspaceFolders = vscode.workspace.workspaceFolders;
    const rootPath = workspaceFolders?.[0]?.uri.fsPath ?? 'None';

    lines.push(`Workspace Root            : ${rootPath}`);
    lines.push(`Active Document           : ${activeDoc ? activeDoc.fileName : 'None'}`);
    lines.push(`Document Language ID      : ${activeDoc ? activeDoc.languageId : 'None'}`);

    lines.push('');
    lines.push('--- [1] Compiler & Toolchain Discovery ---');
    try {
      const preferred = await detector.getPreferredCompiler();
      if (preferred) {
        lines.push(`Preferred Compiler        : ${preferred.name}`);
        lines.push(`Compiler Binary Path      : ${preferred.path}`);
        lines.push(`Compiler Family           : ${preferred.type}`);
        lines.push(`Architecture              : ${preferred.is64Bit ? 'x64' : 'x86'}`);
        if (preferred.version) {
          lines.push(`Toolchain Version         : ${preferred.version}`);
        }
        if (preferred.windowsSdkVersion) {
          lines.push(`Windows SDK Version       : ${preferred.windowsSdkVersion}`);
        }
        if (preferred.windowsSdkDir) {
          lines.push(`Windows SDK Directory     : ${preferred.windowsSdkDir}`);
        }

        const msbuild = detector.findMsBuild();
        lines.push(`MSBuild Executable        : ${msbuild ?? 'Not detected'}`);

        lines.push('');
        lines.push('--- [2] Discovered System Includes ---');
        const systemIncludes = await extractor.extractSystemIncludes(preferred);
        if (systemIncludes.length > 0) {
          for (const inc of systemIncludes) {
            lines.push(`  + ${inc}`);
          }
        } else {
          lines.push('  (No system includes returned from compiler probe)');
        }
      } else {
        lines.push('No viable C/C++ compiler detected on system.');
      }
    } catch (err: any) {
      lines.push(`Compiler probing failed: ${err.message ?? err}`);
    }

    lines.push('');
    lines.push('--- [3] Visual Studio Solution Subsystem ---');
    if (solutionManager) {
      const activeSolution = solutionManager.getActiveSolution();
      if (activeSolution) {
        lines.push(`Active Solution           : ${activeSolution.name} (${activeSolution.format.toUpperCase()})`);
        lines.push(`Solution Path             : ${activeSolution.filePath}`);
        lines.push(`Active Configuration      : ${solutionManager.getActiveConfiguration().key}`);
        lines.push(`Referenced Projects (${activeSolution.projects.length}) :`);
        for (const p of activeSolution.projects) {
          lines.push(`  * ${p.name} -> ${p.relativePath}`);
        }
      } else {
        lines.push('No Visual Studio Solution (.sln / .slnx) active in workspace.');
      }
    } else {
      lines.push('Solution manager inactive.');
    }

    lines.push('');
    lines.push('--- [4] Compilation Database Status ---');
    if (rootPath !== 'None') {
      const compCommands = path.join(rootPath, 'compile_commands.json');
      const compFlags = path.join(rootPath, 'compile_flags.txt');
      const buildCompCommands = path.join(rootPath, 'build', 'compile_commands.json');

      try {
        if (fs.existsSync(compCommands)) {
          const stats = fs.statSync(compCommands);
          lines.push(`Found: ${compCommands} (${stats.size} bytes)`);
        } else if (fs.existsSync(buildCompCommands)) {
          const stats = fs.statSync(buildCompCommands);
          lines.push(`Found: ${buildCompCommands} (${stats.size} bytes)`);
        } else if (fs.existsSync(compFlags)) {
          const stats = fs.statSync(compFlags);
          lines.push(`Found: ${compFlags} (${stats.size} bytes)`);
        } else {
          lines.push('No compile_commands.json or compile_flags.txt in root or build/.');
        }
      } catch (err: any) {
        lines.push(`Error checking compilation database: ${err.message ?? err}`);
      }
    }

    lines.push('');
    lines.push('--- [5] Telemetry & Usage Collector ---');
    if (stlCollector) {
      const counts = stlCollector.getPendingCounts();
      const distinctSymbols = Object.keys(counts).length;
      const totalInvocations = Object.values(counts).reduce((a, b) => a + b, 0);
      lines.push(`Telemetry Allowed         : ${stlCollector.isTelemetryAllowed()}`);
      lines.push(`Distinct Symbols Tracked  : ${distinctSymbols}`);
      lines.push(`Total Usage Events        : ${totalInvocations}`);
    } else {
      lines.push('Telemetry collector inactive.');
    }

    lines.push('-----------------------------------------------------------');

    const report = lines.join('\n');
    channel.appendLine(report);
    channel.show(true);

    return report;
  }
}
