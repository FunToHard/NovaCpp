/* eslint-disable @typescript-eslint/no-explicit-any */
import Module from 'module';

export class Position {
  constructor(public readonly line: number, public readonly character: number) {}
  compareTo(other: Position): number {
    if (this.line !== other.line) return this.line - other.line;
    return this.character - other.character;
  }
}

export class Range {
  public readonly start: Position;
  public readonly end: Position;
  constructor(startOrStartLine: Position | number, endOrStartChar: Position | number, endLine?: number, endChar?: number) {
    if (typeof startOrStartLine === 'number') {
      this.start = new Position(startOrStartLine, endOrStartChar as number);
      this.end = new Position(endLine as number, endChar as number);
    } else {
      this.start = startOrStartLine;
      this.end = endOrStartChar as Position;
    }
  }
}

export class Selection extends Range {
  public readonly anchor: Position;
  public readonly active: Position;
  constructor(anchor: Position, active: Position) {
    super(anchor, active);
    this.anchor = anchor;
    this.active = active;
  }
}

export class Location {
  constructor(public uri: any, public range: Range) {}
}

export class CodeLens {
  constructor(public range: Range, public command?: any) {}
}

export class DocumentLink {
  constructor(public range: Range, public target?: any) {}
}

export class CodeAction {
  public edit?: any;
  public diagnostics?: any[];
  public command?: any;
  public isPreferred?: boolean;
  public kind?: any;
  constructor(public title: string, public actionKind?: any) {
    this.kind = actionKind;
  }
}

export class DocumentSymbol {
  constructor(
    public name: string,
    public detail: string,
    public kind: number,
    public range: Range,
    public selectionRange: Range
  ) {}
}

export class Diagnostic {
  public code?: string | number;
  public source?: string;
  constructor(
    public range: Range,
    public message: string,
    public severity: number = 0
  ) {}
}

export class InlayHint {
  constructor(public position: Position, public label: string | any[], public kind?: any) {}
}

export class CallHierarchyItem {
  constructor(
    public kind: number,
    public name: string,
    public detail: string,
    public uri: any,
    public range: Range,
    public selectionRange: Range
  ) {}
}

export class TypeHierarchyItem {
  constructor(
    public kind: number,
    public name: string,
    public detail: string,
    public uri: any,
    public range: Range,
    public selectionRange: Range
  ) {}
}

export class SnippetString {
  constructor(public value: string = '') {}
}

export class CompletionItem {
  public filterText?: string;
  public commitCharacters?: string[];
  public command?: { title: string; command: string };
  public range?: Range | { inserting: Range; replacing: Range };
  constructor(public label: string | { label: string }, public kind?: any) {}
}

export class CompletionList {
  constructor(public items: any[] = [], public isIncomplete: boolean = false) {}
}

export class SymbolInformation {
  constructor(
    public name: string,
    public kind: any,
    public containerName: string,
    public location: any
  ) {}
}

export class MarkdownString {
  public isTrusted: boolean = false;
  public supportThemeIcons: boolean = false;
  constructor(public value: string = '') {}
  appendMarkdown(val: string): MarkdownString {
    this.value += val;
    return this;
  }
  appendCodeblock(val: string, language: string = ''): MarkdownString {
    this.value += `\n\`\`\`${language}\n${val}\n\`\`\`\n`;
    return this;
  }
  appendText(val: string): MarkdownString {
    this.value += val;
    return this;
  }
}

export class Hover {
  public contents: any[];
  constructor(contents: any, public range?: Range) {
    this.contents = Array.isArray(contents) ? contents : [contents];
  }
}

export class SignatureHelp {
  public signatures: any[] = [];
  public activeSignature: number = 0;
  public activeParameter: number = 0;
}

export class SignatureInformation {
  constructor(public label: string, public documentation?: any) {}
}

export class ParameterInformation {
  constructor(public label: string | [number, number], public documentation?: any) {}
}

export class TextEdit {
  static replace(range: Range, newText: string): TextEdit {
    return new TextEdit(range, newText);
  }
  static insert(position: Position, newText: string): TextEdit {
    return new TextEdit(new Range(position, position), newText);
  }
  static delete(range: Range): TextEdit {
    return new TextEdit(range, '');
  }
  constructor(public range: Range, public newText: string) {}
}

export class WorkspaceEdit {
  private changes = new Map<string, TextEdit[]>();
  insert(uri: any, position: Position, newText: string): void {
    const key = uri.toString ? uri.toString() : String(uri);
    const list = this.changes.get(key) || [];
    list.push(TextEdit.insert(position, newText));
    this.changes.set(key, list);
  }
  replace(uri: any, range: Range, newText: string): void {
    const key = uri.toString ? uri.toString() : String(uri);
    const list = this.changes.get(key) || [];
    list.push(TextEdit.replace(range, newText));
    this.changes.set(key, list);
  }
  delete(uri: any, range: Range): void {
    const key = uri.toString ? uri.toString() : String(uri);
    const list = this.changes.get(key) || [];
    list.push(TextEdit.delete(range));
    this.changes.set(key, list);
  }
  set(uri: any, edits: TextEdit[]): void {
    const key = uri.toString ? uri.toString() : String(uri);
    this.changes.set(key, edits);
  }
  get(uri: any): TextEdit[] | undefined {
    const key = uri.toString ? uri.toString() : String(uri);
    return this.changes.get(key);
  }
}

