import type { Context } from 'hono';
import type { Env, AuthConfig } from '../types';
import type { User } from '../services/db/schema';

import {
  users,
  sessions,
  emailVerificationCodes,
  passwordResetTokens,
} from '../services/db/schema';
import { Google } from 'arctic';
import { eq } from 'drizzle-orm';
import { sha256, pbkdf2 } from '../utils';
import { omit, parseUrl } from '@cs/utils';
import { initializeDB } from '../services/db';
import { Lucia, generateIdFromEntropySize } from 'lucia';
import { generateRandomString, alphabet } from 'oslo/crypto';
import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { TimeSpan, createDate, isWithinExpirationDate } from 'oslo';

declare module 'lucia' {
  interface Register {
    Lucia: typeof auth.lucia;
    DatabaseUserAttributes: User;
  }
}

export const auth = {
  config: {} as AuthConfig,
  configure(config: AuthConfig) {
    this.config = {
      ...this.config,
      ...config,
    };
    return this;
  },
  get lucia() {
    const { bindings, url } = this.config;
    const { domain, tld } = parseUrl(url);
    const adapter = new DrizzleSQLiteAdapter(
      initializeDB(bindings.DB),
      sessions,
      users
    );
    return new Lucia(adapter, {
      getUserAttributes: (attributes) => omit(attributes, ['hashedPassword']),
      sessionExpiresIn: new TimeSpan(30, 'd'),
      sessionCookie: {
        attributes: {
          secure: bindings.ENV === 'production',
          domain: `.${domain}${tld ? `.${tld}` : ''}`,
          sameSite: bindings.ENV === 'production' ? 'none' : undefined,
        },
      },
    });
  },
  get google() {
    const { bindings } = this.config;
    return new Google(
      bindings.GOOGLE_CLIENT_ID!,
      bindings.GOOGLE_CLIENT_SECRET!,
      bindings.GOOGLE_REDIRECT_URL!
    );
  },
  hashPassword(password: string) {
    return pbkdf2.hash(password);
  },
  verifyPassword(hash: string, password: string) {
    return pbkdf2.verify(hash, password);
  },
  async verificationCode({ userId, email }: { userId: string; email: string }) {
    const { bindings } = this.config;
    const db = initializeDB(bindings.DB);
    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.userId, userId));
    const id = generateIdFromEntropySize(10);
    const code = generateRandomString(6, alphabet('0-9'));
    await db.insert(emailVerificationCodes).values({
      id,
      userId,
      email,
      code,
      expiresAt: createDate(new TimeSpan(15, 'm')),
    });
    return code;
  },
  async verifyCode({
    userId,
    email,
    code,
  }: {
    userId: string;
    email: string;
    code: string;
  }) {
    const { bindings } = this.config;
    const db = initializeDB(bindings.DB);
    const validCode = await db.query.emailVerificationCodes.findFirst({
      where: (table, { eq }) => eq(table.userId, userId),
    });
    if (!validCode || validCode.code !== code) return false;

    await db
      .delete(emailVerificationCodes)
      .where(eq(emailVerificationCodes.id, validCode.id));

    if (!isWithinExpirationDate(validCode.expiresAt)) return false;
    return validCode.email === email;
  },
  async resetToken({ userId }: { userId: string }) {
    const { bindings } = this.config;
    const db = initializeDB(bindings.DB);
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
    const token = generateIdFromEntropySize(25);
    const hashedToken = sha256(token);
    await db.insert(passwordResetTokens).values({
      hashedToken,
      userId,
      expiresAt: createDate(new TimeSpan(2, 'h')),
    });
    return token;
  },
};

export const initializeAuth = (c: Context<Env>) => {
  return auth.configure({
    bindings: c.env,
    url: c.req.url,
  });
};
