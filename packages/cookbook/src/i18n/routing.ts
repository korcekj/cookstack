import { LOCALES, LOCALE_PREFIX } from '@/lib/constants';
import { createSharedPathnamesNavigation } from 'next-intl/navigation';

export const { Link, redirect, usePathname, useRouter } =
  createSharedPathnamesNavigation({
    locales: LOCALES,
    localePrefix: LOCALE_PREFIX,
  });
