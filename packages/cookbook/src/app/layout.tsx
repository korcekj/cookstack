import type { Metadata } from 'next';

import './globals.css';
import React from 'react';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    template: '%s | CookBook',
    default: 'CookBook',
  },
};

const Layout = ({ children }: React.PropsWithChildren) => {
  return (
    <html lang='en' suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
};

export default Layout;
