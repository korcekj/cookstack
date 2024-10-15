import { LOCALES } from '@/lib/constants';
import { notFound } from 'next/navigation';
import { getRequestConfig } from 'next-intl/server';

export default getRequestConfig(async ({ locale }) => {
  if (!LOCALES.includes(locale)) notFound();

  return {
    messages: (await import(`./messages/${locale}.ts`)).default,
  };
});
