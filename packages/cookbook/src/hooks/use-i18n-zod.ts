import React from 'react';
import { get } from '@cs/utils';
import { z, makeZodI18nMap } from '@cs/utils/zod';
import { useMessages, useTranslations } from 'next-intl';

export const useI18nZod = () => {
  const t = useTranslations();
  const messages = useMessages();
  const te = React.useCallback(
    (path: string) => (get(messages, path) ? true : false),
    [messages]
  );

  React.useEffect(() => {
    // @ts-expect-error
    z.setErrorMap(makeZodI18nMap(t, te));
  }, [t, te]);
};