export class CancellationError extends Error {
  constructor() {
    super('Canceled');
    this.name = 'CancellationError';
  }
}

export class FileSystemError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = 'FileSystemError';
  }
}

export class ThemeColor {
  constructor(public id: string) {}
}

export class ThemeIcon {
  constructor(public id: string, public color?: ThemeColor) {}
}

export class RelativePattern {
  constructor(public base: any, public pattern: string) {}
}

export class Uri {
  static file(path: string): Uri {
    return new Uri('file', path);
  }
  static parse(uriStr: string): Uri {
    if (uriStr.startsWith('file://')) {
      return new Uri('file', uriStr.substring(7).replace(/^\/+/, ''));
    }
    return new Uri('file', uriStr);
  }
  static joinPath(base: Uri, ...pathSegments: string[]): Uri {
    const p = require('path');
    return new Uri(base.scheme, p.join(base.fsPath, ...pathSegments));
  }
  constructor(public readonly scheme: string, public readonly fsPath: string) {}
  toString(): string {
    const p = this.fsPath.replace(/\\/g, '/');
    return p.startsWith('file://') ? p : `${this.scheme}:///${p.replace(/^\/+/, '')}`;
  }
}

export class EventEmitter<T = any> {
  private listeners: ((e: T) => void)[] = [];
  public event = (listener: (e: T) => void) => {
    this.listeners.push(listener);
    return {
      dispose: () => {
        this.listeners = this.listeners.filter((l) => l !== listener);
      }
    };
  };
  public fire(data: T): void {
    for (const l of this.listeners) {
      l(data);
    }
  }
  public dispose(): void {
    this.listeners = [];
  }
}

export class Disposable {
  static from(...disposables: { dispose(): any }[]): Disposable {
    return new Disposable(() => {
      for (const d of disposables) {
        d.dispose();
      }
    });
  }
  constructor(private readonly callOnDispose: () => any) {}
  dispose(): any {
    return this.callOnDispose();
  }
}

export class DebugAdapterExecutable {
  constructor(public command: string, public args: string[] = [], public options?: any) {}
}

export class DebugAdapterServer {
  constructor(public port: number, public host?: string) {}
}

export class Task {
  constructor(
    public definition: any,
    public scope: any,
    public name: string,
    public source: string,
    public execution?: any,
    public problemMatchers?: string | string[]
  ) {}
}

export class ProcessExecution {
  constructor(public process: string, public args: string[] = [], public options?: any) {}
}

export class ShellExecution {
  constructor(public commandLine: string, public options?: any) {}
}

export enum TaskScope {
  Global = 1,
  Workspace = 2
}

export const TaskGroup = {
  Clean: { isDefault: false },
  Build: { isDefault: true },
  Rebuild: { isDefault: false },
  Test: { isDefault: false }
};

export enum ViewColumn {
  Active = -1,
  Beside = -2,
  One = 1,
  Two = 2,
  Three = 3
}

export enum StatusBarAlignment {
  Left = 1,
  Right = 2
}

export enum DiagnosticSeverity {
  Error = 0,
  Warning = 1,
  Information = 2,
  Hint = 3
}

export enum ProgressLocation {
  SourceControl = 1,
  Window = 10,
  Notification = 15
}

export enum ConfigurationTarget {
  Global = 1,
  Workspace = 2,
  WorkspaceFolder = 3
}

export enum SymbolKind {
  File = 0,
  Module = 1,
  Namespace = 2,
  Package = 3,
  Class = 4,
  Method = 5,
  Property = 6,
  Field = 7,
  Constructor = 8,
  Enum = 9,
  Interface = 10,
  Function = 11,
  Variable = 12,
  Constant = 13,
  String = 14,
  Number = 15,
  Boolean = 16,
  Array = 17,
  Object = 18,
  Key = 19,
  Null = 20,
  EnumMember = 21,
  Struct = 22,
  Event = 23,
  Operator = 24,
  TypeParameter = 25
}

export enum CompletionItemKind {
  Text = 0,
  Method = 1,
  Function = 2,
  Constructor = 3,
  Field = 4,
  Variable = 5,
  Class = 6,
  Interface = 7,
  Module = 8,
  Property = 9,
  Unit = 10,
  Value = 11,
  Enum = 12,
  Keyword = 13,
  Snippet = 14,
  Color = 15,
  File = 16,
  Reference = 17,
  Folder = 18,
  EnumMember = 19,
  Constant = 20,
  Struct = 21,
  Event = 22,
  Operator = 23,
  TypeParameter = 24
}

