'use server';

import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { formDataEntries } from '@cs/utils';
import { fetch, HTTPError } from '@/utils/fetch';
import { setResponseCookies } from '@/utils/cookies';
import { withI18nZod, withUser } from '@/lib/middleware';
import { signInSchema, signUpSchema } from '@cs/utils/zod';

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
