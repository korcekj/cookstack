import type { Env } from '../types';

import { get } from '@cs/utils';
import { translation } from '../i18n';
import { DEFAULT_LOCALE } from '../constants';
import { createMiddleware } from 'hono/factory';
import { z, makeZodI18nMap } from '@cs/utils/zod';

export const i18n = createMiddleware<Env>(async (c, next) => {
  let locale = c.req.header('accept-language')?.split(',')[0];
  locale ??= DEFAULT_LOCALE;

  translation.locale(locale);

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

  console.log({ locale: c.get('i18n').locale() });

  return next();
});
