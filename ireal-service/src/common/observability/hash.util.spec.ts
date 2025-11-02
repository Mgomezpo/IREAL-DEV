import { hashUserIdentifier } from './hash.util';

describe('hashUserIdentifier', () => {
  it('produces deterministic 32-char hash', () => {
    const hash = hashUserIdentifier('user-123');
    expect(hash).toHaveLength(32);
    expect(hash).toMatch(/^[a-f0-9]+$/);
    expect(hash).toBe(hashUserIdentifier('user-123'));
  });

  it('handles undefined input gracefully', () => {
    // @ts-expect-error testing runtime fallback for undefined
    const hash = hashUserIdentifier(undefined);
    expect(hash).toHaveLength(32);
  });
});
