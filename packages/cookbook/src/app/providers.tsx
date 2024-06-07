'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';

const Providers = ({ children }: React.PropsWithChildren) => {
  return (
    <ThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  );
};

export default Providers;
