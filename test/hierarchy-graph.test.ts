import './vscode-mock';
import * as assert from 'assert';
import {
  extractInheritance,
  buildTypeHierarchyGraph,
  formatHierarchyGraphAscii,
  generateHierarchyMermaid
} from '../src/hierarchy/hierarchy-graph';

describe('Semantic Symbol Hierarchy Graph', () => {
  describe('extractInheritance', () => {
    it('should extract class and struct base classes with access specifiers', () => {
      const code = `
class Shape {
};

class Polygon : public Shape {
};

class Rectangle : public Polygon, virtual public Shape {
};

struct Square : public Rectangle {
};
`;
      const map = extractInheritance(code);
      assert.strictEqual(map.size, 4);

      const shape = map.get('Shape');
      assert.ok(shape);
      assert.strictEqual(shape?.bases.length, 0);

      const poly = map.get('Polygon');
      assert.ok(poly);
      assert.deepStrictEqual(poly?.bases, ['Shape']);

      const rect = map.get('Rectangle');
      assert.ok(rect);
      assert.deepStrictEqual(rect?.bases, ['Polygon', 'Shape']);

      const sq = map.get('Square');
      assert.ok(sq);
      assert.strictEqual(sq?.kind, 'struct');
      assert.deepStrictEqual(sq?.bases, ['Rectangle']);
    });
  });

  describe('buildTypeHierarchyGraph', () => {
    it('should build bidirectional graph of base classes and derived classes', () => {
      const inheritanceMap = new Map([
        ['Animal', { bases: [], kind: 'class' as const }],
        ['Mammal', { bases: ['Animal'], kind: 'class' as const }],
        ['Dog', { bases: ['Mammal'], kind: 'class' as const }],
        ['Cat', { bases: ['Mammal'], kind: 'class' as const }]
      ]);

      const graph = buildTypeHierarchyGraph('Mammal', inheritanceMap);
      assert.strictEqual(graph.rootId, 'Mammal');
      assert.ok(graph.nodes.has('Mammal'));
      assert.ok(graph.nodes.has('Animal'), 'Must include base class Animal');
      assert.ok(graph.nodes.has('Dog'), 'Must include derived class Dog');
      assert.ok(graph.nodes.has('Cat'), 'Must include derived class Cat');

      const inheritsEdges = graph.edges.filter(e => e.type === 'inherits');
      assert.ok(inheritsEdges.some(e => e.from === 'Mammal' && e.to === 'Animal'));

      const derivedEdges = graph.edges.filter(e => e.type === 'derived');
      assert.ok(derivedEdges.some(e => e.from === 'Dog' && e.to === 'Mammal'));
      assert.ok(derivedEdges.some(e => e.from === 'Cat' && e.to === 'Mammal'));
    });
  });

  describe('formatHierarchyGraphAscii and Mermaid', () => {
    it('should generate ASCII hierarchy report', () => {
      const inheritanceMap = new Map([
        ['Base', { bases: [], kind: 'class' as const }],
        ['Derived', { bases: ['Base'], kind: 'class' as const }]
      ]);

      const graph = buildTypeHierarchyGraph('Derived', inheritanceMap);
      const ascii = formatHierarchyGraphAscii(graph);

      assert.ok(ascii.includes('Hierarchy Graph: Derived'));
      assert.ok(ascii.includes('Base Classes / Interfaces'));
      assert.ok(ascii.includes('Base'));
    });

    it('should generate valid Mermaid diagram syntax', () => {
      const inheritanceMap = new Map([
        ['Base', { bases: [], kind: 'class' as const }],
        ['Derived', { bases: ['Base'], kind: 'class' as const }]
      ]);

      const graph = buildTypeHierarchyGraph('Derived', inheritanceMap);
      const mermaid = generateHierarchyMermaid(graph);

      assert.ok(mermaid.startsWith('graph TD'));
      assert.ok(mermaid.includes('Derived["Derived (class)"]'));
      assert.ok(mermaid.includes('Derived -->|inherits| Base'));
    });
  });
});
