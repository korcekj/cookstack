import type { Metadata } from 'next';

import '@cs/ui/globals.css';

import React from 'react';
import { Rubik } from 'next/font/google';
import { routing } from '@/i18n/routing';
import { notFound } from 'next/navigation';
import { getMessages } from 'next-intl/server';

import Providers from '@/app/providers';
import { Toaster } from '@cs/ui/components';
import { Header } from '@/components/header';

const rubik = Rubik({ subsets: ['latin'], variable: '--font-rubik' });

export const metadata: Metadata = {
  title: {
    template: '%s | CookBook',
    default: 'CookBook',
  },
};

type Props = React.PropsWithChildren & {
  params: { locale: string };
};

const Layout = async ({ children, params: { locale } }: Props) => {
  if (!routing.locales.includes(locale)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <html lang={locale} className={rubik.variable} suppressHydrationWarning>
      <body>
        <Providers messages={messages}>
          <Toaster position="top-center" richColors closeButton></Toaster>
          <Header></Header>
          {children}
        </Providers>
      </body>
    </html>
  );
};

export default Layout;
