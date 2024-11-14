import ky from 'ky';
import React from 'react';
import { env } from '@/env';
import { useLocale } from 'next-intl';

export { HTTPError } from 'ky';

export const useFetch = () => {
  const locale = useLocale();
  const fetcher = React.useMemo(
    () =>
      ky.create({
        prefixUrl: env.NEXT_PUBLIC_SERVER_URL,
        credentials: 'include',
        hooks: {
          beforeRequest: [
            async request => {
              request.headers.set('Accept-Language', locale);
              request.headers.set('Origin', env.NEXT_PUBLIC_BASE_URL);
            },
          ],
        },
      }),
    [locale],
  );

  return fetcher;
};
