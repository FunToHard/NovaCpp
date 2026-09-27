import { CompilerInfo } from '../prober/compiler-detector';

export function isWslCompiler(compiler: CompilerInfo): boolean {
  return compiler.type === 'wsl-gcc' || compiler.type === 'wsl-clang';
}

/** Converts a Windows drive path to the default WSL mount path. */
export function toWslPath(filePath: string): string {
  const match = /^([A-Za-z]):[\\/](.*)$/.exec(filePath);
  if (!match) return filePath.replace(/\\/g, '/');
  return `/mnt/${match[1].toLowerCase()}/${match[2].replace(/\\/g, '/')}`;
}

export function getWslCompilerArgs(compiler: CompilerInfo): string[] {
  return ['--', ...(compiler.argsPrefix ?? [])];
}
