import type { Context } from 'hono';
import type { Env } from '../types';

import {
  useTranslation,
  defineI18nMiddleware,
  detectLocaleFromAcceptLanguageHeader,
} from '@intlify/hono';
import { get } from 'lodash';
import { createMiddleware } from 'hono/factory';
import { z, makeZodI18nMap } from '@cs/utils/zod';
import { DEFAULT_LOCALE, LOCALES } from '../utils/constants';

import en from '../locales/en';
import sk from '../locales/sk';

type ResourceSchema = typeof en;
declare module '@intlify/hono' {
  export interface DefineLocaleMessage extends ResourceSchema {}
}

export const i18n = defineI18nMiddleware({
  locale: (ctx: Context) => {
    const locale = detectLocaleFromAcceptLanguageHeader(ctx);
    if (!LOCALES.includes(locale)) return DEFAULT_LOCALE;
    return locale;
  },
  messages: {
    en,
    sk,
  },
});

export const i18nZod = createMiddleware<Env>(async (c, next) => {
  const t = useTranslation(c);
  const { messages } = c.get('i18n');

  const te = (path: string) => {
    return Object.keys(messages).every((key) =>
      get(messages, `${key}.${path}`)
    );
  };

  z.setErrorMap(makeZodI18nMap(t, te));
  return next();
});
