import { createHash } from 'node:crypto';

export const hashUserIdentifier = (identifier: string): string =>
  createHash('sha256')
    .update(identifier ?? '', 'utf8')
    .digest('hex')
    .slice(0, 32);
