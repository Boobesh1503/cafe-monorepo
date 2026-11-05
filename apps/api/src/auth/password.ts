import argon2 from 'argon2';

/**
 * Hashes a plaintext password using Argon2id with OWASP-recommended parameters:
 * Memory: 64MB (65536 KB), Time cost: 3 iterations, Parallelism: 4 threads.
 */
export async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

/**
 * Verifies a plaintext password against an Argon2id hash.
 */
export async function verifyPassword(hash: string, plaintext: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plaintext);
  } catch {
    return false;
  }
}

