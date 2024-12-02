'use server';

import type { User } from '@cs/utils/zod';

import {
  signInSchema,
  signUpSchema,
  confirmPassword,
  verifyEmailSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from '@cs/utils/zod';
import { env } from '@/env';
import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { formDataEntries } from '@cs/utils';
import { REDIRECTS } from '@/lib/constants';
import { getLocale } from 'next-intl/server';
import { fetch, HTTPError } from '@/utils/fetch';
import { setResponseCookies } from '@/utils/cookies';
import { withI18nZod, withUser } from '@/lib/actions';

export const signIn = withI18nZod(signInSchema, async data => {
  let user: User | null = null;
  const locale = await getLocale();
  try {
    const response = await fetch.post<User>('api/auth/sign-in', { json: data });
    user = await response.json();

    // TODO: remove
    console.log({ user });

    setResponseCookies(response.headers);
    revalidateTag('user');
  } catch (err) {
    if (err instanceof HTTPError) {
      const { error } = await err.response.json<{ error: string }>();
      return { error };
    }
  }

  if (!user || user.emailVerified) redirect({ href: REDIRECTS.home, locale });
  else redirect({ href: REDIRECTS.verify, locale });
});

export const signUp = withI18nZod(
  confirmPassword(signUpSchema),
  async (data, entries) => {
    const locale = await getLocale();
    try {
      const response = await fetch.post('api/auth/sign-up', { json: data });
      setResponseCookies(response.headers);
      revalidateTag('user');
    } catch (err) {
      if (err instanceof HTTPError) {
        const { error } = await err.response.json<{
          error: string | Record<string, string>;
        }>();
        if (typeof error === 'string') return { error };
        return { fields: formDataEntries(entries), fieldErrors: error };
      }
    }
    redirect({ href: REDIRECTS.verify, locale });
  },
);

export const signOut = withUser(async () => {
  const locale = await getLocale();
  try {
    const response = await fetch.post('api/auth/sign-out');
    setResponseCookies(response.headers);
    revalidateTag('user');
  } catch (err) {
    if (err instanceof HTTPError) {
      const { error } = await err.response.json<{ error: string }>();
      return { error };
    }
  }
  redirect({ href: REDIRECTS.signIn, locale });
});

export const resendVerificationEmail = withUser(async () => {
  try {
    await fetch.post('api/auth/verify-email');
    return { success: 'Email bol úspešne odoslaný' };
  } catch (err) {
    if (err instanceof HTTPError) {
      const { error } = await err.response.json<{ error: string }>();
      return { error };
    }
  }
});

export const verifyEmail = withUser(
  withI18nZod(verifyEmailSchema, async ({ code }) => {
    const locale = await getLocale();
    try {
      const response = await fetch.post(`api/auth/verify-email/${code}`);
      setResponseCookies(response.headers);
      revalidateTag('user');
    } catch (err) {
      if (err instanceof HTTPError) {
        const { error } = await err.response.json<{ error: string }>();
        return { error };
      }
    }
    redirect({ href: REDIRECTS.home, locale });
  }),
);

export const forgotPassword = withI18nZod(
  forgotPasswordSchema.omit({ redirectUrl: true }),
  async data => {
    try {
      const url = new URL('reset-password', env.NEXT_PUBLIC_BASE_URL);
      await fetch.post('api/auth/reset-password', {
        json: data,
        searchParams: { redirectUrl: url.toString() },
      });
      return { success: 'Email bol úspešne odoslaný' };
    } catch (err) {
      if (err instanceof HTTPError) {
        const { error } = await err.response.json<{ error: string }>();
        return { error };
      }
    }
  },
);

export const resetPassword = withI18nZod(
  confirmPassword(resetPasswordSchema),
  async data => {
    const locale = await getLocale();
    try {
      const { token, ...rest } = data;
      const response = await fetch.post(`api/auth/reset-password/${token}`, {
        json: rest,
      });
      setResponseCookies(response.headers);
      revalidateTag('user');
    } catch (err) {
      if (err instanceof HTTPError) {
        const { error } = await err.response.json<{ error: string }>();
        return { error };
      }
    }
    redirect({ href: REDIRECTS.home, locale });
  },
);
