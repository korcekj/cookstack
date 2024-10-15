import type { Options } from 'ky';

import ky from 'ky';
import { env } from '@/env';
import { useLocale } from 'next-intl';
import { objectEntries } from '@cs/utils';
import { getLocale } from 'next-intl/server';
import { getAuthCookie } from '@/utils/cookies';

export { HTTPError } from 'ky';

export const fetcher = ky.create({
  prefixUrl: env.NEXT_PUBLIC_SERVER_URL,
  credentials: 'include',
});

export const fetchCustom = (options: Options = {}) => fetcher.extend(options);

export const fetch = fetcher.extend({
  hooks: {
    beforeRequest: [
      async (request) => {
        const headers: Record<string, string> = {};
        if (typeof window !== 'undefined') {
          headers['Accept-Language'] = useLocale();
        } else {
          headers['Cookie'] = getAuthCookie();
          headers['Accept-Language'] = await getLocale();
        }
        objectEntries(headers).forEach(([key, value]) => {
          request.headers.set(key, value);
        });
      },
    ],
  },
});

export default ky;