export const CodeActionKind = {
  QuickFix: 'quickfix',
  Refactor: 'refactor',
  RefactorExtract: 'refactor.extract',
  RefactorInline: 'refactor.inline',
  RefactorRewrite: 'refactor.rewrite',
  Source: 'source',
  SourceOrganizeImports: 'source.organizeImports'
};

export const mockVscode: any = {
  Position,
  Range,
  Selection,
  Location,
  CodeLens,
  DocumentLink,
  CodeAction,
  CodeActionKind,
  DocumentSymbol,
  Diagnostic,
  DiagnosticSeverity,
  InlayHint,
  CallHierarchyItem,
  TypeHierarchyItem,
  SnippetString,
  CompletionItem,
  CompletionItemKind,
  CompletionList,
  SymbolInformation,
  SymbolKind,
  MarkdownString,
  Hover,
  SignatureHelp,
  SignatureInformation,
  ParameterInformation,
  TextEdit,
  WorkspaceEdit,
  CancellationError,
  FileSystemError,
  ThemeColor,
  ThemeIcon,
  RelativePattern,
  ConfigurationTarget,
  DebugAdapterExecutable,
  DebugAdapterServer,
  Task,
  ProcessExecution,
  ShellExecution,
  TaskScope,
  TaskGroup,
  ProgressLocation,
  Uri,
  EventEmitter,
  Disposable,
  StatusBarAlignment,
  window: {
    createStatusBarItem: () => ({
      text: '',
      tooltip: '',
      command: '',
      show: () => {},
      hide: () => {},
      dispose: () => {}
    }),
    createOutputChannel: (name: string) => ({
      name,
      appendLine: () => {},
      append: () => {},
      clear: () => {},
      show: () => {},
      dispose: () => {}
    }),
    showInformationMessage: async () => undefined,
    showErrorMessage: async () => undefined,
    showWarningMessage: async () => undefined,
    withProgress: async (_options: any, task: any) => {
      return task({ report: () => {} }, { onCancellationRequested: () => {} });
    },
    visibleTextEditors: [],
    onDidChangeActiveTextEditor: () => ({ dispose: () => {} }),
    onDidChangeTextEditorVisibleRanges: () => ({ dispose: () => {} }),
    onDidChangeTextEditorSelection: () => ({ dispose: () => {} }),
    createTextEditorDecorationType: () => ({ dispose: () => {} }),
    createWebviewPanel: (viewType: string, title: string, showOptions: any, options: any) => {
      let messageListener: any = null;
      let disposeListener: any = null;
      return {
        viewType,
        title,
        webview: {
          html: '',
          asWebviewUri: (uri: any) => uri,
          postMessage: async (msg: any) => {
            if (messageListener) messageListener(msg);
          },
          onDidReceiveMessage: (listener: any) => {
            messageListener = listener;
            return { dispose: () => { messageListener = null; } };
          }
        },
        reveal: () => {},
        dispose: () => {
          if (disposeListener) {
            const cb = disposeListener;
            disposeListener = null;
            cb();
          }
        },
        onDidDispose: (listener: any) => {
          disposeListener = listener;
          return { dispose: () => { disposeListener = null; } };
        }
      };
    }
  },
  ViewColumn,
  workspace: {
    getConfiguration: (_section?: string) => ({
      get: (key: string, defaultValue?: any) => defaultValue,
      update: async () => {}
    }),
    createFileSystemWatcher: () => ({
      onDidChange: () => ({ dispose: () => {} }),
      onDidCreate: () => ({ dispose: () => {} }),
      onDidDelete: () => ({ dispose: () => {} }),
      dispose: () => {}
    }),
    onDidCloseTextDocument: () => ({ dispose: () => {} }),
    onDidChangeConfiguration: () => ({ dispose: () => {} }),
    workspaceFolders: []
  },
  commands: {
    registerCommand: (_cmd: string, _callback: any) => ({ dispose: () => {} }),
    executeCommand: async () => undefined
  },
  tasks: {
    registerTaskProvider: () => ({ dispose: () => {} })
  },
  debug: {
    registerDebugConfigurationProvider: () => ({ dispose: () => {} }),
    registerDebugAdapterDescriptorFactory: () => ({ dispose: () => {} })
  },
  languages: {
    registerCompletionItemProvider: () => ({ dispose: () => {} }),
    registerCodeActionsProvider: () => ({ dispose: () => {} }),
    registerInlayHintsProvider: () => ({ dispose: () => {} }),
    registerHoverProvider: () => ({ dispose: () => {} }),
    registerDefinitionProvider: () => ({ dispose: () => {} })
  }
};

const originalRequire = (Module.prototype as any).require;
(Module.prototype as any).require = function (id: string) {
  if (id === 'vscode') {
    return mockVscode;
  }
  return originalRequire.apply(this, arguments);
};
