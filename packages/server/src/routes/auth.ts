import type { Env, GoogleUser } from '../types';

import {
  hashSHA256,
  hashArgon2id,
  initializeLucia,
  initializeGoogle,
  generatePasswordResetToken,
  verifyEmailVerificationCode,
  generateEmailVerificationCode,
} from '../services/auth';
import {
  sendEmail,
  resetPasswordTemplate,
  verificationCodeTemplate,
} from '../services/email';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { isURL } from '../utils';
import { Provider } from '../types';
import { initializeDB } from '../db';
import { OAuth2RequestError } from 'arctic';
import { isWithinExpirationDate } from 'oslo';
import { useTranslation } from '@intlify/hono';
import { zValidator } from '@hono/zod-validator';
import { verifyAuth } from '../middlewares/auth';
import { generateIdFromEntropySize } from 'lucia';
import { setCookie, getCookie } from 'hono/cookie';
import { rateLimit } from '../middlewares/rate-limit';
import { generateState, generateCodeVerifier } from 'arctic';
import { users, oauthAccounts, passwordResetTokens } from '../db/schema';

import {
  parseError,
  signInSchema,
  signUpSchema,
  verifyEmailSchema,
  signInGoogleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  resetPasswordTokenSchema,
  signInGoogleCallbackSchema,
  generateResetPasswordTokenSchema,
} from '@cs/utils/zod';

const auth = new Hono<Env>();
const signIn = new Hono<Env>();
const signUp = new Hono<Env>();
const signOut = new Hono<Env>();
const verifyEmail = new Hono<Env>();
const resetPassword = new Hono<Env>();

signIn.get(
  '/google',
  zValidator('query', signInGoogleSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  async (c) => {
    const { redirectUrl } = c.req.valid('query');
    const state = redirectUrl ?? generateState();
    const code = generateCodeVerifier();
    const url = await initializeGoogle(c).createAuthorizationURL(state, code, {
      scopes: ['openid', 'profile', 'email'],
    });

    setCookie(c, 'google_oauth_state', state, {
      secure: c.env.ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 10,
    });

    setCookie(c, 'google_oauth_code', code, {
      secure: c.env.ENV === 'production',
      httpOnly: true,
      maxAge: 60 * 10,
    });

    return c.redirect(url.toString());
  }
);

signIn.get(
  '/google/callback',
  zValidator('query', signInGoogleCallbackSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  async (c) => {
    const t = useTranslation(c);
    const { state, code } = c.req.valid('query');
    const cookieState = getCookie(c, 'google_oauth_state') ?? null;
    const cookieCode = getCookie(c, 'google_oauth_code') ?? null;

    if (
      !state ||
      !cookieState ||
      !code ||
      cookieState !== state ||
      !cookieCode
    ) {
      return c.json({ error: t('errors.badRequest') }, 400);
    }

    try {
      const tokens = await initializeGoogle(c).validateAuthorizationCode(
        code,
        cookieCode
      );

      const response = await fetch(
        'https://openidconnect.googleapis.com/v1/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        }
      );

      const user = (await response.json()) as GoogleUser;
      if (!user?.email_verified) {
        return c.json({ error: t('auth.unverifiedEmail') }, 400);
      }

      const db = initializeDB(c.env.DB);
      let { userId } =
        (await db.query.oauthAccounts.findFirst({
          where: (table, { and, eq }) =>
            and(
              eq(table.providerId, Provider.Google),
              eq(table.providerUserId, user.sub)
            ),
        })) ?? {};

      if (!userId) {
        [{ id: userId }] = await db
          .insert(users)
          .values({
            id: generateIdFromEntropySize(10),
            email: user.email,
            emailVerified: true,
            firstName: user.given_name,
            lastName: user.family_name,
            imageUrl: user.picture,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: {
              emailVerified: true,
              firstName: user.given_name,
              lastName: user.family_name,
              imageUrl: user.picture,
            },
          })
          .returning({ id: users.id });
        await db
          .insert(oauthAccounts)
          .values({
            providerId: Provider.Google,
            providerUserId: user.sub,
            userId,
          })
          .onConflictDoNothing();
      }

      const lucia = initializeLucia(c);
      const session = await lucia.createSession(userId, {});
      const cookie = lucia.createSessionCookie(session.id);

      setCookie(c, cookie.name, cookie.value, cookie.attributes);

      if (isURL(state)) return c.redirect(state, 301);
      return c.redirect('/', 301);
    } catch (err) {
      if (err instanceof OAuth2RequestError) {
        return c.json({ error: t('auth.invalidCode') }, 400);
      }
      return c.json({ error: t('errors.internalServerError') }, 500);
    }
  }
);

signIn.post(
  '/',
  rateLimit,
  zValidator('json', signInSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  async (c) => {
    const t = useTranslation(c);
    const { email, password } = c.req.valid('json');

    const db = initializeDB(c.env.DB);
    const user = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, email),
    });

    if (!user || !user.hashedPassword) {
      return c.json({ error: t('auth.invalidEmailPassword') }, 400);
    }

    const hashedPassword = hashArgon2id(password, c.env.SALT);
    if (user.hashedPassword !== hashedPassword) {
      return c.json({ error: t('auth.invalidEmailPassword') }, 400);
    }

    const lucia = initializeLucia(c);
    const session = await lucia.createSession(user.id, {});
    const cookie = lucia.createSessionCookie(session.id);

    setCookie(c, cookie.name, cookie.value, cookie.attributes);

    const { user: luciaUser } = await lucia.validateSession(session.id);
    return c.json({ user: luciaUser });
  }
);

