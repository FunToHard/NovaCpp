/**
 * Helper to extract quoted string supporting escaped quotes (\") without premature truncation.
 */
function extractQuotedString(val: string): string {
  let isEscaped = false;
  for (let i = 1; i < val.length; i++) {
    const char = val[i];
    if (isEscaped) {
      isEscaped = false;
      continue;
    }
    if (char === '\\') {
      isEscaped = true;
      continue;
    }
    if (char === '"') {
      return val.substring(0, i + 1);
    }
  }
  return val;
}

/**
 * Parses Linux Kernel / Zephyr / RTOS Kconfig `.config` file into compiler defines (-D).
 */
export function parseDotConfig(content: string): string[] {
  const defines: string[] = [];
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eqIdx = trimmed.indexOf('=');
    if (eqIdx !== -1) {
      const key = trimmed.substring(0, eqIdx).trim();
      let val = trimmed.substring(eqIdx + 1).trim();

      // Handle quoted string values with potential inline comments after closing quote
      if (val.startsWith('"')) {
        val = extractQuotedString(val);
      } else {
        // Strip inline comments (#, //, /* ... */)
        val = val.replace(/\s*(?:#|\/\/|\/\*).*$/, '').trim();
      }

      // 'n' means disabled/undefined in Kconfig; defining -DCONFIG_FOO=n would evaluate to true!
      if (val === 'n' || val === 'N') {
        continue;
      }

      if (val === 'y' || val === 'Y' || val === 'm' || val === 'M') {
        defines.push(`${key}=1`);
      } else {
        defines.push(`${key}=${val}`);
      }
    }
  }

  return defines;
}

export const parseKconfig = parseDotConfig;
