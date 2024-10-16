import type { CookieOptions } from '@/types';

import { env } from '@/env';
import { cookies } from 'next/headers';
import { parse } from 'set-cookie-parser';

export const setResponseCookies = (response: Response) => {
  const parsedCookies = parse(response.headers.get('set-cookie') ?? '');
  const nextCookies = cookies();
  parsedCookies.forEach(({ name, value, ...options }) => {
    nextCookies.set(name, value, options as CookieOptions);
  });
};

export const getAuthCookie = () => {
  const name = env.NEXT_PUBLIC_COOKIE_NAME;
  const value = cookies().get(name)?.value ?? '';
  return `${name}=${value}`;
};
