export type { Options } from 'ky';

import ky from 'ky';
import { env } from '@/env';
import { getLocale } from 'next-intl/server';
import { getAuthCookie } from '@/utils/cookies';

export { HTTPError } from 'ky';

export const fetcher = ky.create({
  prefixUrl: env.NEXT_PUBLIC_SERVER_URL,
  credentials: 'include',
});

export const fetch = fetcher.extend({
  hooks: {
    beforeRequest: [
      async request => {
        request.headers.set('Cookie', getAuthCookie());
        request.headers.set('Origin', env.NEXT_PUBLIC_BASE_URL);
        request.headers.set('Accept-Language', await getLocale());
      },
    ],
  },
});

export default ky;
