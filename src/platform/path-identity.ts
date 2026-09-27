import * as path from 'path';

/** Returns a stable key for comparing paths on the current host filesystem. */
export function getPathIdentity(filePath: string, platform: NodeJS.Platform = process.platform): string {
  const normalized = path.normalize(filePath);
  return platform === 'win32' ? normalized.toLowerCase() : normalized;
}
