import type { User } from '@cs/utils/zod';
import type { Options } from '@/utils/fetch';

import { unstable_cache } from 'next/cache';
import { getAuthCookie } from '@/utils/cookies';
import { fetcher, HTTPError } from '@/utils/fetch';

export const fetchUser = async (
  options: Options & { cookie?: boolean } = { cookie: true },
) => {
  try {
    let headers = options.headers;
    if (options.cookie) {
      const cookie = getAuthCookie();
      headers = { ...headers, Cookie: cookie };
    }
    return await fetcher<User>('api/user/profile', {
      ...options,
      headers,
    }).json();
  } catch (err) {
    if (!(err instanceof HTTPError)) console.error(err);
    return null;
  }
};

export const getUser = fetchUser;

export const getUserCached = async () => {
  const cookie = getAuthCookie();
  return unstable_cache(
    (cookie?: string) => fetchUser({ headers: { Cookie: cookie } }),
    ['user'],
    {
      tags: ['user'],
      revalidate: 60 * 10, // 10 minutes,
    },
  )(cookie);
};
