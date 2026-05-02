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

let daemonManager: DaemonManager | null = null;
let installer: ClangdInstaller | null = null;
let detector: CompilerDetector | null = null;
let synthesizer: FlagSynthesizer | null = null;
let taskProvider: NovaCppTaskProvider | null = null;
let cmakeWatcher: CMakeWatcher | null = null;
let inactiveRegionsManager: InactiveRegionsManager | null = null;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  console.log('Activating NovaCpp extension...');

  installer = new ClangdInstaller(context);
  daemonManager = new DaemonManager(context, installer);
  detector = new CompilerDetector();
  const extractor = new SystemIncludeExtractor();
  synthesizer = new FlagSynthesizer(detector, extractor);
  taskProvider = new NovaCppTaskProvider(detector);
  inactiveRegionsManager = new InactiveRegionsManager();

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
    })
  );

  // Start the language server daemon
  await daemonManager.start();
}

export async function deactivate(): Promise<void> {
  if (daemonManager) {
    await daemonManager.stop();
    daemonManager = null;
  }
}
