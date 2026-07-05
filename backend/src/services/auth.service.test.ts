import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { env } from '../config/env';
import { hashSecret, signToken, verifySecret, verifyToken } from './auth.service';

describe('password hashing', () => {
  it('hashes a secret to a bcrypt string that is not the plaintext', async () => {
    const hash = await hashSecret('password123');
    expect(hash).not.toBe('password123');
    expect(hash).toMatch(/^\$2[aby]\$/);
  });

  it('verifies a matching secret', async () => {
    const hash = await hashSecret('password123');
    await expect(verifySecret('password123', hash)).resolves.toBe(true);
  });

  it('rejects a non-matching secret', async () => {
    const hash = await hashSecret('password123');
    await expect(verifySecret('wrong', hash)).resolves.toBe(false);
  });

  it('produces a different hash each time (random salt)', async () => {
    const a = await hashSecret('same');
    const b = await hashSecret('same');
    expect(a).not.toBe(b);
  });
});

describe('JWT tokens', () => {
  it('signs a token that round-trips through verifyToken', () => {
    const token = signToken({ userId: 'user-1' });
    expect(typeof token).toBe('string');
    expect(verifyToken(token)).toMatchObject({ userId: 'user-1' });
  });

  it('signs with the configured secret', () => {
    const token = signToken({ userId: 'user-2' });
    const decoded = jwt.verify(token, env.jwtSecret) as { userId: string };
    expect(decoded.userId).toBe('user-2');
  });

  it('throws when verifying a token signed with a different secret', () => {
    const foreign = jwt.sign({ userId: 'x' }, 'some-other-secret');
    expect(() => verifyToken(foreign)).toThrow();
  });

  it('throws on a malformed token', () => {
    expect(() => verifyToken('not-a-jwt')).toThrow();
  });
});
