import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32(buf: Buffer) {
  let bits = 0, value = 0, out = '';
  for (const b of buf) { value = (value << 8) | b; bits += 8; while (bits >= 5) { out += B32[(value >>> (bits - 5)) & 31]; bits -= 5; } }
  if (bits > 0) out += B32[(value << (5 - bits)) & 31];
  return out;
}
function unbase32(s: string) {
  let bits = 0, value = 0; const out: number[] = [];
  for (const c of s.replace(/=+$/, '').toUpperCase()) { const i = B32.indexOf(c); if (i < 0) continue; value = (value << 5) | i; bits += 5; if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; } }
  return Buffer.from(out);
}

export const newTotpSecret = () => base32(randomBytes(20));

function hotp(secret: string, counter: number) {
  const buf = Buffer.alloc(8); buf.writeBigUInt64BE(BigInt(counter));
  const h = createHmac('sha1', unbase32(secret)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  const n = ((h[o] & 0x7f) << 24) | (h[o + 1] << 16) | (h[o + 2] << 8) | h[o + 3];
  return String(n % 1_000_000).padStart(6, '0');
}

export function verifyTotp(secret: string, code: string, window = 1) {
  const c = code.replace(/\s/g, '');
  if (!/^\d{6}$/.test(c)) return false;
  const t = Math.floor(Date.now() / 30000);
  for (let i = -window; i <= window; i++) {
    const exp = Buffer.from(hotp(secret, t + i)), got = Buffer.from(c);
    if (exp.length === got.length && timingSafeEqual(exp, got)) return true;
  }
  return false;
}

export const otpauthUri = (email: string, secret: string) =>
  `otpauth://totp/Maison%20Jawaher:${encodeURIComponent(email)}?secret=${secret}&issuer=Maison%20Jawaher&algorithm=SHA1&digits=6&period=30`;
