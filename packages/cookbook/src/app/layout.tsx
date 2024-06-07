import type { Metadata } from 'next';

import '@cs/ui/globals.css';

import React from 'react';
import { Rubik } from 'next/font/google';

import Providers from './providers';
import { Toaster } from '@cs/ui/components';
import { Header } from '@/components/header';

const rubik = Rubik({ subsets: ['latin'], variable: '--font-rubik' });

export const metadata: Metadata = {
  title: {
    template: '%s | CookBook',
    default: 'CookBook',
  },
};

const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <html lang='en' className={rubik.variable} suppressHydrationWarning>
      <body>
        <Providers>
          <Toaster position='top-center' richColors closeButton></Toaster>
          <Header></Header>
          {children}
        </Providers>
      </body>
    </html>
  );
};

export default Layout;
