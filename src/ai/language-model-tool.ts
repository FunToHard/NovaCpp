import * as vscode from 'vscode';
import * as path from 'path';
import { CompilerDetector } from '../prober/compiler-detector';
import { SolutionManager } from '../solution/solution-manager';
import { VcpkgAdvisor } from '../ecosystem/vcpkg-advisor';

export interface CppProjectContext {
  language: string;
  standard: string;
  compilerName: string;
  compilerFamily: string;
  architecture: string;
  platform: string;
  solution?: {
    name: string;
    format: string;
    configuration: string;
  };
  vcpkgRoot?: string;
  activeFile?: string;
}

export class NovaCppConfigurationTool {
  constructor(
    private readonly detector: CompilerDetector,
    private readonly solutionManager?: SolutionManager | null
  ) {}

  /**
   * Builds high-density C/C++ project metadata for Language Models (Copilot, etc.).
   */
  public async getProjectContext(): Promise<CppProjectContext> {
    const editor = vscode.window.activeTextEditor;
    const doc = editor?.document;

    let language = 'C++';
    if (doc?.languageId === 'c') {
      language = 'C';
    } else if (doc?.languageId === 'cuda-cpp') {
      language = 'CUDA C++';
    }

    const config = vscode.workspace.getConfiguration('novacpp');
    const standard = config.get<string>('cppStandard', 'c++20');

    let compilerName = 'Auto-detected';
    let compilerFamily = 'msvc';
    let architecture = process.arch === 'x64' ? 'x64' : 'x86';

    try {
      const preferred = await this.detector.getPreferredCompiler();
      if (preferred) {
        compilerName = preferred.name;
        compilerFamily = preferred.type;
        architecture = preferred.is64Bit ? 'x64' : 'x86';
      }
    } catch {
      // Ignore
    }

    let solutionInfo: CppProjectContext['solution'] | undefined;
    if (this.solutionManager) {
      const activeSol = this.solutionManager.getActiveSolution();
      if (activeSol) {
        solutionInfo = {
          name: activeSol.name,
          format: activeSol.format.toUpperCase(),
          configuration: this.solutionManager.getActiveConfiguration().key
        };
      }
    }

    const wsFolders = vscode.workspace.workspaceFolders;
    const wsRoot = wsFolders?.[0]?.uri.fsPath;
    const vcpkgRoot = VcpkgAdvisor.findVcpkgRoot(wsRoot) ?? undefined;

    return {
      language,
      standard,
      compilerName,
      compilerFamily,
      architecture,
      platform: process.platform,
      solution: solutionInfo,
      vcpkgRoot,
      activeFile: doc ? path.basename(doc.fileName) : undefined
    };
  }

  /**
   * Formats the CppProjectContext into a structured project summary string.
   */
  public formatContextForLlm(ctx: CppProjectContext): string {
    const lines: string[] = [
      `The user is working on a ${ctx.language} project.`,
      `The project targets language standard version ${ctx.standard.toUpperCase()}.`,
      `The project compiles with ${ctx.compilerName} (${ctx.compilerFamily} family).`,
      `The target platform is ${ctx.platform} (${ctx.architecture}).`
    ];

    if (ctx.solution) {
      lines.push(
        `The project is part of Visual Studio Solution '${ctx.solution.name}' (${ctx.solution.format}), active configuration: ${ctx.solution.configuration}.`
      );
    }

    if (ctx.vcpkgRoot) {
      lines.push(`The project has access to vcpkg dependencies located at ${ctx.vcpkgRoot}.`);
    }

    if (ctx.activeFile) {
      lines.push(`The active source file is '${ctx.activeFile}'.`);
    }

    return lines.join('\n');
  }

  /**
   * LanguageModelTool interface implementation (vscode.LanguageModelTool).
   */
  public async invoke(
    _options: any,
    _token: vscode.CancellationToken
  ): Promise<any> {
    const ctx = await this.getProjectContext();
    const formatted = this.formatContextForLlm(ctx);

    if ((vscode as any).LanguageModelToolResult && (vscode as any).LanguageModelTextPart) {
      return new (vscode as any).LanguageModelToolResult([
        new (vscode as any).LanguageModelTextPart(formatted)
      ]);
    }

    return {
      content: [{ type: 'text', value: formatted }]
    };
  }
}