signUp.use(rateLimit);
signUp.post(
  '/',
  zValidator('json', signUpSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  async (c) => {
    const t = useTranslation(c);
    const { firstName, lastName, email, password } = c.req.valid('json');

    const db = initializeDB(c.env.DB);
    const exists = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, email),
      columns: { email: true },
    });

    if (exists) return c.json({ error: { email: t('auth.existsEmail') } }, 400);

    const hashedPassword = hashArgon2id(password, c.env.SALT);
    const [{ id: userId }] = await db
      .insert(users)
      .values({
        id: generateIdFromEntropySize(10),
        email,
        hashedPassword,
        firstName,
        lastName,
      })
      .returning({ id: users.id });

    const code = await generateEmailVerificationCode(c.env.DB, {
      userId,
      email,
    });
    await sendEmail(c, {
      to: email,
      subject: t('emails.verificationCode.subject'),
      html: verificationCodeTemplate(c, { code }),
    });

    const lucia = initializeLucia(c);
    const session = await lucia.createSession(userId, {});
    const cookie = lucia.createSessionCookie(session.id);

    setCookie(c, cookie.name, cookie.value, cookie.attributes);

    const { user: luciaUser } = await lucia.validateSession(session.id);
    return c.json({ user: luciaUser }, 201);
  }
);

signOut.use(rateLimit);
signOut.use(verifyAuth);
signOut.post('/', async (c) => {
  const session = c.get('session')!;

  const lucia = initializeLucia(c);
  await lucia.invalidateSession(session.id);
  const cookie = lucia.createBlankSessionCookie();

  setCookie(c, cookie.name, cookie.value, cookie.attributes);

  return c.json({ user: null });
});

verifyEmail.use(rateLimit);
verifyEmail.use(verifyAuth);
verifyEmail.post('/', async (c) => {
  const t = useTranslation(c);
  const { id: userId, email, emailVerified } = c.get('user')!;

  if (emailVerified) return c.json({ error: t('errors.badRequest') }, 400);

  const db = initializeDB(c.env.DB);
  const lastSent = await db.query.emailVerificationCodes.findFirst({
    where: (table, { eq }) => eq(table.userId, userId),
    columns: { expiresAt: true },
  });
  if (lastSent && isWithinExpirationDate(lastSent.expiresAt)) {
    return c.json({ error: t('errors.tryAgainInMinutes') }, 400);
  }

  const code = await generateEmailVerificationCode(c.env.DB, { userId, email });
  await sendEmail(c, {
    to: email,
    subject: t('emails.verificationCode.subject'),
    html: verificationCodeTemplate(c, { code }),
  });

  return c.body(null, 204);
});

