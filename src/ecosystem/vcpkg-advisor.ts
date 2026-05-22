import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export interface VcpkgPortInfo {
  port: string;
  description: string;
  homepage?: string;
}

export const VCPKG_HEADERS_CATALOG: Record<string, VcpkgPortInfo> = {
  'nlohmann/json.hpp': { port: 'nlohmann-json', description: 'JSON for Modern C++', homepage: 'https://github.com/nlohmann/json' },
  'fmt/format.h': { port: 'fmt', description: 'Small, safe and fast formatting library', homepage: 'https://github.com/fmtlib/fmt' },
  'fmt/core.h': { port: 'fmt', description: 'Small, safe and fast formatting library', homepage: 'https://github.com/fmtlib/fmt' },
  'fmt/ranges.h': { port: 'fmt', description: 'Small, safe and fast formatting library', homepage: 'https://github.com/fmtlib/fmt' },
  'spdlog/spdlog.h': { port: 'spdlog', description: 'Fast C++ logging library', homepage: 'https://github.com/gabime/spdlog' },
  'spdlog/async.h': { port: 'spdlog', description: 'Fast C++ logging library', homepage: 'https://github.com/gabime/spdlog' },
  'boost/asio.hpp': { port: 'boost-asio', description: 'Boost.Asio networking library', homepage: 'https://www.boost.org' },
  'boost/beast.hpp': { port: 'boost-beast', description: 'Boost.Beast HTTP/WebSocket library', homepage: 'https://www.boost.org' },
  'boost/filesystem.hpp': { port: 'boost-filesystem', description: 'Boost.Filesystem library', homepage: 'https://www.boost.org' },
  'boost/system/error_code.hpp': { port: 'boost-system', description: 'Boost.System library', homepage: 'https://www.boost.org' },
  'catch2/catch_all.hpp': { port: 'catch2', description: 'Catch2 test framework', homepage: 'https://github.com/catchorg/Catch2' },
  'catch2/catch_test_macros.hpp': { port: 'catch2', description: 'Catch2 test framework', homepage: 'https://github.com/catchorg/Catch2' },
  'gtest/gtest.h': { port: 'gtest', description: 'Google Test C++ testing framework', homepage: 'https://github.com/google/googletest' },
  'gmock/gmock.h': { port: 'gtest', description: 'Google Mock framework', homepage: 'https://github.com/google/googletest' },
  'cxxopts.hpp': { port: 'cxxopts', description: 'Lightweight C++ command line option parser', homepage: 'https://github.com/jarro2783/cxxopts' },
  'Eigen/Dense': { port: 'eigen3', description: 'Eigen linear algebra template library', homepage: 'https://eigen.tuxfamily.org' },
  'Eigen/Core': { port: 'eigen3', description: 'Eigen linear algebra template library', homepage: 'https://eigen.tuxfamily.org' },
  'Eigen/Geometry': { port: 'eigen3', description: 'Eigen linear algebra template library', homepage: 'https://eigen.tuxfamily.org' },
  'opencv2/opencv.hpp': { port: 'opencv', description: 'OpenCV Computer Vision Library', homepage: 'https://opencv.org' },
  'opencv2/core.hpp': { port: 'opencv', description: 'OpenCV Computer Vision Library', homepage: 'https://opencv.org' },
  'zlib.h': { port: 'zlib', description: 'Compression library', homepage: 'https://zlib.net' },
  'openssl/ssl.h': { port: 'openssl', description: 'OpenSSL cryptography library', homepage: 'https://www.openssl.org' },
  'openssl/crypto.h': { port: 'openssl', description: 'OpenSSL cryptography library', homepage: 'https://www.openssl.org' },
  'curl/curl.h': { port: 'curl', description: 'Command line tool and library for transferring data with URLs', homepage: 'https://curl.se' },
  'sqlite3.h': { port: 'sqlite3', description: 'SQLite SQL database engine', homepage: 'https://www.sqlite.org' },
  'yaml-cpp/yaml.h': { port: 'yaml-cpp', description: 'YAML parser and emitter in C++', homepage: 'https://github.com/jbeder/yaml-cpp' },
  'GLFW/glfw3.h': { port: 'glfw3', description: 'Multi-platform library for OpenGL, window and input', homepage: 'https://www.glfw.org' },
  'glad/glad.h': { port: 'glad', description: 'Multi-Language GL/GLES/EGL/GLX/WGL Loader-Generator', homepage: 'https://glad.dav1d.de' },
  'glm/glm.hpp': { port: 'glm', description: 'OpenGL Mathematics (GLM)', homepage: 'https://github.com/g-truc/glm' },
  'nan.h': { port: 'nan', description: 'Native Abstractions for Node.js', homepage: 'https://github.com/nodejs/nan' },
  'napi.h': { port: 'node-addon-api', description: 'Node.js C++ addon API', homepage: 'https://github.com/nodejs/node-addon-api' },
  'tbb/tbb.h': { port: 'tbb', description: 'Threading Building Blocks (oneTBB)', homepage: 'https://github.com/oneapi-src/oneTBB' },
  'range/v3/all.hpp': { port: 'range-v3', description: 'Range library for C++14/17/20', homepage: 'https://github.com/ericniebler/range-v3' },
  'magic_enum.hpp': { port: 'magic_enum', description: 'Static reflection for enums', homepage: 'https://github.com/Neargye/magic_enum' }
};

