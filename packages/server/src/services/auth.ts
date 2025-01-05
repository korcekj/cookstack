import type { Context } from 'hono';
import type { User } from './db/schema';
import type { Env, AuthConfig } from '../types';

import {
  sha256,
  pbkdf2,
  parseUrl,
  generateId,
  generateNumbers,
  slugify as _slugify,
} from '@cs/utils';
import {
  users,
  sessions,
  passwordResetTokens,
  emailVerificationCodes,
} from './db/schema';
import { Lucia } from 'lucia';
import { Google } from 'arctic';
import { eq } from 'drizzle-orm';
import { initializeDB } from './db';
import { userSchema } from '@cs/utils/zod';
import { generateName } from '../utils/generators';
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
      users,
    );
    return new Lucia(adapter, {
      getUserAttributes: attributes =>
        userSchema.omit({ id: true }).parse(attributes),
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
      bindings.GOOGLE_REDIRECT_URL!,
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
    const id = generateId(16);
    const code = generateNumbers(6);
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
    const token = generateId(40);
    const hashedToken = sha256(token);
    const db = initializeDB(bindings.DB);
    await db.batch([
      db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.userId, userId)),
      db.insert(passwordResetTokens).values({
        hashedToken,
        userId,
        expiresAt: createDate(new TimeSpan(2, 'h')),
      }),
    ]);
    return token;
  },
  async verifyToken({ token }: { token: string }) {
    const { bindings } = this.config;
    const db = initializeDB(bindings.DB);
    const hashedToken = sha256(token);
    const dbToken = await db.query.passwordResetTokens.findFirst({
      where: (table, { eq }) => eq(table.hashedToken, hashedToken),
    });

    if (!dbToken || !isWithinExpirationDate(dbToken.expiresAt)) {
      return null;
    }

    return dbToken.userId;
  },
  async resetPassword({
    token,
    userId,
    password,
  }: {
    token: string;
    userId: string;
    password: string;
  }) {
    const { bindings } = this.config;
    const db = initializeDB(bindings.DB);
    const hashedToken = sha256(token);
    const hashedPassword = await this.hashPassword(password);
    await db.batch([
      db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.hashedToken, hashedToken)),
      db
        .update(users)
        .set({ hashedPassword, updatedAt: new Date() })
        .where(eq(users.id, userId)),
    ]);
  },
  slugify({
    userId,
    firstName,
    lastName,
  }: {
    userId: string;
    firstName: string | null;
    lastName: string | null;
  }) {
    if (!firstName && !lastName) {
      return _slugify(`${generateName(userId)} ${userId.slice(-4)}`);
    }

    return _slugify(`${firstName ?? ''} ${lastName ?? ''} ${userId.slice(-4)}`);
  },
};

export const initializeAuth = (c: Context<Env>) => {
  return auth.configure({
    bindings: c.env,
    url: c.req.url,
  });
};
