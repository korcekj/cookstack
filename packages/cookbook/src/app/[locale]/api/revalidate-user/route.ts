import { redirect } from '@/i18n/routing';
import { revalidateTag } from 'next/cache';
import { REDIRECTS } from '@/lib/constants';
import { setResponseCookies } from '@/utils/cookies';

export const GET = async (request: Request) => {
  setResponseCookies(request.headers);
  revalidateTag('user');
  redirect(REDIRECTS.home);
};
