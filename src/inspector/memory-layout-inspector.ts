import * as vscode from 'vscode';
import { NativeBridge } from '../native/native-bridge';

export interface FieldLayout {
  name: string;
  type: string;
  offset: number;
  size: number;
  alignment: number;
  isPadding: boolean;
  paddingSize?: number;
}

export interface StructLayout {
  name: string;
  totalSize: number;
  alignment: number;
  paddingBytes: number;
  cacheLines: number; // number of 64-byte cache lines
  fields: FieldLayout[];
  isPacked: boolean;
  optimizedSize?: number;
  recommendation?: string;
}

export type DataModel = 'LP64' | 'LLP64';

export interface TypeInfo {
  size: number;
  alignment: number;
}

const TYPE_SPECS_LP64: Record<string, TypeInfo> = {
  'bool': { size: 1, alignment: 1 },
  'char': { size: 1, alignment: 1 },
  'signed char': { size: 1, alignment: 1 },
  'unsigned char': { size: 1, alignment: 1 },
  'int8_t': { size: 1, alignment: 1 },
  'uint8_t': { size: 1, alignment: 1 },
  'short': { size: 2, alignment: 2 },
  'unsigned short': { size: 2, alignment: 2 },
  'int16_t': { size: 2, alignment: 2 },
  'uint16_t': { size: 2, alignment: 2 },
  'int': { size: 4, alignment: 4 },
  'unsigned int': { size: 4, alignment: 4 },
  'unsigned': { size: 4, alignment: 4 },
  'int32_t': { size: 4, alignment: 4 },
  'uint32_t': { size: 4, alignment: 4 },
  'float': { size: 4, alignment: 4 },
  'long': { size: 8, alignment: 8 },
  'unsigned long': { size: 8, alignment: 8 },
  'long long': { size: 8, alignment: 8 },
  'unsigned long long': { size: 8, alignment: 8 },
  'int64_t': { size: 8, alignment: 8 },
  'uint64_t': { size: 8, alignment: 8 },
  'double': { size: 8, alignment: 8 },
  'long double': { size: 16, alignment: 16 },
  'size_t': { size: 8, alignment: 8 },
  'uintptr_t': { size: 8, alignment: 8 },
  'intptr_t': { size: 8, alignment: 8 },
  'ptrdiff_t': { size: 8, alignment: 8 }
};

const TYPE_SPECS_LLP64: Record<string, TypeInfo> = {
  ...TYPE_SPECS_LP64,
  'long': { size: 4, alignment: 4 },
  'unsigned long': { size: 4, alignment: 4 },
  'long double': { size: 8, alignment: 8 }
};

/**
 * Resolves the byte size and alignment for a C/C++ type in a 64-bit architecture.
 * Supports LP64 (POSIX / GCC / Clang default) and LLP64 (Windows MSVC).
 */
