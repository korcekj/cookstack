import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { REDIRECTS } from '@/lib/constants';

export const revalidate = 0;

export const GET = async () => {
  console.log('Revalidating user');
  revalidateTag('user');
  console.log('Redirecting user');
  redirect(REDIRECTS.home);
};
