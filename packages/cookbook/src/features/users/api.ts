import { unstable_cache } from 'next/cache';
import { getLocale } from 'next-intl/server';
import { getAuthCookie } from '@/utils/cookies';
import { fetch, fetcher, HTTPError } from '@/utils/fetch';

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
    async () => {
      try {
        return await fetcher.extend({ headers })('api/user/profile').json();
      } catch (err) {
        if (!(err instanceof HTTPError)) console.error(err);
        return null;
      }
    },
    ['user', locale],
    {
      tags: ['user'],
      revalidate: 3600,
    }
  )();
};
