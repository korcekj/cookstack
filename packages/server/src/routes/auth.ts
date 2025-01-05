import type { Env } from '../types';
import type { GoogleUser } from '@cs/utils/zod';

import {
  signInSchema,
  signUpSchema,
  confirmPassword,
  verifyEmailSchema,
  signInGoogleSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  signInGoogleCallbackSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { Provider } from '../types';
import { OAuth2RequestError } from 'arctic';
import { initializeDB } from '../services/db';
import { verifyAuth } from '../middlewares/auth';
import { initializeAuth } from '../services/auth';
import { setCookie, getCookie } from 'hono/cookie';
import { initializeImage } from '../services/image';
import { initializeEmail } from '../services/email';
import { validator } from '../middlewares/validation';
import { isURL, slugify, generateId } from '@cs/utils';
import { users, oauthAccounts } from '../services/db/schema';
import { generateState, generateCodeVerifier } from 'arctic';
import rateLimit, { rateLimiter } from '../middlewares/rate-limit';

const auth = new Hono<Env>();
const signIn = new Hono<Env>();
const signUp = new Hono<Env>();
const signOut = new Hono<Env>();
const verifyEmail = new Hono<Env>();
const resetPassword = new Hono<Env>();

signIn.get('/google', validator('query', signInGoogleSchema), async c => {
  const { redirectUrl } = c.req.valid('query');
  const state = redirectUrl ?? generateState();
  const code = generateCodeVerifier();

  const { google } = initializeAuth(c);
  const url = await google.createAuthorizationURL(state, code, {
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
});

signIn.get(
  '/google/callback',
  validator('query', signInGoogleCallbackSchema),
  async c => {
    const { t } = c.get('i18n');
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
      const auth = initializeAuth(c);
      const tokens = await auth.google.validateAuthorizationCode(
        code,
        cookieCode,
      );

      const response = await fetch(
        'https://openidconnect.googleapis.com/v1/userinfo',
        {
          headers: {
            Authorization: `Bearer ${tokens.accessToken}`,
          },
        },
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
              eq(table.providerUserId, user.sub),
            ),
        })) ?? {};

      if (!userId) {
        const image = initializeImage(c);
        const imageUrl = image.url(user.picture).toString();

        userId = generateId(16);
        [[{ id: userId }]] = await db.batch([
          db
            .insert(users)
            .values({
              id: userId,
              slug: userId.slice(-4),
              email: user.email,
              emailVerified: true,
              firstName: user.given_name,
              lastName: user.family_name,
              imageUrl,
            })
            .onConflictDoUpdate({
              target: users.email,
              set: {
                imageUrl,
                emailVerified: true,
                firstName: user.given_name,
                lastName: user.family_name,
                updatedAt: new Date(),
              },
            })
            .returning({ id: users.id }),
        ]);

        await db.batch([
          db
            .insert(oauthAccounts)
            .values({
              providerId: Provider.Google,
              providerUserId: user.sub,
              userId,
            })
            .onConflictDoNothing(),
          db
            .update(users)
            .set({
              slug: auth.slugify({
                userId,
                firstName: user.given_name,
                lastName: user.family_name,
              }),
            })
            .where(eq(users.id, userId)),
        ]);
      }

      const session = await auth.lucia.createSession(userId, {});
      const cookie = auth.lucia.createSessionCookie(session.id);

      setCookie(c, cookie.name, cookie.value, cookie.attributes);

      if (isURL(state)) return c.redirect(state, 301);
      return c.redirect('/', 301);
    } catch (err) {
      if (err instanceof OAuth2RequestError) {
        return c.json({ error: t('auth.invalidCode') }, 400);
      }
      return c.json({ error: t('errors.internalServerError') }, 500);
    }
  },
);

signIn.post('/', rateLimit, validator('json', signInSchema), async c => {
  const { t } = c.get('i18n');
  const { email, password } = c.req.valid('json');

  const auth = initializeAuth(c);
  const db = initializeDB(c.env.DB);

  const user = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
  });

  if (!user || !user.hashedPassword) {
    return c.json({ error: t('auth.invalidEmailPassword') }, 400);
  }

  const isValid = await auth.verifyPassword(user.hashedPassword, password);
  if (!isValid) {
    return c.json({ error: t('auth.invalidEmailPassword') }, 400);
  }

  const session = await auth.lucia.createSession(user.id, {});
  const cookie = auth.lucia.createSessionCookie(session.id);

  setCookie(c, cookie.name, cookie.value, cookie.attributes);

  const { user: luciaUser } = await auth.lucia.validateSession(session.id);
  return c.json(luciaUser);
});

