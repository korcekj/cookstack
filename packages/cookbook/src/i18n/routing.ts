import { defineRouting } from 'next-intl/routing';
import { createNavigation } from 'next-intl/navigation';
import { LOCALES, LOCALE_PREFIX, DEFAULT_LOCALE } from '@/lib/constants';

export const routing = defineRouting({
  locales: LOCALES,
  localePrefix: LOCALE_PREFIX,
  defaultLocale: DEFAULT_LOCALE,
});

export const { Link, redirect, usePathname, useRouter } =
  createNavigation(routing);
