import React from 'react';
import { get } from '@cs/utils';
import { makeZodI18nMap } from '@cs/utils/zod';
import { useMessages, useTranslations } from 'next-intl';

export const useI18nZod = (
  cb: (map: ReturnType<typeof makeZodI18nMap>) => void,
) => {
  const t = useTranslations();
  const messages = useMessages();
  const te = React.useCallback(
    (path: string) => !!get(messages, path),
    [messages],
  );

  React.useEffect(() => {
    // @ts-expect-error
    cb(makeZodI18nMap(t, te));
  }, [cb, t, te]);
};