signUp.use(rateLimit);
signUp.post('/', validator('json', confirmPassword(signUpSchema)), async c => {
  const { t } = c.get('i18n');
  const { firstName, lastName, email, password } = c.req.valid('json');

  const auth = initializeAuth(c);
  const db = initializeDB(c.env.DB);

  const exists = await db.query.users.findFirst({
    where: (table, { eq }) => eq(table.email, email),
    columns: { email: true },
  });

  if (exists) return c.json({ error: { email: t('auth.existsEmail') } }, 400);

  const userId = generateId(16);
  const hashedPassword = await auth.hashPassword(password);
  const slug = auth.slugify({ userId, firstName, lastName });

  await db.insert(users).values({
    id: userId,
    slug,
    email,
    hashedPassword,
    firstName,
    lastName,
  });

  const code = await auth.verificationCode({
    userId,
    email,
  });

  const mail = initializeEmail(c);
  c.executionCtx.waitUntil(
    mail.send({
      to: email,
      subject: t('emails.verificationCode.subject'),
      html: mail.templates.verificationCode({ code }),
    }),
  );

  const session = await auth.lucia.createSession(userId, {});
  const cookie = auth.lucia.createSessionCookie(session.id);

  setCookie(c, cookie.name, cookie.value, cookie.attributes);

  const { user: luciaUser } = await auth.lucia.validateSession(session.id);
  return c.json(luciaUser, 201);
});

signOut.use(rateLimit);
signOut.use(verifyAuth);
signOut.post('/', async c => {
  const session = c.get('session')!;

  const { lucia } = initializeAuth(c);

  await lucia.invalidateSession(session.id);
  const cookie = lucia.createBlankSessionCookie();

  setCookie(c, cookie.name, cookie.value, cookie.attributes);

  return c.body(null, 204);
});

verifyEmail.use(verifyAuth);
verifyEmail.post('/', rateLimiter(1, '1 m'), async c => {
  const { t } = c.get('i18n');
  const { id: userId, email, emailVerified } = c.get('user')!;

  if (emailVerified) return c.json({ error: t('errors.badRequest') }, 400);

  const auth = initializeAuth(c);

  const code = await auth.verificationCode({ userId, email });

  const mail = initializeEmail(c);
  c.executionCtx.waitUntil(
    mail.send({
      to: email,
      subject: t('emails.verificationCode.subject'),
      html: mail.templates.verificationCode({ code }),
    }),
  );

  return c.body(null, 204);
});

verifyEmail.post(
  '/:code',
  rateLimit,
  validator('param', verifyEmailSchema),
  async c => {
    const { t } = c.get('i18n');
    const { code } = c.req.valid('param');
    const { id: userId, email } = c.get('user')!;

    const auth = initializeAuth(c);
    const db = initializeDB(c.env.DB);
    const validCode = await auth.verifyCode({
      userId,
      email,
      code,
    });
    if (!validCode) return c.json({ error: t('auth.invalidCode') }, 400);

    await auth.lucia.invalidateUserSessions(userId);
    await db
      .update(users)
      .set({ emailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));

    const session = await auth.lucia.createSession(userId, {});
    const cookie = auth.lucia.createSessionCookie(session.id);

    setCookie(c, cookie.name, cookie.value, cookie.attributes);

    const { user: luciaUser } = await auth.lucia.validateSession(session.id);
    return c.json(luciaUser);
  },
);

resetPassword.post(
  '/',
  rateLimiter(1, '1 m'),
  validator('query', forgotPasswordSchema.pick({ redirectUrl: true })),
  validator('json', forgotPasswordSchema.omit({ redirectUrl: true })),
  async c => {
    const { t } = c.get('i18n');
    const { email } = c.req.valid('json');
    const { redirectUrl = '' } = c.req.valid('query');

    const auth = initializeAuth(c);
    const db = initializeDB(c.env.DB);
    const user = await db.query.users.findFirst({
      where: (table, { eq }) => eq(table.email, email),
    });
    if (!user || !user.hashedPassword || !user.emailVerified) {
      return c.json({ error: t('auth.invalidEmail') }, 400);
    }

    const token = await auth.resetToken({
      userId: user.id,
    });
    let link = `${c.env.BASE_URL}/api/auth/reset-password/${token}`;
    if (isURL(redirectUrl)) {
      link = `${redirectUrl.replace(/\/+$/g, '')}/${token}`;
    }

    const mail = initializeEmail(c);
    c.executionCtx.waitUntil(
      mail.send({
        to: email,
        subject: t('emails.passwordReset.subject'),
        html: mail.templates.passwordReset({ link }),
      }),
    );

    return c.body(null, 204);
  },
);

resetPassword.post(
  '/:token',
  rateLimit,
  validator('param', resetPasswordSchema.pick({ token: true })),
  validator('json', confirmPassword(resetPasswordSchema.omit({ token: true }))),
  async c => {
    const { t } = c.get('i18n');
    const { token } = c.req.valid('param');
    const { password } = c.req.valid('json');

    const auth = initializeAuth(c);

    const userId = await auth.verifyToken({ token });
    if (!userId) return c.json({ error: t('auth.invalidToken') }, 400);

    await auth.lucia.invalidateUserSessions(userId);

    await auth.resetPassword({ token, userId, password });

    const session = await auth.lucia.createSession(userId, {});
    const cookie = auth.lucia.createSessionCookie(session.id);

    setCookie(c, cookie.name, cookie.value, cookie.attributes);

    const { user: luciaUser } = await auth.lucia.validateSession(session.id);
    return c.json(luciaUser);
  },
);

auth.route('/sign-in', signIn);
auth.route('/sign-up', signUp);
auth.route('/sign-out', signOut);
auth.route('/verify-email', verifyEmail);
auth.route('/reset-password', resetPassword);

export default auth;
