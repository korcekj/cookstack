import type { AbstractIntlMessages } from 'next-intl';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { NextIntlClientProvider } from 'next-intl';

type Props = React.PropsWithChildren & {
  messages: AbstractIntlMessages;
};

const Providers = ({ children, messages }: Props) => {
  return (
    <NextIntlClientProvider messages={messages}>
      <ThemeProvider
        attribute="class"
        defaultTheme="system"
        enableSystem
        disableTransitionOnChange
      >
        {children}
      </ThemeProvider>
    </NextIntlClientProvider>
  );
};

export default Providers;
