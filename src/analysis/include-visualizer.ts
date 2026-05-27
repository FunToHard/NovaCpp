import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface IncludeNode {
  path: string;
  isSystem: boolean;
  line: number;
  resolvedPath?: string;
  children: IncludeNode[];
}

export interface IncludeTreeAnalysis {
  rootFile: string;
  directIncludes: number;
  systemIncludes: number;
  userIncludes: number;
  maxDepth: number;
  tree: IncludeNode[];
  heavyHeaders: string[];
  suggestions: string[];
}

export interface TimeTraceEvent {
  name: string;
  ph: string;
  ts: number;
  dur: number; // in microseconds
  args?: {
    detail?: string;
  };
}

export interface TimeTraceSummary {
  totalDurationMs: number;
  slowestHeaders: { file: string; durationMs: number; percentage: number }[];
  slowestTemplates: { template: string; durationMs: number }[];
  slowestFunctions: { name: string; durationMs: number }[];
}

const HEAVY_HEADER_ADVICE: Record<string, string> = {
  'iostream': 'Consider using <iosfwd> in header files to forward-declare streams, avoiding iostream overhead.',
  'windows.h': 'Define #define WIN32_LEAN_AND_MEAN before including <windows.h> to strip cryptography, networking, and shell bloat.',
  'boost/asio.hpp': 'Include modular Boost headers (e.g., <boost/asio/io_context.hpp>) instead of umbrella <boost/asio.hpp>.',
  'ranges': 'C++20 <ranges> triggers heavy template instantiation; ensure precompiled headers (PCH) or modules are used.',
  'regex': 'Standard <regex> has high compile-time and runtime cost. Consider CTRE (Compile-Time Regular Expressions) or std::string_view search.',
  'algorithm': 'Standard <algorithm> instantiates extensive templates. If only using std::min/max, consider std::min/max alone.',
  'chrono': 'Header <chrono> can introduce template-heavy duration conversions across compilation units.'
};

/**
 * Extracts all #include directives from C/C++ source code.
 */
export function extractDirectIncludes(
  content: string,
  filePath: string
): { includePath: string; isSystem: boolean; line: number }[] {
  const results: { includePath: string; isSystem: boolean; line: number }[] = [];
  const lines = content.split(/\r?\n/);
  let inBlockComment = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim();

    if (inBlockComment) {
      if (line.includes('*/')) {
        inBlockComment = false;
        line = line.substring(line.indexOf('*/') + 2).trim();
      } else {
        continue;
      }
    }

    if (line.startsWith('/*')) {
      if (line.includes('*/')) {
        line = line.substring(line.indexOf('*/') + 2).trim();
      } else {
        inBlockComment = true;
        continue;
      }
    }

    if (!line || line.startsWith('//')) continue;

    const match = line.match(/^#\s*include\s*([<"])([^>"]+)[>"]/);
    if (match) {
      const isSystem = match[1] === '<';
      const includePath = match[2].trim();
      results.push({
        includePath,
        isSystem,
        line: i + 1
      });
    }
  }

  return results;
}

/**
 * Recursively resolves local project includes up to a maximum depth with cycle protection.
 */
export function buildIncludeTree(
  rootFile: string,
  workspaceFolders: string[] = [],
  maxDepth: number = 5,
  visited: Set<string> = new Set(),
  currentDepth: number = 0
): IncludeNode[] {
  const nodes: IncludeNode[] = [];
  if (currentDepth >= maxDepth || !fs.existsSync(rootFile)) {
    return nodes;
  }

  const normalizedRoot = path.normalize(rootFile);
  if (visited.has(normalizedRoot)) {
    return nodes; // prevent circular dependency infinite loops
  }
  visited.add(normalizedRoot);

  try {
    const content = fs.readFileSync(rootFile, 'utf-8');
    const direct = extractDirectIncludes(content, rootFile);
    const rootDir = path.dirname(rootFile);

    for (const inc of direct) {
      let resolved: string | undefined;

      if (!inc.isSystem) {
        // Look in current directory first
        const candidate = path.resolve(rootDir, inc.includePath);
        if (fs.existsSync(candidate)) {
          resolved = candidate;
        } else {
          // Check workspace roots
          for (const ws of workspaceFolders) {
            const wsCand = path.resolve(ws, inc.includePath);
            if (fs.existsSync(wsCand)) {
              resolved = wsCand;
              break;
            }
          }
        }
      }

      const node: IncludeNode = {
        path: inc.includePath,
        isSystem: inc.isSystem,
        line: inc.line,
        resolvedPath: resolved,
        children: []
      };

      if (resolved && !visited.has(path.normalize(resolved))) {
        node.children = buildIncludeTree(
          resolved,
          workspaceFolders,
          maxDepth,
          visited,
          currentDepth + 1
        );
      }

      nodes.push(node);
    }
  } catch {
    // Ignore read errors
  }

  return nodes;
}

