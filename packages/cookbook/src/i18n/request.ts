import { locales } from './routing';
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  if (!locales.includes(locale)) notFound();

  return {
    messages: (await import(`../lib/messages/${locale}.ts`)).default,
  };
});
