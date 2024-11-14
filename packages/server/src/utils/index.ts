import type { Context } from 'hono';

import { createHash, pbkdf2 as pbkdf2_, randomBytes } from 'crypto';

export const getIp = (c: Context) => c.req.header('cf-connecting-ip');

export const getCountry = (c: Context) => c.req.raw.cf?.country as string;

export const sha256 = (value: string | Uint8Array) => {
  return createHash('sha256').update(value).digest('hex');
};

export const pbkdf2 = {
  key(
    value: string | Uint8Array,
    salt: string | Uint8Array,
    options?: { c: number; dkLen: number; digest: 'sha256' | 'sha512' },
  ) {
    const { c = 100_000, dkLen = 64, digest = 'sha512' } = options ?? {};
    return new Promise<string>((resolve, reject) => {
      pbkdf2_(value, salt, c, dkLen, digest, (err, key) => {
        if (err) reject(err);
        else resolve(key.toString('hex'));
      });
    });
  },
  async hash(value: string | Uint8Array) {
    const salt = randomBytes(16).toString('hex');
    const key = await this.key(value, salt);
    return `${salt}:${key}`;
  },
  async verify(hash: string, value: string | Uint8Array) {
    const [salt, key] = hash.split(':');
    const targetKey = await this.key(value, salt);
    return targetKey === key;
  },
};
