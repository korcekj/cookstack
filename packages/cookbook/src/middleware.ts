import createMiddleware from 'next-intl/middleware';
import { locales, localePrefix, defaultLocale } from '@/navigation';

export default createMiddleware({
  locales,
  localePrefix,
  defaultLocale,
});

export const config = {
  matcher: ['/', `/(sk|en)/:path*`],
};
