import * as fs from 'fs';
import * as path from 'path';
import { TimeTraceSummary, parseFTimeTrace } from '../analysis/include-visualizer';
import { StructLayout, calculateStructLayout, StructLayoutOptions } from '../inspector/memory-layout-inspector';
import { CMakeProjectInfo } from '../cmake/cmake-models';
import { CMakeParser } from '../cmake/cmake-parser';
import { SolutionModel, VcxProjectModel, ProjectCompileOptions } from '../solution/solution-models';
import { parseSolutionFile, loadVcxProject, readFileWithEncoding } from '../solution/sln-parser';

export interface INativeBridge {
  readonly isAccelerated: boolean;
  readonly nativeVersion: string | null;
  parseTimeTrace(filePath: string): Promise<TimeTraceSummary>;
  parseTimeTraceContent(content: string): TimeTraceSummary;
  calculateStructLayout(
    structName: string,
    rawFields: { type: string; name: string }[],
    options?: StructLayoutOptions
  ): StructLayout;
  parseCMakeWorkspace(workspaceRoot: string): Promise<CMakeProjectInfo | null>;
  parseSolution(filePath: string): Promise<SolutionModel | null>;
  parseVcxproj(filePath: string, solutionDir?: string): Promise<VcxProjectModel | null>;
}

export class NativeBridgeImpl implements INativeBridge {
  public isAccelerated = false;
  public nativeVersion: string | null = null;
  private nativeBinding: any = null;

  constructor(customAddonPath?: string) {
    this.loadNativeBinding(customAddonPath);
  }

  private loadNativeBinding(customPath?: string): void {
    const candidatePaths = customPath
      ? [customPath]
      : [
          path.resolve(__dirname, '../../native/novacpp_native.node'),
          path.resolve(__dirname, '../../../native/novacpp_native.node'),
          path.resolve(__dirname, '../../crates/novacpp-native/target/release/novacpp_native.node'),
          path.resolve(__dirname, '../../../target/release/novacpp_native.node'),
          path.resolve(__dirname, '../../../target/release/novacpp_native.dll')
        ];

    for (const cand of candidatePaths) {
      if (fs.existsSync(cand)) {
        try {
          // Dynamic require for Node-API addon
          this.nativeBinding = (typeof __non_webpack_require__ !== 'undefined' ? __non_webpack_require__ : require)(cand);
          this.isAccelerated = true;
          if (this.nativeBinding?.getNativeEngineVersion) {
            this.nativeVersion = this.nativeBinding.getNativeEngineVersion();
          }
          break;
        } catch {
          this.nativeBinding = null;
          this.isAccelerated = false;
        }
      }
    }
  }

  public async parseTimeTrace(filePath: string): Promise<TimeTraceSummary> {
    if (this.isAccelerated && this.nativeBinding?.parseFtimeTraceFile) {
      try {
        const nativeResult = await this.nativeBinding.parseFtimeTraceFile(filePath);
        if (nativeResult) {
          return nativeResult;
        }
      } catch (err) {
        console.warn('NovaCpp: Native time-trace analyzer failed, falling back to TypeScript:', err);
      }
    }

    // Pure TypeScript fallback
    const content = await fs.promises.readFile(filePath, 'utf8');
    return parseFTimeTrace(content);
  }

  public parseTimeTraceContent(content: string): TimeTraceSummary {
    if (this.isAccelerated && this.nativeBinding?.parseFtimeTraceContent) {
      try {
        const nativeResult = this.nativeBinding.parseFtimeTraceContent(content);
        if (nativeResult) {
          return nativeResult;
        }
      } catch (err) {
        console.warn('NovaCpp: Native time-trace parser failed, falling back to TypeScript:', err);
      }
    }

    return parseFTimeTrace(content);
  }

  public calculateStructLayout(
    structName: string,
    rawFields: { type: string; name: string }[],
    options?: StructLayoutOptions
  ): StructLayout {
    if (this.isAccelerated && this.nativeBinding?.calculateStructLayoutNative) {
      try {
        const nativeLayout = this.nativeBinding.calculateStructLayoutNative(structName, rawFields, options);
        if (nativeLayout) {
          return nativeLayout;
        }
      } catch (err) {
        console.warn('NovaCpp: Native struct layout calculator failed, falling back to TypeScript:', err);
      }
    }

    return calculateStructLayout(structName, rawFields, options);
  }

  public async parseCMakeWorkspace(workspaceRoot: string): Promise<CMakeProjectInfo | null> {
    if (this.isAccelerated && this.nativeBinding?.parseCmakeWorkspaceNative) {
      try {
        const nativeProject = await this.nativeBinding.parseCmakeWorkspaceNative(workspaceRoot);
        if (nativeProject) {
          return nativeProject;
        }
      } catch (err) {
        console.warn('NovaCpp: Native CMake parser failed, falling back to TypeScript:', err);
      }
    }

    return CMakeParser.parseWorkspace(workspaceRoot);
  }

  public async parseSolution(filePath: string): Promise<SolutionModel | null> {
    if (this.isAccelerated && (this.nativeBinding?.parseSlnContentNative || this.nativeBinding?.parseSlnxContentNative)) {
      try {
        if (!fs.existsSync(filePath)) return null;
        const content = await readFileWithEncoding(filePath);
        const ext = path.extname(filePath).toLowerCase();
        if (ext === '.slnx' && this.nativeBinding.parseSlnxContentNative) {
          return this.nativeBinding.parseSlnxContentNative(content, filePath);
        } else if (ext === '.sln' && this.nativeBinding.parseSlnContentNative) {
          return this.nativeBinding.parseSlnContentNative(content, filePath);
        }
      } catch (err) {
        console.warn('NovaCpp: Native solution parser failed, falling back to TypeScript:', err);
      }
    }

    return parseSolutionFile(filePath);
  }

  public async parseVcxproj(filePath: string, solutionDir?: string): Promise<VcxProjectModel | null> {
    if (this.isAccelerated && this.nativeBinding?.parseVcxprojContentNative) {
      try {
        if (!fs.existsSync(filePath)) return null;
        const content = await readFileWithEncoding(filePath);
        const nativeModel = this.nativeBinding.parseVcxprojContentNative(content, filePath, solutionDir);
        if (nativeModel) {
          const compileOptionsByConfig = new Map<string, ProjectCompileOptions>();
          if (nativeModel.compileOptionsByConfig) {
            for (const [k, v] of Object.entries(nativeModel.compileOptionsByConfig)) {
              compileOptionsByConfig.set(k, v as ProjectCompileOptions);
            }
          }
          return {
            ...nativeModel,
            compileOptionsByConfig
          };
        }
      } catch (err) {
        console.warn('NovaCpp: Native vcxproj parser failed, falling back to TypeScript:', err);
      }
    }

    return loadVcxProject(filePath, solutionDir);
  }
}

declare const __non_webpack_require__: any;

export const NativeBridge: INativeBridge = new NativeBridgeImpl();
