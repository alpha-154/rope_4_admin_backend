import { generateKeyBetween as genBetween } from 'fractional-indexing';

export function generateKeyBetween(
  a: string | null | undefined,
  b: string | null | undefined,
): string {
  try {
    return genBetween(a ?? null, b ?? null);
  } catch {
    return 'a0';
  }
}

