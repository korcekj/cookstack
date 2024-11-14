import type { Metadata } from 'next';

import React from 'react';

import { Image } from '@unpic/react';
import { ResetPassword } from '@/features/users/components/reset-password';

export const metadata: Metadata = {
  title: 'Reset hesla',
};

type Props = {
  params: {
    token: string;
  };
};

const Page = async ({ params: { token } }: Props) => {
  return (
    <main className="lg:grid lg:min-h-[600px] lg:grid-cols-2">
      <ResetPassword className="p-6 sm:p-12" token={token}></ResetPassword>
      <div className="bg-muted hidden lg:block">
        <Image
          priority
          src="https://res.cloudinary.com/rest-image-cloud/image/upload/cookstack/auth.jpg"
          alt="Reset hesla"
          width={1920}
          height={1080}
          className="h-full w-full dark:brightness-[0.5] dark:grayscale"
        />
      </div>
    </main>
  );
};

export default Page;