/**
 * Calculates tree depth and counts.
 */
export function analyzeIncludeTree(rootFile: string, tree: IncludeNode[]): IncludeTreeAnalysis {
  let directCount = tree.length;
  let systemCount = 0;
  let userCount = 0;
  let maxDepth = tree.length > 0 ? 1 : 0;
  const heavyHeaders: string[] = [];
  const suggestions: string[] = [];

  function walk(nodes: IncludeNode[], depth: number) {
    if (nodes.length > 0) {
      maxDepth = Math.max(maxDepth, depth);
    }

    for (const n of nodes) {
      if (depth === 1) {
        if (n.isSystem) systemCount++;
        else userCount++;
      }

      // Check heavy header advice
      const baseHeader = path.basename(n.path).toLowerCase();
      for (const [key, advice] of Object.entries(HEAVY_HEADER_ADVICE)) {
        if (n.path === key || baseHeader === key || n.path.startsWith(key + '/')) {
          if (!heavyHeaders.includes(n.path)) {
            heavyHeaders.push(n.path);
            suggestions.push(`[${n.path}]: ${advice}`);
          }
        }
      }

      if (n.children.length > 0) {
        walk(n.children, depth + 1);
      }
    }
  }

  walk(tree, 1);

  if (tree.length > 25) {
    suggestions.push(
      `High direct include count (${tree.length} headers). Consider splitting this translation unit or implementing Precompiled Headers (PCH).`
    );
  }

  return {
    rootFile,
    directIncludes: directCount,
    systemIncludes: systemCount,
    userIncludes: userCount,
    maxDepth,
    tree,
    heavyHeaders,
    suggestions
  };
}

/**
 * Formats an include tree into an ASCII visualization tree.
 */
export function formatIncludeTreeAscii(nodes: IncludeNode[], prefix: string = ''): string[] {
  const lines: string[] = [];
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    const isLast = i === nodes.length - 1;
    const branch = isLast ? '└── ' : '├── ';
    const icon = node.isSystem ? '📦' : '📄';
    const tag = node.isSystem ? '<...>' : '"..."';
    lines.push(`${prefix}${branch}${icon} ${node.path} (${tag} L${node.line})`);

    if (node.children.length > 0) {
      const childPrefix = prefix + (isLast ? '    ' : '│   ');
      lines.push(...formatIncludeTreeAscii(node.children, childPrefix));
    }
  }
  return lines;
}

/**
 * Parses a Clang -ftime-trace Chrome JSON dump and aggregates compilation bottlenecks.
 */
export function parseFTimeTrace(jsonContent: string): TimeTraceSummary {
  const data = JSON.parse(jsonContent);
  const traceEvents: TimeTraceEvent[] = Array.isArray(data)
    ? data
    : data.traceEvents || [];

  let totalDurationUs = 0;
  const headerMap = new Map<string, number>();
  const templateMap = new Map<string, number>();
  const functionMap = new Map<string, number>();

  for (const event of traceEvents) {
    if (event.name === 'Total ExecuteCompiler' || event.name === 'ExecuteCompiler') {
      totalDurationUs = Math.max(totalDurationUs, event.dur || 0);
    }

    if (event.name === 'Source' && event.args?.detail) {
      const header = event.args.detail;
      const current = headerMap.get(header) || 0;
      headerMap.set(header, current + (event.dur || 0));
    } else if (event.name === 'InstantiateFunction' || event.name === 'InstantiateClass') {
      const detail = event.args?.detail || 'anonymous_template';
      const current = templateMap.get(detail) || 0;
      templateMap.set(detail, current + (event.dur || 0));
    } else if (event.name === 'OptFunction' || event.name === 'CodeGen Function') {
      const detail = event.args?.detail || 'function';
      const current = functionMap.get(detail) || 0;
      functionMap.set(detail, current + (event.dur || 0));
    }
  }

  // If no total wrapper was found, compute sum of top-level frontend/backend events
  if (totalDurationUs === 0) {
    for (const event of traceEvents) {
      if (event.name === 'Frontend' || event.name === 'Backend') {
        totalDurationUs += event.dur || 0;
      }
    }
  }
  if (totalDurationUs === 0) {
    totalDurationUs = 1000; // avoid div by zero
  }

  const totalDurationMs = Math.round(totalDurationUs / 1000);

  const slowestHeaders = Array.from(headerMap.entries())
    .map(([file, dur]) => {
      const ms = Math.round(dur / 1000);
      return {
        file,
        durationMs: ms,
        percentage: Math.min(100, Math.round((dur / totalDurationUs) * 100))
      };
    })
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);

  const slowestTemplates = Array.from(templateMap.entries())
    .map(([template, dur]) => ({
      template,
      durationMs: Math.round(dur / 1000)
    }))
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);

  const slowestFunctions = Array.from(functionMap.entries())
    .map(([name, dur]) => ({
      name,
      durationMs: Math.round(dur / 1000)
    }))
    .sort((a, b) => b.durationMs - a.durationMs)
    .slice(0, 10);

  return {
    totalDurationMs,
    slowestHeaders,
    slowestTemplates,
    slowestFunctions
  };
}