export function resolveTypeInfo(typeStr: string, dataModel: DataModel = 'LP64'): TypeInfo {
  const trimmed = typeStr.trim();

  // Pointer types are always 8 bytes on 64-bit architectures
  if (trimmed.endsWith('*') || trimmed.endsWith('&')) {
    return { size: 8, alignment: 8 };
  }

  // Check for fixed array: type[N] or multi-dimensional type[N][M]...
  const multiArrayMatch = trimmed.match(/^([^\[]+)((?:\[\d+\])+)$/);
  if (multiArrayMatch) {
    const elemType = multiArrayMatch[1].trim();
    const dims = [...multiArrayMatch[2].matchAll(/\[(\d+)\]/g)].map((m) => parseInt(m[1], 10));
    const totalCount = dims.reduce((acc, val) => acc * val, 1);
    const elemInfo = resolveTypeInfo(elemType, dataModel);
    return {
      size: elemInfo.size * totalCount,
      alignment: elemInfo.alignment
    };
  }

  // Normalize spaces
  const normalized = trimmed.replace(/\s+/g, ' ');
  const specs = dataModel === 'LLP64' ? TYPE_SPECS_LLP64 : TYPE_SPECS_LP64;
  if (specs[normalized]) {
    return specs[normalized];
  }

  // Fallback heuristic: word-aligned 8-byte pointer/struct
  return { size: 8, alignment: 8 };
}

export interface StructLayoutOptions {
  isPacked?: boolean;
  maxPackAlignment?: number;
  skipOptimization?: boolean;
  dataModel?: DataModel;
}

/**
 * Calculates struct / class memory layout including natural alignment padding and cache-line boundaries.
 */
export function calculateStructLayout(
  structName: string,
  rawFields: { type: string; name: string }[],
  options: StructLayoutOptions = {}
): StructLayout {
  const isPacked = !!options.isPacked;
  const packMax = options.maxPackAlignment ?? (isPacked ? 1 : 8);
  const dataModel = options.dataModel ?? 'LP64';

  const fields: FieldLayout[] = [];
  let currentOffset = 0;
  let maxStructAlignment = 1;
  let totalPaddingBytes = 0;

  for (const field of rawFields) {
    const typeInfo = resolveTypeInfo(field.type, dataModel);
    const fieldAlignment = isPacked ? 1 : Math.min(typeInfo.alignment, packMax);
    maxStructAlignment = Math.max(maxStructAlignment, fieldAlignment);

    // Calculate required padding before this field to satisfy its alignment
    const remainder = currentOffset % fieldAlignment;
    if (remainder !== 0) {
      const padSize = fieldAlignment - remainder;
      fields.push({
        name: `[padding_${padSize}B]`,
        type: 'padding',
        offset: currentOffset,
        size: padSize,
        alignment: 1,
        isPadding: true,
        paddingSize: padSize
      });
      currentOffset += padSize;
      totalPaddingBytes += padSize;
    }

    fields.push({
      name: field.name,
      type: field.type,
      offset: currentOffset,
      size: typeInfo.size,
      alignment: fieldAlignment,
      isPadding: false
    });

    currentOffset += typeInfo.size;
  }

  // Trailing padding to align entire struct to maxStructAlignment
  const tailRemainder = currentOffset % maxStructAlignment;
  if (tailRemainder !== 0 && !isPacked) {
    const tailPad = maxStructAlignment - tailRemainder;
    fields.push({
      name: `[tail_padding_${tailPad}B]`,
      type: 'padding',
      offset: currentOffset,
      size: tailPad,
      alignment: 1,
      isPadding: true,
      paddingSize: tailPad
    });
    currentOffset += tailPad;
    totalPaddingBytes += tailPad;
  }

  const totalSize = currentOffset;
  const cacheLines = Math.max(1, Math.ceil(totalSize / 64));

  // Compute optimized layout by ordering fields by descending alignment/size
  let optimizedSize: number | undefined;
  let recommendation: string | undefined;

  if (totalPaddingBytes > 0 && !isPacked && !options.skipOptimization) {
    const sortedFields = [...rawFields].sort((a, b) => {
      const aInfo = resolveTypeInfo(a.type, dataModel);
      const bInfo = resolveTypeInfo(b.type, dataModel);
      return bInfo.alignment !== aInfo.alignment
        ? bInfo.alignment - aInfo.alignment
        : bInfo.size - aInfo.size;
    });

    const optLayout = calculateStructLayout(structName, sortedFields, { isPacked: false, skipOptimization: true, dataModel });
    optimizedSize = optLayout.totalSize;

    if (optimizedSize < totalSize) {
      const saved = totalSize - optimizedSize;
      const reorderList = sortedFields.map(f => f.name).join(', ');
      recommendation = `Reorder fields to [${reorderList}] to save ${saved} byte${saved > 1 ? 's' : ''} (${Math.round((saved / totalSize) * 100)}% reduction).`;
    }
  }

  return {
    name: structName,
    totalSize,
    alignment: maxStructAlignment,
    paddingBytes: totalPaddingBytes,
    cacheLines,
    fields,
    isPacked,
    optimizedSize,
    recommendation
  };
}

/**
 * Generates an ASCII visual diagram of the struct's byte layout.
 */
export function generateLayoutAsciiDiagram(layout: StructLayout): string {
  const lines: string[] = [];
  lines.push(`Struct Layout: ${layout.name} (${layout.totalSize} bytes, alignment: ${layout.alignment})`);
  lines.push(`Cache line footprint: ${layout.cacheLines} line(s) (64B per line)`);
  lines.push('─'.repeat(60));

  for (const field of layout.fields) {
    const hexOffset = `0x${field.offset.toString(16).padStart(4, '0')}`;
    const decOffset = `[+${field.offset.toString().padStart(3, ' ')}]`;
    if (field.isPadding) {
      lines.push(`${hexOffset} ${decOffset} │ ░░ PAD (${field.size} byte${field.size > 1 ? 's' : ''})`);
    } else {
      const sizeStr = `${field.size}B`;
      lines.push(`${hexOffset} ${decOffset} │ ■ ${field.name.padEnd(20, ' ')} : ${field.type} (${sizeStr})`);
    }
  }

  lines.push('─'.repeat(60));
  if (layout.paddingBytes > 0) {
    const pct = Math.round((layout.paddingBytes / layout.totalSize) * 100);
    lines.push(`Wasted padding: ${layout.paddingBytes} bytes (${pct}% overhead)`);
  } else {
    lines.push('Memory density: 100% optimal (0 padding bytes)');
  }

  if (layout.recommendation) {
    lines.push(`Tip: ${layout.recommendation}`);
  }

  return lines.join('\n');
}

/**
 * Generates rich markdown content for hovers or webview panels.
 */
export function generateLayoutMarkdown(layout: StructLayout): vscode.MarkdownString {
  const md = new vscode.MarkdownString();
  md.isTrusted = true;
  md.supportHtml = true;

  md.appendMarkdown(`### Memory Layout: \`${layout.name}\`\n\n`);
  md.appendMarkdown(`- **Total Size**: \`${layout.totalSize} bytes\`\n`);
  md.appendMarkdown(`- **Alignment**: \`${layout.alignment} bytes\`\n`);
  md.appendMarkdown(`- **Padding Overhead**: \`${layout.paddingBytes} bytes\` (${layout.totalSize > 0 ? Math.round((layout.paddingBytes / layout.totalSize) * 100) : 0}%)\n`);
  md.appendMarkdown(`- **Cache Lines (64B)**: \`${layout.cacheLines}\` ${layout.cacheLines > 1 ? '[Warning: Straddles multiple cache lines]' : '[Fits in 1 cache line]'}\n\n`);

  md.appendMarkdown('| Offset | Size | Field | Type |\n');
  md.appendMarkdown('| :--- | :--- | :--- | :--- |\n');

  for (const f of layout.fields) {
    if (f.isPadding) {
      md.appendMarkdown(`| \`+${f.offset}\` | \`${f.size}B\` | *padding* ░░ | — |\n`);
    } else {
      md.appendMarkdown(`| \`+${f.offset}\` | \`${f.size}B\` | **\`${f.name}\`** | \`${f.type}\` |\n`);
    }
  }

  if (layout.recommendation) {
    md.appendMarkdown(`\n> **Optimization Tip**: ${layout.recommendation}\n`);
  }

  return md;
}

/**
 * Parses struct or class definitions from C++ source code text at the cursor.
 */
function getActivePragmaPack(textBefore: string): number | undefined {
  const packRegex = /#pragma\s+pack\s*\(([^)]*)\)/g;
  const stack: (number | undefined)[] = [];
  let currentPack: number | undefined = undefined;

  let m: RegExpExecArray | null;
  while ((m = packRegex.exec(textBefore)) !== null) {
    const arg = m[1].trim();
    if (!arg) {
      // #pragma pack() resets to default
      currentPack = undefined;
    } else if (arg.startsWith('push')) {
      stack.push(currentPack);
      const parts = arg.split(',');
      if (parts.length > 1) {
        const n = parseInt(parts[1].trim(), 10);
        if (!isNaN(n)) currentPack = n;
      }
    } else if (arg.startsWith('pop')) {
      currentPack = stack.pop();
    } else {
      const n = parseInt(arg, 10);
      currentPack = !isNaN(n) ? n : undefined;
    }
  }

  return currentPack;
}

export function extractStructAtPosition(
  text: string,
  cursorOffset: number
): { name: string; isPacked: boolean; maxPackAlignment?: number; fields: { type: string; name: string }[] } | null {
  // Find struct or class blocks
  const structRegex = /(?:struct|class)\s+([a-zA-Z_]\w*)\s*(?::\s*[^{]+)?\s*\{([^}]+)\}/g;
  let match: RegExpExecArray | null;

  while ((match = structRegex.exec(text)) !== null) {
    const startIndex = match.index;
    const endIndex = match.index + match[0].length;

    // Check if cursor is within or near the struct definition
    if (cursorOffset >= startIndex && cursorOffset <= endIndex) {
      const structName = match[1];
      const body = match[2];
      const textBefore = text.substring(0, startIndex);
      const structText = text.substring(startIndex, endIndex);

      const activePack = getActivePragmaPack(textBefore);
      const hasPackedAttr = /__attribute__\s*\(\s*\(\s*packed\s*\)\s*\)/.test(structText);
      const isPacked = hasPackedAttr || (activePack !== undefined && activePack <= 1);
      const maxPackAlignment = activePack;

      const fields: { type: string; name: string }[] = [];
      const lines = body.split(';');

      for (const line of lines) {
        const clean = line.trim().replace(/\/\/.*$/g, '');
        if (!clean || clean.includes('(') || clean.startsWith('public:') || clean.startsWith('private:') || clean.startsWith('protected:')) {
          continue; // skip methods and access specifiers
        }

        const memberMatch = clean.match(/^([\w:*&<>]+(?:\s+[\w:*&<>]+)*)\s+([a-zA-Z_]\w*)((?:\[\d+\])+)?$/);
        if (memberMatch) {
          const baseType = memberMatch[1].trim();
          const name = memberMatch[2].trim();
          const arraySuffix = memberMatch[3] ? memberMatch[3].trim() : '';
          fields.push({ type: baseType + arraySuffix, name });
        }
      }

      if (fields.length > 0) {
        return { name: structName, isPacked, maxPackAlignment, fields };
      }
    }
  }

  return null;
}

/**
 * VS Code Command Handler and Provider for Memory Layout Inspection.
 */
export class MemoryLayoutInspector implements vscode.Disposable {
  private outputChannel: vscode.OutputChannel;

  constructor() {
    this.outputChannel = vscode.window.createOutputChannel('C/C++ Pro: Memory Layout');
  }

  public dispose(): void {
    this.outputChannel.dispose();
  }

  public inspectCurrentStruct(editor?: vscode.TextEditor): StructLayout | null {
    const activeEditor = editor || vscode.window.activeTextEditor;
    if (!activeEditor) {
      vscode.window.showWarningMessage('C/C++ Pro: No active C/C++ editor.');
      return null;
    }

    const doc = activeEditor.document;
    const text = doc.getText();
    const cursorOffset = doc.offsetAt(activeEditor.selection.active);

    const parsed = extractStructAtPosition(text, cursorOffset);
    if (!parsed) {
      vscode.window.showInformationMessage('C/C++ Pro: Place cursor inside a struct or class to inspect memory layout.');
      return null;
    }

    const dataModel: DataModel = process.platform === 'win32' ? 'LLP64' : 'LP64';
    const layout = NativeBridge.calculateStructLayout(parsed.name, parsed.fields, {
      isPacked: parsed.isPacked,
      maxPackAlignment: parsed.maxPackAlignment,
      dataModel
    });
    const diagram = generateLayoutAsciiDiagram(layout);

    this.outputChannel.clear();
    this.outputChannel.appendLine(diagram);
    this.outputChannel.show(true);

    return layout;
  }
}
