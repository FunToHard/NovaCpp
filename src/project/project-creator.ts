import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import {
  ProjectCreationOptions,
  ProjectTemplateType,
  ProjectBuildSystem,
  LanguageType,
  CppStandard,
  CStandard,
  TestFramework,
  ProjectScaffoldResult
} from './project-types';
import { generateProjectFiles } from './template-files';
import { CompilerDetector } from '../prober/compiler-detector';

export class ProjectCreator {
  /**
   * Scaffolds a new project on disk given creation options.
   * Can be invoked programmatically without VS Code UI dependencies (e.g. in unit tests).
   */
  public static async scaffold(opts: ProjectCreationOptions): Promise<ProjectScaffoldResult> {
    const name = opts.projectName.trim();
    if (!name) {
      return { success: false, projectRoot: '', filesCreated: [], error: 'Project name cannot be empty.' };
    }

    if (/[\\/:*?"<>|]/.test(name)) {
      return {
        success: false,
        projectRoot: '',
        filesCreated: [],
        error: `Project name "${name}" contains invalid characters.`
      };
    }

    const projectRoot = path.resolve(opts.targetDirectory);

    try {
      await fs.promises.mkdir(projectRoot, { recursive: true });

      const files = generateProjectFiles({
        ...opts,
        projectName: name,
        targetDirectory: projectRoot
      });

      const filesCreated: string[] = [];
      let mainFilePath: string | undefined;

      for (const file of files) {
        const fullPath = path.join(projectRoot, file.relativePath);
        await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.promises.writeFile(fullPath, file.content, 'utf8');
        filesCreated.push(fullPath);

        if (
          file.relativePath.includes('main.') ||
          file.relativePath.includes('calculator.') ||
          file.relativePath.includes(`${name}.`)
        ) {
          if (!mainFilePath) {
            mainFilePath = fullPath;
          }
        }
      }

      return {
        success: true,
        projectRoot,
        filesCreated,
        mainFilePath
      };
    } catch (err: any) {
      return {
        success: false,
        projectRoot,
        filesCreated: [],
        error: `Scaffolding failed: ${err.message ?? err}`
      };
    }
  }

  /**
   * Interactive wizard guiding the user through creating a new C/C++ project.
   */
  public static async promptAndCreate(
    _context?: vscode.ExtensionContext,
    _detector?: CompilerDetector | null
  ): Promise<void> {
    const isWindows = process.platform === 'win32';

    // 1. Select Project Type
    const typeItems: Array<{ label: string; description: string; type: ProjectTemplateType }> = [
      {
        label: 'Console Application',
        description: 'Standard executable with main entry point and modular structure',
        type: 'console'
      },
      {
        label: 'Static Library',
        description: 'Reusable compiled static library (.lib / .a) with public include headers',
        type: 'static-lib'
      },
      {
        label: 'Shared / Dynamic Library',
        description: 'Dynamic library (.dll / .so / .dylib) with symbol visibility macros',
        type: 'shared-lib'
      },
      {
        label: 'Header-Only Library',
        description: 'Lightweight template/inline library requiring no binary compilation',
        type: 'header-only'
      },
      {
        label: 'Unit Test Suite',
        description: 'Test suite integrated with Catch2, GoogleTest, or doctest',
        type: 'test-suite'
      }
    ];

    const selectedType = await vscode.window.showQuickPick(typeItems, {
      placeHolder: 'Select Project Type'
    });
    if (!selectedType) return;

    // 2. Select Language
    const langItems: Array<{ label: string; language: LanguageType }> = [
      { label: 'C++ (Modern ISO C++)', language: 'cpp' },
      { label: 'C (Standard ISO C)', language: 'c' }
    ];

    const selectedLang = await vscode.window.showQuickPick(langItems, {
      placeHolder: 'Select Language'
    });
    if (!selectedLang) return;

    // 3. Select Standard
    let standard: CppStandard | CStandard = 'c++20';
    if (selectedLang.language === 'cpp') {
      const stdItems: Array<{ label: string; std: CppStandard }> = [
        { label: 'C++20 (Recommended)', std: 'c++20' },
        { label: 'C++23 (Modern / Latest)', std: 'c++23' },
        { label: 'C++17 (Established)', std: 'c++17' },
        { label: 'C++14', std: 'c++14' },
        { label: 'C++11', std: 'c++11' }
      ];
      const pickedStd = await vscode.window.showQuickPick(stdItems, {
        placeHolder: 'Select C++ Language Standard'
      });
      if (!pickedStd) return;
      standard = pickedStd.std;
    } else {
      const stdItems: Array<{ label: string; std: CStandard }> = [
        { label: 'C17 (Recommended)', std: 'c17' },
        { label: 'C23 (Modern)', std: 'c23' },
        { label: 'C11', std: 'c11' },
        { label: 'C99', std: 'c99' }
      ];
      const pickedStd = await vscode.window.showQuickPick(stdItems, {
        placeHolder: 'Select C Language Standard'
      });
      if (!pickedStd) return;
      standard = pickedStd.std;
    }

    // 4. Test Framework (if test-suite selected)
    let testFramework: TestFramework | undefined;
    if (selectedType.type === 'test-suite') {
      const frameworkItems: Array<{ label: string; framework: TestFramework }> = [
        { label: 'Catch2 (Modern C++ Test Framework)', framework: 'catch2' },
        { label: 'GoogleTest (Google C++ Testing Framework)', framework: 'googletest' },
        { label: 'doctest (Fast Header-Only Testing Framework)', framework: 'doctest' }
      ];
      const pickedFramework = await vscode.window.showQuickPick(frameworkItems, {
        placeHolder: 'Select Unit Test Framework'
      });
      if (!pickedFramework) return;
      testFramework = pickedFramework.framework;
    }

    // 5. Select Build System
    const buildSystemItems: Array<{
      label: string;
      description: string;
      system: ProjectBuildSystem;
    }> = [
      {
        label: 'CMake (Cross-Platform Recommended)',
        description: 'Standard across Windows, Linux, and macOS with compile_commands.json export',
        system: 'cmake'
      }
    ];

    if (isWindows) {
      buildSystemItems.push({
        label: 'Visual Studio Solution (.sln / .vcxproj)',
        description: 'Native MSVC project integrated directly with C/C++ Pro MSBuild runner',
        system: 'solution'
      });
    } else {
      buildSystemItems.push({
        label: 'POSIX Makefile',
        description: 'Standard Makefile for Linux and macOS development',
        system: 'makefile'
      });
    }

    buildSystemItems.push({
      label: 'Lightweight (Zero Build System)',
      description: 'compile_flags.txt + VS Code Tasks without external build generator requirements',
      system: 'lightweight'
    });

    const selectedBuildSystem = await vscode.window.showQuickPick(buildSystemItems, {
      placeHolder: 'Select Build System'
    });
    if (!selectedBuildSystem) return;

    // 6. Select Destination Directory
    const workspaceFolders = vscode.workspace.workspaceFolders;
    interface DestinationOption {
      label: string;
      description?: string;
      uri?: vscode.Uri;
      browse?: boolean;
    }

    const destOptions: DestinationOption[] = [];
    if (workspaceFolders && workspaceFolders.length > 0) {
      for (const wf of workspaceFolders) {
        destOptions.push({
          label: wf.name,
          description: wf.uri.fsPath,
          uri: wf.uri
        });
      }
    }

    destOptions.push({
      label: 'Browse folder...',
      description: 'Select a custom parent directory from your filesystem',
      browse: true
    });

    const chosenDest = await vscode.window.showQuickPick(destOptions, {
      placeHolder: 'Select Parent Directory for New Project'
    });
    if (!chosenDest) return;

    let parentDir: string;
    if (chosenDest.browse) {
      const selectedUri = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        openLabel: 'Select Project Parent Directory',
        defaultUri: workspaceFolders?.[0]?.uri
      });
      if (!selectedUri || selectedUri.length === 0) return;
      parentDir = selectedUri[0].fsPath;
    } else if (chosenDest.uri) {
      parentDir = chosenDest.uri.fsPath;
    } else {
      return;
    }

