import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { REDIRECTS } from '@/lib/constants';
import { getLocale } from 'next-intl/server';

export const runtime = 'edge';

export const GET = async () => {
  const locale = await getLocale();
  revalidateTag('user');
  redirect({ href: REDIRECTS.home, locale });
};