/**
 * Controller and command handler for Include Analysis and TimeTrace Bottleneck visualizer.
 */
export class IncludeVisualizerManager implements vscode.Disposable {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('NovaCpp: Build Bottlenecks');
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  public analyzeActiveDocument(editor?: vscode.TextEditor): IncludeTreeAnalysis | null {
    const activeEditor = editor || vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showWarningMessage('NovaCpp: Open a C/C++ source file to analyze #include tree.');
      return null;
    }

    const doc = activeEditor.document;
    const wsRoots = vscode.workspace.workspaceFolders?.map((f) => f.uri.fsPath) || [];

    const tree = buildIncludeTree(doc.fileName, wsRoots);
    const analysis = analyzeIncludeTree(doc.fileName, tree);

    this.outputChannel.clear();
    this.outputChannel.appendLine(`=======================================================`);
    this.outputChannel.appendLine(`NovaCpp: Include Tree & Dependency Bottleneck Analysis`);
    this.outputChannel.appendLine(`File: ${doc.fileName}`);
    this.outputChannel.appendLine(`=======================================================`);
    this.outputChannel.appendLine(`Direct Includes: ${analysis.directIncludes} (System: ${analysis.systemIncludes}, User: ${analysis.userIncludes})`);
    this.outputChannel.appendLine(`Maximum Depth: ${analysis.maxDepth}`);
    this.outputChannel.appendLine(`Heavy Headers Detected: ${analysis.heavyHeaders.length}`);
    this.outputChannel.appendLine('');
    this.outputChannel.appendLine(`--- Include Hierarchy ---`);
    const asciiLines = formatIncludeTreeAscii(analysis.tree);
    for (const l of asciiLines) {
      this.outputChannel.appendLine(l);
    }

    if (analysis.suggestions.length > 0) {
      this.outputChannel.appendLine('');
      this.outputChannel.appendLine(`--- Optimization Tips & IWYU Insights ---`);
      for (const s of analysis.suggestions) {
        this.outputChannel.appendLine(`💡 ${s}`);
      }
    }

    this.outputChannel.show(true);
    return analysis;
  }

  public async visualizeTimeTraceFile(traceUri?: vscode.Uri): Promise<TimeTraceSummary | null> {
    let targetPath: string | undefined;

    if (traceUri) {
      targetPath = traceUri.fsPath;
    } else {
      const selected = await vscode.window.showOpenDialog({
        canSelectFiles: true,
        canSelectMany: false,
        filters: { 'TimeTrace JSON': ['json'] },
        title: 'Select Clang -ftime-trace JSON Output'
      });
      if (selected && selected[0]) {
        targetPath = selected[0].fsPath;
      }
    }

    if (!targetPath || !fs.existsSync(targetPath)) {
      return null;
    }

    try {
      const raw = fs.readFileSync(targetPath, 'utf-8');
      const summary = parseFTimeTrace(raw);

      this.outputChannel.clear();
      this.outputChannel.appendLine(`=======================================================`);
      this.outputChannel.appendLine(`NovaCpp: Clang -ftime-trace Compilation Bottleneck Report`);
      this.outputChannel.appendLine(`Source Trace: ${targetPath}`);
      this.outputChannel.appendLine(`Total Build Time: ${summary.totalDurationMs} ms`);
      this.outputChannel.appendLine(`=======================================================`);

      this.outputChannel.appendLine(`\n--- Slowest Header Files (Frontend Parsing) ---`);
      for (const h of summary.slowestHeaders) {
        this.outputChannel.appendLine(`⏳ ${h.durationMs.toString().padStart(6)} ms (${h.percentage.toString().padStart(3)}%) │ ${h.file}`);
      }

      if (summary.slowestTemplates.length > 0) {
        this.outputChannel.appendLine(`\n--- Slowest Template Instantiations ---`);
        for (const t of summary.slowestTemplates) {
          this.outputChannel.appendLine(`🧩 ${t.durationMs.toString().padStart(6)} ms │ ${t.template}`);
        }
      }

      if (summary.slowestFunctions.length > 0) {
        this.outputChannel.appendLine(`\n--- Slowest Backend CodeGen & Optimization ---`);
        for (const f of summary.slowestFunctions) {
          this.outputChannel.appendLine(`⚡ ${f.durationMs.toString().padStart(6)} ms │ ${f.name}`);
        }
      }

      this.outputChannel.show(true);
      return summary;
    } catch (err: any) {
      vscode.window.showErrorMessage(`NovaCpp: Failed to parse -ftime-trace JSON: ${err.message ?? err}`);
      return null;
    }
  }
}
