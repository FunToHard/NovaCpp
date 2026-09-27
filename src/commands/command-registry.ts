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
 * Registers all 40 TurboCpp user-facing commands and returns their disposables.
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
    vscode.commands.registerCommand('turbocpp.openSettings', () => {
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
    vscode.commands.registerCommand('turbocpp.inspectMemoryLayout', () => {
      memoryLayoutInspector.inspectCurrentStruct();
    }),
    vscode.commands.registerCommand('turbocpp.analyzeIncludes', () => {
      includeVisualizer.analyzeActiveDocument();
    }),
    vscode.commands.registerCommand('turbocpp.visualizeTimeTrace', async (uri?: vscode.Uri) => {
      await includeVisualizer.visualizeTimeTraceFile(uri);
    }),
    vscode.commands.registerCommand('turbocpp.refreshTests', async () => {
      const count = await testController.refreshAll();
      vscode.window.showInformationMessage(`TurboCpp: Discovered ${count} C/C++ unit test(s).`);
    }),
    vscode.commands.registerCommand('turbocpp.expandMacro', () => {
      macroEvaluator.expandMacroAtCursor();
    }),
    vscode.commands.registerCommand('turbocpp.evaluateConstexpr', () => {
      macroEvaluator.evaluateConstexprAtCursor();
    }),
    vscode.commands.registerCommand('turbocpp.viewDisassembly', async () => {
      await disasmProvider.openDisassemblyForActiveEditor();
    }),
    vscode.commands.registerCommand('turbocpp.setDisassemblyOptimizationLevel', async () => {
      const selected = await vscode.window.showQuickPick(['O0', 'O1', 'O2', 'O3', 'Os', 'Ofast'], {
        placeHolder: 'Select compiler optimization level for disassembly'
      });
      if (selected) {
        disasmProvider.setOptimizationLevel(selected as any);
        vscode.window.showInformationMessage(`TurboCpp: Disassembly optimization set to -${selected}.`);
      }
    }),
    vscode.commands.registerCommand('turbocpp.showTypeHierarchy', () => {
      hierarchyManager.showTypeHierarchy();
    }),
    vscode.commands.registerCommand('turbocpp.restartServer', async () => {
      await daemonManager?.restart();
    }),
    vscode.commands.registerCommand('turbocpp.toggleDimInactiveRegions', async () => {
      const config = vscode.workspace.getConfiguration('turbocpp');
      const current = config.get<boolean>('inactiveRegionsDimming', true);
      await config.update('inactiveRegionsDimming', !current, vscode.ConfigurationTarget.Global);
      vscode.window.showInformationMessage(
        `TurboCpp: Inactive regions dimming ${!current ? 'enabled' : 'disabled'}.`
      );
    }),
    vscode.commands.registerCommand('turbocpp.switchSourceHeader', async () => {
      const switched = await SmartDefinitionManager.switchSourceHeader();
      if (!switched && daemonManager) {
        await daemonManager.switchSourceHeader();
      }
    }),
    vscode.commands.registerCommand('turbocpp.installClangd', async () => {
      try {
        await installer?.installLatest();
        vscode.window.showInformationMessage('TurboCpp: clangd installed successfully. Restarting server...');
        await daemonManager?.restart();
      } catch (err: any) {
        vscode.window.showErrorMessage(`TurboCpp: Installation failed: ${err.message ?? err}`);
      }
    }),
    vscode.commands.registerCommand('turbocpp.detectCompilers', async () => {
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
    vscode.commands.registerCommand('turbocpp.generateCompileFlags', async () => {
      if (!synthesizer) return;
      const folders = vscode.workspace.workspaceFolders;
      if (!folders || folders.length === 0) {
        vscode.window.showErrorMessage('TurboCpp: No workspace folder open.');
        return;
      }
      try {
        const generated = await synthesizer.synthesizeFlagsFile(folders[0].uri.fsPath, {
          forceOverwrite: true
        });
        vscode.window.showInformationMessage(
          `TurboCpp: Generated compile_flags.txt at ${generated}`
        );
        await daemonManager?.restart();
      } catch (err: any) {
        vscode.window.showErrorMessage(`TurboCpp: Error generating flags: ${err.message ?? err}`);
      }
    }),
    vscode.commands.registerCommand('turbocpp.runFile', async () => {
      await runController?.runFile();
    }),
    vscode.commands.registerCommand('turbocpp.debugFile', async () => {
      await runController?.debugFile();
    }),
    vscode.commands.registerCommand('turbocpp.openDocs', async (urlOrSymbol?: string) => {
      await SmartDefinitionManager.openDocumentation(urlOrSymbol);
    }),
    vscode.commands.registerCommand(
      'turbocpp.onStlItemAccepted',
      async (symbolKey: string, chainedCommand?: vscode.Command) => {
        stlCollector?.recordCompletionAccepted({ label: symbolKey });
        if (chainedCommand) {
          await vscode.commands.executeCommand(chainedCommand.command, ...(chainedCommand.arguments ?? []));
        }
      }
    ),
    vscode.commands.registerCommand('turbocpp.inspectTelemetry', () => {
      const counts = stlCollector?.getPendingCounts() ?? {};
      const totalSymbols = Object.keys(counts).length;
      const totalInvocations = Object.values(counts).reduce((a, b) => a + b, 0);
      const channel = getTelemetryOutputChannel();
      channel.clear();
      channel.appendLine('=== TurboCpp Anonymous STL Telemetry Buffer ===');
      channel.appendLine(`Tracked Distinct Symbols : ${totalSymbols}`);
      channel.appendLine(`Total Recorded Calls     : ${totalInvocations}`);
      channel.appendLine('Privacy Policy           : ISO C++ Standard Library Allowlist (Zero Code / Zero PII)');
      channel.appendLine('--------------------------------------------------------------------------------');
      channel.appendLine(JSON.stringify(counts, null, 2));
      channel.show();
    }),
    vscode.commands.registerCommand('turbocpp.flushTelemetry', async () => {
      const success = await batchDispatcher?.flushNow(1);
      vscode.window.showInformationMessage(
        `TurboCpp: Telemetry batch ${success ? 'transmitted to server' : 'saved to offline queue'}.`
      );
    }),
    vscode.commands.registerCommand('turbocpp.solutionMenu', async () => {
      await solutionManager?.showSolutionMenu();
    }),
    vscode.commands.registerCommand('turbocpp.selectSolution', async () => {
      await solutionManager?.selectSolution();
    }),
    vscode.commands.registerCommand('turbocpp.selectSolutionConfiguration', async () => {
      await solutionManager?.selectConfiguration();
    }),
    vscode.commands.registerCommand('turbocpp.buildSolution', async () => {
      await solutionManager?.runMSBuildTask('Build');
    }),
    vscode.commands.registerCommand('turbocpp.rebuildSolution', async () => {
      await solutionManager?.runMSBuildTask('Rebuild');
    }),
    vscode.commands.registerCommand('turbocpp.cleanSolution', async () => {
      await solutionManager?.runMSBuildTask('Clean');
    }),
    vscode.commands.registerCommand('turbocpp.generateCompilationDbFromSolution', async () => {
      const generated = await solutionManager?.synthesizeCompilationDatabase();
      if (generated) {
        vscode.window.showInformationMessage(`TurboCpp: Generated compile_commands.json at ${generated}`);
      } else {
        vscode.window.showWarningMessage(
          'TurboCpp: No solution or project files found to generate compile_commands.json.'
        );
      }
    }),
    vscode.commands.registerCommand('turbocpp.logDiagnostics', async () => {
      if (!detector || !extractor) return;
      await DiagnosticsLogger.logDiagnostics(detector, extractor, solutionManager, stlCollector);
    }),
    vscode.commands.registerCommand('turbocpp.resetIndex', async () => {
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
    vscode.commands.registerCommand('turbocpp.goToNextDirectiveInGroup', async () => {
      await DirectiveNavigator.goToNextDirective();
    }),
    vscode.commands.registerCommand('turbocpp.goToPrevDirectiveInGroup', async () => {
      await DirectiveNavigator.goToPrevDirective();
    }),
    vscode.commands.registerCommand('turbocpp.generateDoxygenComment', async () => {
      await DoxygenGenerator.generateForActiveEditor();
    }),
    vscode.commands.registerCommand('turbocpp.runClangTidyOnActiveFile', async () => {
      await ClangTidyManager.getInstance().runOnActiveFile();
    }),
    vscode.commands.registerCommand('turbocpp.clearCodeAnalysisDiagnostics', () => {
      ClangTidyManager.getInstance().clearDiagnostics();
    }),
    vscode.commands.registerCommand('turbocpp.setVsDeveloperEnvironment', async () => {
      if (!detector) return;
      await VsEnvironmentManager.setVsDeveloperEnvironment(context, detector);
    }),
    vscode.commands.registerCommand('turbocpp.clearVsDeveloperEnvironment', () => {
      VsEnvironmentManager.clearVsDeveloperEnvironment(context);
    }),
    vscode.commands.registerCommand('turbocpp.copyToClipboard', async (text: string) => {
      await vscode.env.clipboard.writeText(text);
      vscode.window.showInformationMessage(`TurboCpp: Copied "${text}" to clipboard.`);
    }),
    vscode.commands.registerCommand('turbocpp.runInTerminal', (command: string) => {
      if (typeof command !== 'string' || !command.trim()) {
        vscode.window.showWarningMessage('TurboCpp: Cannot execute empty terminal command.');
        return;
      }
      const trimmed = command.trim();
      if (/[\r\n]/.test(trimmed)) {
        vscode.window.showErrorMessage('TurboCpp: Multiline commands are not permitted.');
        return;
      }
      const allowedPrefixes = ['vcpkg ', 'conan ', 'vcpkg.exe ', 'conan.exe '];
      const isAllowedPrefix = allowedPrefixes.some((prefix) => trimmed.startsWith(prefix));
      if (!isAllowedPrefix) {
        vscode.window.showErrorMessage(`TurboCpp: Command '${trimmed}' is not an authorized package manager command.`);
        return;
      }
      if (/[;&|`$]/.test(trimmed)) {
        vscode.window.showErrorMessage('TurboCpp: Command contains disallowed shell metacharacters.');
        return;
      }
      const term = vscode.window.createTerminal('TurboCpp Package Manager');
      term.show();
      term.sendText(trimmed);
    }),
    vscode.commands.registerCommand('turbocpp.selectProfile', async () => {
      await profileManager?.selectProfile();
    }),
    vscode.commands.registerCommand('turbocpp.pickProcess', async () => {
      return await ProcessPicker.pickProcess();
    }),
    vscode.commands.registerCommand('turbocpp.cmake.menu', async () => {
      await cmakeManager?.openMenu();
    }),
    vscode.commands.registerCommand('turbocpp.cmake.rescan', async () => {
      await cmakeManager?.refresh();
      vscode.window.showInformationMessage('TurboCpp: Re-scanned CMakeLists.txt and updated include paths.');
    }),
    vscode.commands.registerCommand('turbocpp.cmake.generateCompilationDatabase', async () => {
      const target = await cmakeManager?.synthesizeCompilationDatabase();
      if (target) {
        vscode.window.showInformationMessage(`TurboCpp: Generated compile_commands.json from CMakeLists.txt at ${target}`);
      } else {
        vscode.window.showWarningMessage('TurboCpp: Could not generate compile_commands.json.');
      }
    })
  ];
}
