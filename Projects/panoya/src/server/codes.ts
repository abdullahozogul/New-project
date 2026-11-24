import 'server-only';
import { randomInt } from 'node:crypto';

/** Karışabilecek karakterler (0/O, 1/I/L) çıkarılmış alfabe. */
const ALPHA = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';

/** Anonim katılımcı kodu: PNY-XXXX-XXXX (~10^11 olasılık). Kişisel bilgi içermez. */
export function newParticipantCode(): string {
  const part = () => Array.from({ length: 4 }, () => ALPHA[randomInt(ALPHA.length)]).join('');
  return `PNY-${part()}-${part()}`;
}

export function normalizeCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, '');
}

export const CODE_RE = /^PNY-[2-9A-HJKMNP-Z]{4}-[2-9A-HJKMNP-Z]{4}$/;

export function cryptoShuffle<T>(a: readonly T[]): T[] {
  const b = a.slice();
  for (let i = b.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
