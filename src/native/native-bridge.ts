import * as fs from 'fs';
import * as path from 'path';
import { TimeTraceSummary, parseFTimeTrace } from '../analysis/include-visualizer';
import { StructLayout, calculateStructLayout, StructLayoutOptions } from '../inspector/memory-layout-inspector';
import { CMakeProjectInfo } from '../cmake/cmake-models';
import { CMakeParser } from '../cmake/cmake-parser';

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
}

declare const __non_webpack_require__: any;

export const NativeBridge: INativeBridge = new NativeBridgeImpl();
