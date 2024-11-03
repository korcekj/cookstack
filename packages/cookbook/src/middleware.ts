import type { NextRequest } from 'next/server';

import { routing } from '@/i18n/routing';
import { NextResponse } from 'next/server';
import { fetchUser } from '@/features/users/api';
import createMiddleware from 'next-intl/middleware';
import { LOCALES, REDIRECTS, PRIVATE_ROUTES } from '@/lib/constants';

const handleI18nRouting = createMiddleware(routing);

const middleware = async (request: NextRequest) => {
  const { pathname } = request.nextUrl;
  const isPrivate = RegExp(
    `^(/(${LOCALES.join('|')}))?(${PRIVATE_ROUTES.flatMap((p) =>
      p === '/' ? ['', '/'] : p
    ).join('|')})/?$`,
    'i'
  );

  if (isPrivate.test(pathname)) {
    const user = await fetchUser();
    if (!user) {
      return NextResponse.redirect(new URL(REDIRECTS.signIn, request.url));
    }
  }

  return handleI18nRouting(request);
};

export default middleware;

export const config = {
  // https://next-intl-docs.vercel.app/docs/routing/middleware#matcher-no-prefix
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/_next`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!_next|.*\\..*).*)',
  ],
};
