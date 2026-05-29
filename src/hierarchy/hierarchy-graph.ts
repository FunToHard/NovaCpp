import * as vscode from 'vscode';
import * as path from 'path';

export interface HierarchyNode {
  id: string;
  name: string;
  kind: 'function' | 'method' | 'class' | 'struct' | 'interface';
  detail?: string;
  uri?: string;
  line?: number;
}

export interface HierarchyEdge {
  from: string;
  to: string;
  type: 'calls' | 'called_by' | 'inherits' | 'derived';
}

export interface HierarchyGraph {
  rootId: string;
  nodes: Map<string, HierarchyNode>;
  edges: HierarchyEdge[];
  depth: number;
}

/**
 * Extracts class and struct inheritance from C++ source code text.
 */
export function extractInheritance(sourceCode: string): Map<string, { bases: string[]; kind: 'class' | 'struct' }> {
  const map = new Map<string, { bases: string[]; kind: 'class' | 'struct' }>();
  // Match: (class|struct) Derived : (public|protected|private)? Base1, ... {
  const classRegex = /\b(class|struct)\s+([a-zA-Z_]\w*)\s*(?::\s*([^{]+))?\{/g;
  let m: RegExpExecArray | null;

  while ((m = classRegex.exec(sourceCode)) !== null) {
    const kind = m[1] as 'class' | 'struct';
    const name = m[2];
    const baseListStr = m[3];
    const bases: string[] = [];

    if (baseListStr) {
      const parts = baseListStr.split(',');
      for (const p of parts) {
        const cleanBase = p.replace(/\b(public|protected|private|virtual)\b/g, '').trim();
        if (cleanBase) {
          bases.push(cleanBase);
        }
      }
    }

    map.set(name, { bases, kind });
  }

  return map;
}

/**
 * Builds a type inheritance hierarchy graph for a given root class/struct.
 */
export function buildTypeHierarchyGraph(
  rootName: string,
  inheritanceMap: Map<string, { bases: string[]; kind: 'class' | 'struct' }>
): HierarchyGraph {
  const nodes = new Map<string, HierarchyNode>();
  const edges: HierarchyEdge[] = [];

  const rootInfo = inheritanceMap.get(rootName) || { bases: [], kind: 'class' };
  nodes.set(rootName, {
    id: rootName,
    name: rootName,
    kind: rootInfo.kind
  });

  // 1. Add base classes (ancestors)
  function addBases(currentName: string, depth: number) {
    const info = inheritanceMap.get(currentName);
    if (!info) return;

    for (const base of info.bases) {
      if (!nodes.has(base)) {
        const baseInfo = inheritanceMap.get(base);
        nodes.set(base, {
          id: base,
          name: base,
          kind: baseInfo ? baseInfo.kind : 'class'
        });
      }
      edges.push({
        from: currentName,
        to: base,
        type: 'inherits'
      });
      addBases(base, depth + 1);
    }
  }

  // 2. Add derived classes (descendants)
  function addDerived(currentName: string, depth: number) {
    for (const [name, info] of inheritanceMap.entries()) {
      if (info.bases.includes(currentName)) {
        if (!nodes.has(name)) {
          nodes.set(name, {
            id: name,
            name: name,
            kind: info.kind
          });
        }
        edges.push({
          from: name,
          to: currentName,
          type: 'derived'
        });
        addDerived(name, depth + 1);
      }
    }
  }

  addBases(rootName, 1);
  addDerived(rootName, 1);

  return {
    rootId: rootName,
    nodes,
    edges,
    depth: 3
  };
}

/**
 * Formats a hierarchy graph into an ASCII tree / DAG representation.
 */
export function formatHierarchyGraphAscii(graph: HierarchyGraph): string {
  const lines: string[] = [];
  const rootNode = graph.nodes.get(graph.rootId);
  const rootName = rootNode ? rootNode.name : graph.rootId;

  lines.push(`Hierarchy Graph: ${rootName} (${graph.nodes.size} node(s), ${graph.edges.length} edge(s))`);
  lines.push('─'.repeat(60));

  // Base classes / Incoming
  const inheritsEdges = graph.edges.filter(e => e.type === 'inherits' && e.from === graph.rootId);
  if (inheritsEdges.length > 0) {
    lines.push(`▲ Base Classes / Interfaces:`);
    for (const e of inheritsEdges) {
      lines.push(`   └── 🏛️  ${e.to}`);
    }
  }

  lines.push(`● Root: [${rootName}]`);

  // Derived classes / Outgoing
  const derivedEdges = graph.edges.filter(e => e.type === 'derived' && e.to === graph.rootId);
  if (derivedEdges.length > 0) {
    lines.push(`▼ Derived Subclasses:`);
    for (const e of derivedEdges) {
      lines.push(`   └── 🏷️  ${e.from}`);
    }
  }

  lines.push('─'.repeat(60));
  return lines.join('\n');
}

/**
 * Generates Mermaid DAG syntax for rendering inside markdown cards or webviews.
 */
export function generateHierarchyMermaid(graph: HierarchyGraph): string {
  const lines: string[] = ['graph TD'];
  for (const [id, node] of graph.nodes.entries()) {
    const isRoot = id === graph.rootId;
    const style = isRoot ? 'style ' + id + ' fill:#4caf50,stroke:#388e3c,stroke-width:2px,color:#fff' : '';
    lines.push(`  ${id}["${node.name} (${node.kind})"]`);
    if (style) lines.push(`  ${style}`);
  }

  for (const edge of graph.edges) {
    if (edge.type === 'inherits') {
      lines.push(`  ${edge.from} -->|inherits| ${edge.to}`);
    } else if (edge.type === 'derived') {
      lines.push(`  ${edge.from} -->|derived| ${edge.to}`);
    } else {
      lines.push(`  ${edge.from} -->|${edge.type}| ${edge.to}`);
    }
  }

  return lines.join('\n');
}

/**
 * Controller for Call & Type Hierarchy Graph Visualizer.
 */
export class HierarchyGraphManager implements vscode.Disposable {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('NovaCpp: Symbol Hierarchy');
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  public showTypeHierarchy(editor?: vscode.TextEditor): HierarchyGraph | null {
    const active = editor || vscode.window.activeTextEditor;
    if (!active) {
      vscode.window.showWarningMessage('NovaCpp: Open a C/C++ source file to view type hierarchy.');
      return null;
    }

    const doc = active.document;
    const text = doc.getText();
    const pos = active.selection.active;
    const wordRange = doc.getWordRangeAtPosition(pos);
    const symbol = wordRange ? doc.getText(wordRange) : '';

    if (!symbol) {
      vscode.window.showInformationMessage('NovaCpp: Place cursor on a class or struct name.');
      return null;
    }

    const inheritanceMap = extractInheritance(text);
    const graph = buildTypeHierarchyGraph(symbol, inheritanceMap);
    const ascii = formatHierarchyGraphAscii(graph);

    this.outputChannel.clear();
    this.outputChannel.appendLine(`=======================================================`);
    this.outputChannel.appendLine(`NovaCpp: Semantic Type & Inheritance Hierarchy Graph`);
    this.outputChannel.appendLine(`Symbol: ${symbol} (${path.basename(doc.fileName)})`);
    this.outputChannel.appendLine(`=======================================================`);
    this.outputChannel.appendLine(ascii);
    this.outputChannel.show(true);

    return graph;
  }
}
