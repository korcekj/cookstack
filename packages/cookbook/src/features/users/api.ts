import type { Options } from '@/utils/fetch';

import { unstable_cache } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { getAuthCookie } from '@/utils/cookies';
import { fetch, fetcher, HTTPError } from '@/utils/fetch';

export const fetchUser = async (
  options: Options & { cookie?: boolean } = { cookie: true }
) => {
  try {
    let headers = options.headers;
    if (options.cookie) {
      const cookie = getAuthCookie();
      headers = { ...headers, Cookie: cookie };
    }
    console.log('Fetching user');
    return await fetcher('api/user/profile', {
      ...options,
      headers,
    }).json();
  } catch (err) {
    if (!(err instanceof HTTPError)) console.error(err);
    return null;
  }
};

export const getUser = async () => {
  try {
    return await fetch('api/user/profile').json();
  } catch (err) {
    if (!(err instanceof HTTPError)) console.error(err);
    return null;
  }
};

export const getUserCached = async () => {
  const cookie = getAuthCookie();
  const locale = await getLocale();
  const headers = {
    Cookie: cookie,
    'Accept-Language': locale,
  };

  return unstable_cache(
    () => fetchUser({ headers, cookie: false }),
    ['user', locale],
    {
      tags: ['user'],
      revalidate: 3600,
    }
  )();
};
