import type { Env } from '../types';

import { z } from 'zod';
import { get } from '@cs/utils';
import { createMiddleware } from 'hono/factory';
import { makeZodI18nMap } from '@cs/utils/zod';
import { translation, DEFAULT_LOCALE } from '../i18n';

export const i18n = createMiddleware<Env>(async (c, next) => {
  const sentry = c.get('sentry');

  let locale = c.req.header('accept-language')?.split('-')[0];
  locale ??= DEFAULT_LOCALE;

  translation.locale(locale);
  sentry.setTag('locale', locale);

  const messages = translation.table(locale);

  const t = translation.t;
  const te = (path: string) => {
    return Object.keys(translation.table).every(key =>
      // @ts-ignore
      get(messages, `${key}.${path}`),
    );
  };

  z.setErrorMap(makeZodI18nMap(t, te));

  c.set('i18n', translation);

  return next();
});
