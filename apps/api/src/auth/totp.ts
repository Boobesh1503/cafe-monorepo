import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

export function base32Encode(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';

  for (let i = 0; i < buffer.length; i++) {
    value = (value << 8) | buffer[i];
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return output;
}

export function base32Decode(encoded: string): Buffer {
  const clean = encoded.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const idx = BASE32_ALPHABET.indexOf(clean[i]);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return Buffer.from(bytes);
}

/**
 * Generates a random Base32 secret for TOTP (20 bytes = 160 bits).
 */
export function generateMfaSecret(): string {
  return base32Encode(randomBytes(20));
}

/**
 * Generates a 6-digit TOTP code for a given counter/time step.
 */
export function generateTotpCode(secretBase32: string, counter: number): string {
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));

  const hmac = createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binary =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);

  const otp = binary % 1000000;
  return otp.toString().padStart(6, '0');
}

/**
 * Verifies a 6-digit TOTP code with a ±1 window (covering -30s to +30s clock drift).
 */
export function verifyTotpCode(code: string, secretBase32: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;

  const currentCounter = Math.floor(Date.now() / 1000 / 30);
  const codeBuf = Buffer.from(code);

  for (let offset = -1; offset <= 1; offset++) {
    const expected = generateTotpCode(secretBase32, currentCounter + offset);
    const expectedBuf = Buffer.from(expected);
    if (expectedBuf.length === codeBuf.length && timingSafeEqual(expectedBuf, codeBuf)) {
      return true;
    }
  }

  return false;
}

/**
 * Formats standard otpauth:// URL for QR code generation in authenticator apps.
 */
export function getOtpAuthUri(email: string, secret: string, issuer = 'Foodie Cafe'): string {
  const encodedIssuer = encodeURIComponent(issuer);
  const encodedEmail = encodeURIComponent(email);
  return `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secret}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;
}

