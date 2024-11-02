import { env } from '@/env';
import { cookies } from 'next/headers';
import { parse } from 'set-cookie-parser';

type CookieOptions = {
  path?: string;
  expires?: Date;
  maxAge?: number;
  domain?: string;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'strict' | 'lax' | 'none';
};

export const setResponseCookies = (headers: Headers) => {
  const parsedCookies = parse(headers.get('set-cookie') ?? '');
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
