import * as vscode from 'vscode';
import { ClangdInstaller } from './substrate/installer';
import { DaemonManager } from './substrate/daemon-manager';
import { CompilerDetector } from './prober/compiler-detector';
import { SystemIncludeExtractor } from './prober/system-includes';
import { FlagSynthesizer } from './prober/flag-synthesizer';
import {
  NovaCppDebugConfigurationProvider,
  NovaCppDebugAdapterDescriptorFactory
} from './debugger/dap-session';
import { NovaCppTaskProvider } from './tasks/task-provider';
import { ConfigPanel } from './webview/config-panel';
import { CMakeWatcher } from './bridge/cmake-watcher';
import { InactiveRegionsManager } from './bridge/inactive-regions';
import { PostfixCompletionProvider } from './intelligence/postfix-provider';
import { NovaCppCodeActionProvider } from './intelligence/code-actions';
import { SmartDefinitionManager } from './intelligence/smart-definition';
import { InlayHintManager } from './intelligence/inlay-hints';
import { RunController } from './tasks/run-controller';
import { StlUsageCollector } from './telemetry/stl-collector';
import { StlRankingTable } from './telemetry/ranking-table';
import { BatchDispatcher } from './telemetry/batch-dispatcher';
import { SolutionManager } from './solution/solution-manager';
import { SolutionTaskProvider } from './solution/solution-task-provider';

let daemonManager: DaemonManager | null = null;
let installer: ClangdInstaller | null = null;
let detector: CompilerDetector | null = null;
let synthesizer: FlagSynthesizer | null = null;
let taskProvider: NovaCppTaskProvider | null = null;
let cmakeWatcher: CMakeWatcher | null = null;
let inactiveRegionsManager: InactiveRegionsManager | null = null;
let runController: RunController | null = null;
let stlCollector: StlUsageCollector | null = null;
let rankingTable: StlRankingTable | null = null;
let batchDispatcher: BatchDispatcher | null = null;
let solutionManager: SolutionManager | null = null;
let solutionTaskProvider: SolutionTaskProvider | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Activating NovaCpp extension...');

  stlCollector = new StlUsageCollector();
  rankingTable = new StlRankingTable();
  const storagePath = context.globalStorageUri?.fsPath ?? context.storageUri?.fsPath;
  batchDispatcher = new BatchDispatcher(stlCollector, storagePath);
  batchDispatcher.start();

  installer = new ClangdInstaller(context);
  daemonManager = new DaemonManager(context, installer, rankingTable);
  detector = new CompilerDetector();
  const extractor = new SystemIncludeExtractor();
  synthesizer = new FlagSynthesizer(detector, extractor);
  taskProvider = new NovaCppTaskProvider(detector);
  inactiveRegionsManager = new InactiveRegionsManager();
  runController = new RunController(detector);

  // Watch for compilation databases and seamless auto-reload
  cmakeWatcher = new CMakeWatcher(async () => {
    await daemonManager?.restart();
  });

  // Wire inactive regions notification from clangd to inactive regions renderer
  daemonManager.onInactiveRegions((params) => {
    inactiveRegionsManager?.handleInactiveRegions(params);
  });

  context.subscriptions.push(
    daemonManager,
    cmakeWatcher,
    inactiveRegionsManager
  );

  // Register Debugger Subsystem
  const debugConfigProvider = new NovaCppDebugConfigurationProvider();
  const debugAdapterFactory = new NovaCppDebugAdapterDescriptorFactory();

  context.subscriptions.push(
    vscode.debug.registerDebugConfigurationProvider('novacpp-debug', debugConfigProvider),
    vscode.debug.registerDebugAdapterDescriptorFactory('novacpp-debug', debugAdapterFactory)
  );

  // Register Build Task Provider
  context.subscriptions.push(
    vscode.tasks.registerTaskProvider(NovaCppTaskProvider.taskType, taskProvider)
  );

  // Initialize Visual Studio Solution (.sln & .slnx) Subsystem
  solutionManager = new SolutionManager(detector, extractor, async () => {
    await daemonManager?.restart();
  });
  await solutionManager.initialize();

  solutionTaskProvider = new SolutionTaskProvider(
    detector,
    () => solutionManager?.getActiveSolution() ?? null,
    () =>
      solutionManager?.getActiveConfiguration() ?? {
        configuration: 'Debug',
        platform: 'x64',
        key: 'Debug|x64'
      }
  );

  context.subscriptions.push(
    solutionManager,
    vscode.tasks.registerTaskProvider(SolutionTaskProvider.taskType, solutionTaskProvider)
  );

  // Register Advanced Language Providers
  const cppSelector: vscode.DocumentSelector = [
    { language: 'cpp', scheme: 'file' },
    { language: 'c', scheme: 'file' },
    { language: 'cuda-cpp', scheme: 'file' }
  ];

  const postfixProvider = new PostfixCompletionProvider();
  const codeActionProvider = new NovaCppCodeActionProvider();
  const inlayHintManager = new InlayHintManager();

  context.subscriptions.push(
    vscode.languages.registerCompletionItemProvider(
      cppSelector,
      postfixProvider,
      ...PostfixCompletionProvider.triggerCharacters
    ),
    vscode.languages.registerCodeActionsProvider(
      cppSelector,
      codeActionProvider,
      {
        providedCodeActionKinds: NovaCppCodeActionProvider.providedCodeActionKinds
      }
    ),
    inlayHintManager
  );

  // Auto-synthesize compile_flags.txt if missing in workspace root
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (workspaceFolders && workspaceFolders.length > 0) {
    const rootPath = workspaceFolders[0].uri.fsPath;
    try {
      const generated = await synthesizer.synthesizeFlagsFile(rootPath);
      if (generated) {
        console.log(`NovaCpp: Synthesized compile_flags.txt at ${generated}`);
      }
    } catch (err) {
      console.warn('NovaCpp: Could not auto-synthesize compile_flags.txt:', err);
    }
  }

  // Register Commands
  context.subscriptions.push(
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
    vscode.commands.registerCommand('novacpp.restartServer', async () => {
      await daemonManager?.restart();
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
      const channel = vscode.window.createOutputChannel('NovaCpp Telemetry Buffer');
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
    })
  );

  // On-Save Scanner: Passively scan C++ source files for STL references
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!stlCollector?.isTelemetryAllowed()) return;
      if (doc.languageId !== 'cpp' && doc.languageId !== 'c') return;
      const text = doc.getText();
      const matches = text.matchAll(/\bstd::(?:ranges::|views::|chrono::|filesystem::)?[a-zA-Z0-9_]+(?:::?[a-zA-Z0-9_]+)*/g);
      for (const match of matches) {
        stlCollector.recordAstCall(match[0]);
      }
    })
  );

  // Start the language server daemon
  await daemonManager.start();
}

export async function deactivate(): Promise<void> {
  if (solutionManager) {
    solutionManager.dispose();
    solutionManager = null;
  }
  if (batchDispatcher) {
    await batchDispatcher.flushNow();
    batchDispatcher.dispose();
    batchDispatcher = null;
  }
  if (daemonManager) {
    await daemonManager.stop();
    daemonManager = null;
  }
}

