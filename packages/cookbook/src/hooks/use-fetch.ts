import ky from 'ky';
import React from 'react';
import { env } from '@/env';
import { useLocale } from 'next-intl';

export const useFetch = () => {
  const locale = useLocale();
  const fetcher = React.useMemo(
    () =>
      ky.create({
        prefixUrl: env.NEXT_PUBLIC_SERVER_URL,
        credentials: 'include',
        hooks: {
          beforeRequest: [
            async (request) => {
              request.headers.set('Accept-Language', locale);
            },
          ],
        },
      }),
    [locale]
  );

  return fetcher;
};