verifyEmail.post(
  '/:code',
  zValidator('param', verifyEmailSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  async (c) => {
    const t = useTranslation(c);
    const { code } = c.req.valid('param');
    const { id: userId, email } = c.get('user')!;

    const validCode = await verifyEmailVerificationCode(c.env.DB, {
      userId,
      email,
      code,
    });
    if (!validCode) return c.json({ error: t('auth.invalidCode') }, 400);

    const lucia = initializeLucia(c);
    const db = initializeDB(c.env.DB);

    await lucia.invalidateUserSessions(userId);
    await db
      .update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId));

    const session = await lucia.createSession(userId, {});
    const cookie = lucia.createSessionCookie(session.id);

    setCookie(c, cookie.name, cookie.value, cookie.attributes);

    const { user: luciaUser } = await lucia.validateSession(session.id);
    return c.json({ user: luciaUser });
  }
);

resetPassword.use(rateLimit);
resetPassword.post(
  '/',
  zValidator('query', forgotPasswordSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  zValidator('json', generateResetPasswordTokenSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  async (c) => {
    const t = useTranslation(c);
    const { email } = c.req.valid('json');
    const { redirectUrl = '' } = c.req.valid('query');

    const db = initializeDB(c.env.DB);
    const user = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, email),
    });
    if (!user || !user.hashedPassword || !user.emailVerified) {
      return c.json({ error: t('auth.invalidEmail') }, 400);
    }

    const token = await generatePasswordResetToken(c.env.DB, {
      userId: user.id,
    });
    let link = `${c.env.BASE_URL}/api/auth/reset-password/${token}`;
    if (isURL(redirectUrl)) {
      link = `${redirectUrl.replace(/\/+$/g, '')}/${token}`;
    }

    await sendEmail(c, {
      to: email,
      subject: t('emails.resetPassword.subject'),
      html: resetPasswordTemplate(c, { link }),
    });

    return c.body(null, 204);
  }
);

resetPassword.post(
  '/:token',
  zValidator('param', resetPasswordTokenSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  zValidator('json', resetPasswordSchema, (result, c) => {
    if (!result.success) {
      const error = parseError(result.error);
      return c.json({ error }, 400);
    }
  }),
  async (c) => {
    const t = useTranslation(c);
    const { token } = c.req.valid('param');
    const { password } = c.req.valid('json');

    const db = initializeDB(c.env.DB);
    const hashedToken = hashSHA256(token);
    const validToken = await db.query.passwordResetTokens.findFirst({
      where: (table, { eq }) => eq(table.hashedToken, hashedToken),
    });
    if (validToken) {
      await db
        .delete(passwordResetTokens)
        .where(eq(passwordResetTokens.hashedToken, hashedToken));
    }

    if (!validToken || !isWithinExpirationDate(validToken.expiresAt)) {
      return c.json({ error: t('auth.invalidToken') }, 400);
    }

    const lucia = initializeLucia(c);
    await lucia.invalidateUserSessions(validToken.userId);

    const hashedPassword = hashArgon2id(password, c.env.SALT);
    await db
      .update(users)
      .set({ hashedPassword })
      .where(eq(users.id, validToken.userId));

    const session = await lucia.createSession(validToken.userId, {});
    const cookie = lucia.createSessionCookie(session.id);

    setCookie(c, cookie.name, cookie.value, cookie.attributes);

    const { user: luciaUser } = await lucia.validateSession(session.id);
    return c.json({ user: luciaUser });
  }
);

auth.route('/signin', signIn);
auth.route('/signup', signUp);
auth.route('/signout', signOut);
auth.route('/verify-email', verifyEmail);
auth.route('/reset-password', resetPassword);

export default auth;
