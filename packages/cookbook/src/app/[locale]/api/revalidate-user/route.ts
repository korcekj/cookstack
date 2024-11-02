import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { REDIRECTS } from '@/lib/constants';

export const runtime = 'edge';

export const GET = async () => {
  console.log('Revalidating user', Date.now());
  revalidateTag('user');
  console.log('Redirecting user', Date.now());
  redirect(REDIRECTS.home);
};
