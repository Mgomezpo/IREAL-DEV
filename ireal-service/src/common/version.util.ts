import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cachedVersion: string | undefined;

export const getAppVersion = (): string => {
  if (cachedVersion) {
    return cachedVersion;
  }

  try {
    // Resolve against the process working directory so it works in both
    // ts-node (src/*) and compiled dist/* executions.
    const packageJsonPath = join(process.cwd(), 'package.json');
    const raw = readFileSync(packageJsonPath, 'utf-8');
    const pkg = JSON.parse(raw) as { version?: string };
    cachedVersion = pkg.version ?? '0.0.0';
  } catch {
    cachedVersion = '0.0.0';
  }

  return cachedVersion;
};
