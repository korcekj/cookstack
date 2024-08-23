import createMiddleware from 'next-intl/middleware';
import { locales, localePrefix, defaultLocale } from '@/navigation';

export default createMiddleware({
  locales,
  localePrefix,
  defaultLocale,
});

export const config = {
  // https://next-intl-docs.vercel.app/docs/routing/middleware#matcher-no-prefix
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)',
  ],
};
