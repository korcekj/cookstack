import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { REDIRECTS } from '@/lib/constants';

export const runtime = 'edge';

export const GET = async () => {
  revalidateTag('user');
  redirect(REDIRECTS.home);
};
