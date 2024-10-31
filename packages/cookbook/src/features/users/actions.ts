'use server';

import {
  signInSchema,
  signUpSchema,
  resetPasswordSchema,
  forgotPasswordSchema,
} from '@cs/utils/zod';
import { env } from '@/env';
import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { formDataEntries } from '@cs/utils';
import { fetch, HTTPError } from '@/utils/fetch';
import { setResponseCookies } from '@/utils/cookies';
import { withI18nZod, withUser } from '@/lib/middleware';

export const signIn = withI18nZod(signInSchema, async (data) => {
  try {
    const response = await fetch.post('api/auth/sign-in', { json: data });
    setResponseCookies(response);
    revalidateTag('user');
  } catch (err) {
    if (err instanceof HTTPError) {
      const { error } = await err.response.json<{ error: string }>();
      return { error };
    }
  }
  redirect('/');
});

export const signUp = withI18nZod(signUpSchema, async (data, entries) => {
  try {
    const response = await fetch.post('api/auth/sign-up', { json: data });
    setResponseCookies(response);
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
  redirect('/');
});

export const signOut = withUser(async () => {
  try {
    const response = await fetch.post('api/auth/sign-out');
    setResponseCookies(response);
    revalidateTag('user');
  } catch (err) {
    if (err instanceof HTTPError) {
      const { error } = await err.response.json<{ error: string }>();
      return { error };
    }
  }
  redirect('/');
});

export const forgotPassword = withI18nZod(
  forgotPasswordSchema.omit({ redirectUrl: true }),
  async (data) => {
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
  }
);

export const resetPassword = withI18nZod(resetPasswordSchema, async (data) => {
  try {
    const { token, ...rest } = data;
    const response = await fetch.post(`api/auth/reset-password/${token}`, {
      json: rest,
    });
    setResponseCookies(response);
    revalidateTag('user');
  } catch (err) {
    if (err instanceof HTTPError) {
      const { error } = await err.response.json<{ error: string }>();
      return { error };
    }
  }
  redirect('/');
});