    // 7. Enter Project Name
    const defaultProjectName = selectedLang.language === 'cpp' ? 'MyCppProject' : 'MyCProject';
    const projectName = await vscode.window.showInputBox({
      title: 'Enter Project Name',
      value: defaultProjectName,
      prompt: 'Project folder and primary target name (alphanumeric, hyphens, and underscores only)',
      validateInput: (input: string) => {
        const trimmed = input.trim();
        if (!trimmed) {
          return 'Project name cannot be empty.';
        }
        if (/[\\/:*?"<>|]/.test(trimmed)) {
          return 'Project name contains invalid characters.';
        }
        return null;
      }
    });
    if (!projectName) return;

    const trimmedName = projectName.trim();
    const targetProjectDir = path.join(parentDir, trimmedName);

    // Collision check
    if (fs.existsSync(targetProjectDir)) {
      const entries = await fs.promises.readdir(targetProjectDir);
      if (entries.length > 0) {
        const answer = await vscode.window.showWarningMessage(
          `Directory "${trimmedName}" already exists and is not empty. Do you want to continue?`,
          { modal: true },
          'Continue'
        );
        if (answer !== 'Continue') return;
      }
    }

    // 8. Scaffold Project
    const scaffoldResult = await ProjectCreator.scaffold({
      projectName: trimmedName,
      targetDirectory: targetProjectDir,
      language: selectedLang.language,
      standard,
      templateType: selectedType.type,
      buildSystem: selectedBuildSystem.system,
      testFramework,
      isWindows
    });

    if (!scaffoldResult.success) {
      vscode.window.showErrorMessage(`C/C++ Pro: Failed to create project: ${scaffoldResult.error}`);
      return;
    }

    // 9. Prompt to Open Project
    const projectUri = vscode.Uri.file(targetProjectDir);
    const isInsideCurrentWorkspace =
      workspaceFolders &&
      workspaceFolders.some((wf) => targetProjectDir.startsWith(wf.uri.fsPath));

    if (isInsideCurrentWorkspace) {
      vscode.window.showInformationMessage(
        `C/C++ Pro: Project "${trimmedName}" created successfully with ${scaffoldResult.filesCreated.length} files.`
      );
      if (scaffoldResult.mainFilePath && fs.existsSync(scaffoldResult.mainFilePath)) {
        const doc = await vscode.workspace.openTextDocument(scaffoldResult.mainFilePath);
        await vscode.window.showTextDocument(doc);
      }
    } else {
      const choice = await vscode.window.showInformationMessage(
        `C/C++ Pro: Project "${trimmedName}" created successfully!`,
        'Open in Current Window',
        'Open in New Window'
      );

      if (choice === 'Open in Current Window') {
        await vscode.commands.executeCommand('vscode.openFolder', projectUri, false);
      } else if (choice === 'Open in New Window') {
        await vscode.commands.executeCommand('vscode.openFolder', projectUri, true);
      }
    }
  }
}
