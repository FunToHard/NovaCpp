import * as vscode from 'vscode';
import { DaemonManager } from '../substrate/daemon-manager';
import { ClangdInstaller } from '../substrate/installer';
import { CompilerDetector } from '../prober/compiler-detector';
import { SystemIncludeExtractor } from '../prober/system-includes';
import { FlagSynthesizer } from '../prober/flag-synthesizer';
import { RunController } from '../tasks/run-controller';
import { StlUsageCollector } from '../telemetry/stl-collector';
import { BatchDispatcher } from '../telemetry/batch-dispatcher';
import { SolutionManager } from '../solution/solution-manager';
import { ProfileManager } from '../config/profile-manager';
import { CMakeManager } from '../cmake/cmake-manager';
import { MemoryLayoutInspector } from '../inspector/memory-layout-inspector';
import { IncludeVisualizerManager } from '../analysis/include-visualizer';
import { CppTestController } from '../testing/test-controller';
import { MacroEvaluatorManager } from '../intelligence/macro-evaluator';
import { DisassemblyContentProvider } from '../compiler/disassembly-view';
import { HierarchyGraphManager } from '../hierarchy/hierarchy-graph';
import { ConfigPanel } from '../webview/config-panel';
import { SmartDefinitionManager } from '../intelligence/smart-definition';
import { DiagnosticsLogger } from '../diagnostics/diagnostics-logger';
import { IndexManager } from '../diagnostics/index-manager';
import { DirectiveNavigator } from '../navigation/directive-navigator';
import { DoxygenGenerator } from '../documentation/doxygen-generator';
import { ClangTidyManager } from '../analysis/clang-tidy-manager';
import { VsEnvironmentManager } from '../tasks/vs-environment-manager';
import { ProcessPicker } from '../debugger/process-picker';

export interface CommandRegistryContext {
  extensionContext: vscode.ExtensionContext;
  daemonManager: DaemonManager | null;
  installer: ClangdInstaller | null;
  detector: CompilerDetector | null;
  extractor: SystemIncludeExtractor | null;
  synthesizer: FlagSynthesizer | null;
  runController: RunController | null;
  stlCollector: StlUsageCollector | null;
  batchDispatcher: BatchDispatcher | null;
  solutionManager: SolutionManager | null;
  profileManager: ProfileManager | null;
  cmakeManager: CMakeManager | null;
  memoryLayoutInspector: MemoryLayoutInspector;
  includeVisualizer: IncludeVisualizerManager;
  testController: CppTestController;
  macroEvaluator: MacroEvaluatorManager;
  disasmProvider: DisassemblyContentProvider;
  hierarchyManager: HierarchyGraphManager;
  getTelemetryOutputChannel: () => vscode.OutputChannel;
}

/**
 * Registers all 40 NovaCpp user-facing commands and returns their disposables.
 */
