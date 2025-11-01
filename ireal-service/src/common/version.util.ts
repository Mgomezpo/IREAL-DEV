import { readFileSync } from 'node:fs';
import { join } from 'node:path';

let cachedVersion: string | undefined;

export const getAppVersion = (): string => {
  if (cachedVersion) {
    return cachedVersion;
  }

  const packageJsonPath = join(__dirname, '..', '..', 'package.json');
  const raw = readFileSync(packageJsonPath, 'utf-8');
  const pkg = JSON.parse(raw) as { version?: string };

  cachedVersion = pkg.version ?? '0.0.0';

  return cachedVersion;
};