export class VcpkgAdvisor implements vscode.CodeActionProvider {
  public static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix,
    vscode.CodeActionKind.Empty
  ];

  /**
   * Matches an include statement on a given line to an entry in the vcpkg catalog.
   */
  public static matchHeader(lineText: string): { header: string; info: VcpkgPortInfo } | null {
    const trimmed = lineText.trim();
    const match = trimmed.match(/^#\s*include\s*[<"]([^>"]+)[>"]/);
    if (!match) return null;

    const rawHeader = match[1];
    const header = rawHeader.replace(/\\/g, '/');

    // Direct match
    if (VCPKG_HEADERS_CATALOG[header]) {
      return { header, info: VCPKG_HEADERS_CATALOG[header] };
    }

    // Prefix matching (e.g. boost/*)
    if (header.startsWith('boost/')) {
      return {
        header,
        info: { port: 'boost', description: 'Boost C++ Libraries', homepage: 'https://www.boost.org' }
      };
    }
    if (header.startsWith('opencv2/')) {
      return {
        header,
        info: { port: 'opencv', description: 'OpenCV Computer Vision Library', homepage: 'https://opencv.org' }
      };
    }
    if (header.startsWith('Eigen/')) {
      return {
        header,
        info: { port: 'eigen3', description: 'Eigen linear algebra library', homepage: 'https://eigen.tuxfamily.org' }
      };
    }

    return null;
  }

  /**
   * Discovers the vcpkg root directory from environment or workspace files.
   */
  public static findVcpkgRoot(workspaceRoot?: string): string | null {
    if (process.env.VCPKG_ROOT && fs.existsSync(process.env.VCPKG_ROOT)) {
      return process.env.VCPKG_ROOT;
    }

    if (workspaceRoot) {
      const vcpkgTxt = path.join(workspaceRoot, '.vcpkg', 'vcpkg.path.txt');
      if (fs.existsSync(vcpkgTxt)) {
        try {
          const content = fs.readFileSync(vcpkgTxt, 'utf8').trim();
          if (content && fs.existsSync(content)) return content;
        } catch {
          // Ignore
        }
      }

      const localDir = path.join(workspaceRoot, 'vcpkg');
      if (fs.existsSync(localDir)) return localDir;
    }

    // Default global paths
    const candidates = [
      'C:\\vcpkg',
      'C:\\src\\vcpkg',
      'D:\\vcpkg',
      path.join(os.homedir(), 'vcpkg'),
      path.join(os.homedir(), '.vcpkg')
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) return c;
    }

    return null;
  }

  /**
   * Scans for installed header directories inside vcpkgRoot.
   */
  public static findInstalledIncludePaths(vcpkgRoot: string): string[] {
    const installedDir = path.join(vcpkgRoot, 'installed');
    if (!fs.existsSync(installedDir)) return [];

    const results: string[] = [];
    try {
      const entries = fs.readdirSync(installedDir);
      for (const entry of entries) {
        const includePath = path.join(installedDir, entry, 'include');
        if (fs.existsSync(includePath) && fs.statSync(includePath).isDirectory()) {
          results.push(includePath);
        }
      }
    } catch {
      // Ignore
    }

    return results;
  }

  /**
   * Auto-detects Node.js native addon include directories in the workspace.
   */
  public static findNodeAddonIncludePaths(workspaceRoot: string): string[] {
    const pkgPath = path.join(workspaceRoot, 'package.json');
    if (!fs.existsSync(pkgPath)) return [];

    const results: string[] = [];
    try {
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
      const deps = { ...(pkg.dependencies ?? {}), ...(pkg.devDependencies ?? {}) };

      if (deps['node-addon-api']) {
        const addonPath = path.join(workspaceRoot, 'node_modules', 'node-addon-api');
        if (fs.existsSync(addonPath)) {
          results.push(addonPath);
        }
      }

      if (deps['nan']) {
        const nanPath = path.join(workspaceRoot, 'node_modules', 'nan');
        if (fs.existsSync(nanPath)) {
          results.push(nanPath);
        }
      }
    } catch {
      // Ignore
    }

    return results;
  }

  /**
   * Provides vcpkg package advisor Code Actions for missing headers.
   */
  public provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    _context: vscode.CodeActionContext,
    _token: vscode.CancellationToken
  ): vscode.ProviderResult<vscode.CodeAction[]> {
    const config = vscode.workspace.getConfiguration('novacpp');
    if (!config.get<boolean>('vcpkg.enabled', true)) {
      return [];
    }

    const lineIndex = range.start.line;
    const lineText = document.lineAt(lineIndex).text;

    const matched = VcpkgAdvisor.matchHeader(lineText);
    if (!matched) return [];

    const { info } = matched;
    const actions: vscode.CodeAction[] = [];

    // 1. Copy install command to clipboard
    const copyAction = new vscode.CodeAction(
      `📦 Copy 'vcpkg install ${info.port}' to clipboard`,
      vscode.CodeActionKind.QuickFix
    );
    copyAction.command = {
      command: 'novacpp.copyToClipboard',
      title: 'Copy Command',
      arguments: [`vcpkg install ${info.port}`]
    };
    actions.push(copyAction);

    // 2. Run in terminal
    const installAction = new vscode.CodeAction(
      `⚡ Run 'vcpkg install ${info.port}' in Terminal`,
      vscode.CodeActionKind.QuickFix
    );
    installAction.command = {
      command: 'novacpp.runInTerminal',
      title: 'Run vcpkg install',
      arguments: [`vcpkg install ${info.port}`]
    };
    actions.push(installAction);

    // 3. Online help
    if (info.homepage) {
      const helpAction = new vscode.CodeAction(
        `🌐 Open documentation for '${info.port}'`,
        vscode.CodeActionKind.Empty
      );
      helpAction.command = {
        command: 'vscode.open',
        title: 'Open Package Homepage',
        arguments: [vscode.Uri.parse(info.homepage)]
      };
      actions.push(helpAction);
    }

    return actions;
  }
}