export function registerAllCommands(ctx: CommandRegistryContext): vscode.Disposable[] {
  const {
    extensionContext: context,
    daemonManager,
    installer,
    detector,
    extractor,
    synthesizer,
    runController,
    stlCollector,
    batchDispatcher,
    solutionManager,
    profileManager,
    cmakeManager,
    memoryLayoutInspector,
    includeVisualizer,
    testController,
    macroEvaluator,
    disasmProvider,
    hierarchyManager,
    getTelemetryOutputChannel
  } = ctx;

  return [
    vscode.commands.registerCommand('novacpp.openSettings', () => {
      if (!detector || !synthesizer) return;
      ConfigPanel.render(
        context.extensionUri,
        detector,
        synthesizer,
        async () => {
          await daemonManager?.restart();
        }
      );
    }),
    vscode.commands.registerCommand('novacpp.inspectMemoryLayout', () => {
      memoryLayoutInspector.inspectCurrentStruct();
    }),
    vscode.commands.registerCommand('novacpp.analyzeIncludes', () => {
      includeVisualizer.analyzeActiveDocument();
    }),
    vscode.commands.registerCommand('novacpp.visualizeTimeTrace', async (uri?: vscode.Uri) => {
      await includeVisualizer.visualizeTimeTraceFile(uri);
    }),
    vscode.commands.registerCommand('novacpp.refreshTests', async () => {
      const count = await testController.refreshAll();
      vscode.window.showInformationMessage(`NovaCpp: Discovered ${count} C/C++ unit test(s).`);
    }),
    vscode.commands.registerCommand('novacpp.expandMacro', () => {
      macroEvaluator.expandMacroAtCursor();
    }),
    vscode.commands.registerCommand('novacpp.evaluateConstexpr', () => {
      macroEvaluator.evaluateConstexprAtCursor();
    }),
    vscode.commands.registerCommand('novacpp.viewDisassembly', async () => {
      await disasmProvider.openDisassemblyForActiveEditor();
    }),
    vscode.commands.registerCommand('novacpp.setDisassemblyOptimizationLevel', async () => {
      const selected = await vscode.window.showQuickPick(['O0', 'O1', 'O2', 'O3', 'Os', 'Ofast'], {
        placeHolder: 'Select compiler optimization level for disassembly'
      });
      if (selected) {
        disasmProvider.setOptimizationLevel(selected as any);
        vscode.window.showInformationMessage(`NovaCpp: Disassembly optimization set to -${selected}.`);
      }
    }),
    vscode.commands.registerCommand('novacpp.showTypeHierarchy', () => {
      hierarchyManager.showTypeHierarchy();
    }),
    vscode.commands.registerCommand('novacpp.restartServer', async () => {
      await daemonManager?.restart();
    }),
    vscode.commands.registerCommand('novacpp.toggleDimInactiveRegions', async () => {
      const config = vscode.workspace.getConfiguration('novacpp');
      const current = config.get<boolean>('inactiveRegionsDimming', true);
      await config.update('inactiveRegionsDimming', !current, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `NovaCpp: Inactive regions dimming ${!current ? 'enabled' : 'disabled'}.`
      );
    }),
    vscode.commands.registerCommand('novacpp.switchSourceHeader', async () => {
      const switched = await SmartDefinitionManager.switchSourceHeader();
      if (!switched && daemonManager) {
        await daemonManager.switchSourceHeader();
      }
    }),
    vscode.commands.registerCommand('novacpp.installClangd', async () => {
      try {
        await installer?.installLatest();
        vscode.window.showInformationMessage('NovaCpp: clangd installed successfully. Restarting server...');
        await daemonManager?.restart();
      } catch (err: any) {
        vscode.window.showErrorMessage(`NovaCpp: Installation failed: ${err.message ?? err}`);
      }
    }),
    vscode.commands.registerCommand('novacpp.detectCompilers', async () => {
      if (!detector) return;
      const compilers = await detector.detectAllCompilers(true);
      const items = compilers.map((c) => ({
        label: c.name,
        description: c.path,
        detail: `Type: ${c.type}${c.version ? ` | Version: ${c.version}` : ''}`
      }));
      vscode.window.showQuickPick(items, {
        placeHolder: `Detected ${compilers.length} C/C++ Compilers`
      });
    }),
    vscode.commands.registerCommand('novacpp.generateCompileFlags', async () => {
      if (!synthesizer) return;
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('NovaCpp: No workspace folder open.');
        return;
      }
      try {
        const generated = await synthesizer.synthesizeFlagsFile(folders[0].uri.fsPath, {
          forceOverwrite: true
        });
        vscode.window.showInformationMessage(
          `NovaCpp: Generated compile_flags.txt at ${generated}`
        );
        await daemonManager?.restart();
      } catch (err: any) {
        vscode.window.showErrorMessage(`NovaCpp: Error generating flags: ${err.message ?? err}`);
      }
    }),
    vscode.commands.registerCommand('novacpp.runFile', async () => {
      await runController?.runFile();
    }),
    vscode.commands.registerCommand('novacpp.debugFile', async () => {
      await runController?.debugFile();
    }),
    vscode.commands.registerCommand('novacpp.openDocs', async (urlOrSymbol?: string) => {
      await SmartDefinitionManager.openDocumentation(urlOrSymbol);
    }),
    vscode.commands.registerCommand(
      'novacpp.onStlItemAccepted',
      async (symbolKey: string, chainedCommand?: vscode.Command) => {
        stlCollector?.recordCompletionAccepted({ label: symbolKey });
        if (chainedCommand) {
          await vscode.commands.executeCommand(chainedCommand.command, ...(chainedCommand.arguments ?? []));
        }
      }
    ),
    vscode.commands.registerCommand('novacpp.inspectTelemetry', () => {
      const counts = stlCollector?.getPendingCounts() ?? {};
      const totalSymbols = Object.keys(counts).length;
      const totalInvocations = Object.values(counts).reduce((a, b) => a + b, 0);
      const channel = getTelemetryOutputChannel();
      channel.clear();
      channel.appendLine('=== NovaCpp Anonymous STL Telemetry Buffer ===');
      channel.appendLine(`Tracked Distinct Symbols : ${totalSymbols}`);
      channel.appendLine(`Total Recorded Calls     : ${totalInvocations}`);
      channel.appendLine('Privacy Policy           : ISO C++ Standard Library Allowlist (Zero Code / Zero PII)');
      channel.appendLine('--------------------------------------------------------------------------------');
      channel.appendLine(JSON.stringify(counts, null, 2));
      channel.show();
    }),
    vscode.commands.registerCommand('novacpp.flushTelemetry', async () => {
      const success = await batchDispatcher?.flushNow(1);
      vscode.window.showInformationMessage(
        `NovaCpp: Telemetry batch ${success ? 'transmitted to server' : 'saved to offline queue'}.`
      );
    }),
    vscode.commands.registerCommand('novacpp.solutionMenu', async () => {
      await solutionManager?.showSolutionMenu();
    }),
    vscode.commands.registerCommand('novacpp.selectSolution', async () => {
      await solutionManager?.selectSolution();
    }),
    vscode.commands.registerCommand('novacpp.selectSolutionConfiguration', async () => {
      await solutionManager?.selectConfiguration();
    }),
    vscode.commands.registerCommand('novacpp.buildSolution', async () => {
      await solutionManager?.runMSBuildTask('Build');
    }),
    vscode.commands.registerCommand('novacpp.rebuildSolution', async () => {
      await solutionManager?.runMSBuildTask('Rebuild');
    }),
    vscode.commands.registerCommand('novacpp.cleanSolution', async () => {
      await solutionManager?.runMSBuildTask('Clean');
    }),
    vscode.commands.registerCommand('novacpp.generateCompilationDbFromSolution', async () => {
      const generated = await solutionManager?.synthesizeCompilationDatabase();
      if (generated) {
        vscode.window.showInformationMessage(`NovaCpp: Generated compile_commands.json at ${generated}`);
      } else {
        vscode.window.showWarningMessage(
          'NovaCpp: No solution or project files found to generate compile_commands.json.'
        );
      }
    }),
    vscode.commands.registerCommand('novacpp.logDiagnostics', async () => {
      if (!detector || !extractor) return;
      await DiagnosticsLogger.logDiagnostics(detector, extractor, solutionManager, stlCollector);
    }),
    vscode.commands.registerCommand('novacpp.resetIndex', async () => {
      await IndexManager.resetIndex(
        undefined,
        async () => {
          await daemonManager?.start();
        },
        async () => {
          await daemonManager?.stop();
        }
      );
    }),
    vscode.commands.registerCommand('novacpp.goToNextDirectiveInGroup', async () => {
      await DirectiveNavigator.goToNextDirective();
    }),
    vscode.commands.registerCommand('novacpp.goToPrevDirectiveInGroup', async () => {
      await DirectiveNavigator.goToPrevDirective();
    }),
    vscode.commands.registerCommand('novacpp.generateDoxygenComment', async () => {
      await DoxygenGenerator.generateForActiveEditor();
    }),
    vscode.commands.registerCommand('novacpp.runClangTidyOnActiveFile', async () => {
      await ClangTidyManager.getInstance().runOnActiveFile();
    }),
    vscode.commands.registerCommand('novacpp.clearCodeAnalysisDiagnostics', () => {
      ClangTidyManager.getInstance().clearDiagnostics();
    }),
    vscode.commands.registerCommand('novacpp.setVsDeveloperEnvironment', async () => {
      if (!detector) return;
      await VsEnvironmentManager.setVsDeveloperEnvironment(context, detector);
    }),
    vscode.commands.registerCommand('novacpp.clearVsDeveloperEnvironment', () => {
      VsEnvironmentManager.clearVsDeveloperEnvironment(context);
    }),
    vscode.commands.registerCommand('novacpp.copyToClipboard', async (text: string) => {
      await vscode.env.clipboard.writeText(text);
      vscode.window.showInformationMessage(`NovaCpp: Copied "${text}" to clipboard.`);
    }),
    vscode.commands.registerCommand('novacpp.runInTerminal', (command: string) => {
      if (typeof command !== 'string' || !command.trim()) {
        vscode.window.showWarningMessage('NovaCpp: Cannot execute empty terminal command.');
        return;
      }
      const trimmed = command.trim();
      if (/[\r\n]/.test(trimmed)) {
        vscode.window.showErrorMessage('NovaCpp: Multiline commands are not permitted.');
        return;
      }
      const allowedPrefixes = ['vcpkg ', 'conan ', 'vcpkg.exe ', 'conan.exe '];
      const isAllowedPrefix = allowedPrefixes.some((prefix) => trimmed.startsWith(prefix));
      if (!isAllowedPrefix) {
        vscode.window.showErrorMessage(`NovaCpp: Command '${trimmed}' is not an authorized package manager command.`);
        return;
      }
      if (/[;&|`$]/.test(trimmed)) {
        vscode.window.showErrorMessage('NovaCpp: Command contains disallowed shell metacharacters.');
        return;
      }
      const term = vscode.window.createTerminal('NovaCpp Package Manager');
      term.show();
      term.sendText(trimmed);
    }),
    vscode.commands.registerCommand('novacpp.selectProfile', async () => {
      await profileManager?.selectProfile();
    }),
    vscode.commands.registerCommand('novacpp.pickProcess', async () => {
      return await ProcessPicker.pickProcess();
    }),
    vscode.commands.registerCommand('novacpp.cmake.menu', async () => {
      await cmakeManager?.openMenu();
    }),
    vscode.commands.registerCommand('novacpp.cmake.rescan', async () => {
      await cmakeManager?.refresh();
      vscode.window.showInformationMessage('NovaCpp: Re-scanned CMakeLists.txt and updated include paths.');
    }),
    vscode.commands.registerCommand('novacpp.cmake.generateCompilationDatabase', async () => {
      const target = await cmakeManager?.synthesizeCompilationDatabase();
      if (target) {
        vscode.window.showInformationMessage(`NovaCpp: Generated compile_commands.json from CMakeLists.txt at ${target}`);
      } else {
        vscode.window.showWarningMessage('NovaCpp: Could not generate compile_commands.json.');
      }
    })
  ];
}
