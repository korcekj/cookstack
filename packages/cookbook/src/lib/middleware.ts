import type {
  ActionFunction,
  ActionResponse,
  ActionFunctionWithUser,
} from '@/types';

import { get } from '@cs/utils';
import { redirect } from '@/i18n/routing';
import { formDataEntries } from '@cs/utils';
import { REDIRECTS } from '@/lib/constants';
import { getUser } from '@/features/users/api';
import { z, makeZodI18nMap, parseError } from '@cs/utils/zod';

import { getTranslations, getMessages, getLocale } from 'next-intl/server';

export const withI18nZod = <
  S extends z.ZodType<any, any>,
  T extends ActionResponse<S>
>(
  schema: S,
  action: ActionFunction<S, T>
) => {
  return async (_: any, formData: FormData): Promise<ActionResponse<S>> => {
    const t = await getTranslations();
    const messages = await getMessages();
    const te = (path: string) => (get(messages, path) ? true : false);
    // @ts-expect-error
    z.setErrorMap(makeZodI18nMap(t, te));

    const obj = Object.fromEntries(formData.entries());
    const parsed = schema.safeParse(obj);
    const { password, ...entries } = obj;
    if (!parsed.success) {
      return {
        fields: formDataEntries(entries),
        fieldErrors: parseError(parsed.error),
      };
    }
    return action(parsed.data, entries);
  };
};

export const withUser = (action: ActionFunctionWithUser) => {
  return async (
    prevState: any,
    formData: FormData
  ): Promise<ActionResponse<any>> => {
    const user = await getUser();
    const locale = await getLocale();
    if (user) return action(prevState, formData, user);
    redirect({ href: REDIRECTS.signIn, locale });
  };
};
