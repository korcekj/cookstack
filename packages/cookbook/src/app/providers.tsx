'use client';

import type { AbstractIntlMessages } from 'next-intl';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';

type Props = React.PropsWithChildren & {
  locale: string;
  messages: AbstractIntlMessages;
};

const Providers = ({ children, locale, messages }: Props) => {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
};

export default Providers;
