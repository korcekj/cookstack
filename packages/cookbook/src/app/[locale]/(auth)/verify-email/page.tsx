import type { Metadata } from 'next';

import React from 'react';
import { redirect } from '@/i18n/routing';
import { REDIRECTS } from '@/lib/constants';
import { getLocale } from 'next-intl/server';
import { getUserCached } from '@/features/users/api';

import { Image } from '@unpic/react/nextjs';
import AuthImage from '@/../public/auth.jpeg';
import { VerifyEmail } from '@/features/users/components/verify-email';

export const metadata: Metadata = {
  title: 'Overenie emailu',
};

const Page = async () => {
  const locale = await getLocale();
  const user = await getUserCached();
  if (user!.emailVerified) redirect({ href: REDIRECTS.home, locale });

  return (
    <main className="lg:grid lg:min-h-[600px] lg:grid-cols-2">
      <VerifyEmail className="p-6 sm:p-12"></VerifyEmail>
      <div className="bg-muted hidden lg:block">
        <Image
          priority
          src={AuthImage}
          alt="Overenie emailu"
          width={1920}
          height={1080}
          className="h-full w-full grayscale"
        />
      </div>
    </main>
  );
};

export default Page;
