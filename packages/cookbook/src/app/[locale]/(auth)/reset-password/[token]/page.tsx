import type { Metadata } from 'next';

import React from 'react';

import { Image } from '@unpic/react';
import { ResetPassword } from '@/features/users/components/reset-password';

export const metadata: Metadata = {
  title: 'Zabudnuté heslo',
};

type Props = {
  params: {
    token: string;
  };
};

const Page = async ({ params: { token } }: Props) => {
  return (
    <main className='lg:grid lg:grid-cols-2 lg:min-h-[600px]'>
      <ResetPassword className='p-6 sm:p-12' token={token}></ResetPassword>
      <div className='hidden bg-muted lg:block'>
        <Image
          priority
          src='https://res.cloudinary.com/rest-image-cloud/image/upload/cookstack/auth.jpg'
          alt='Prihlásenie'
          width={1920}
          height={1080}
          className='h-full w-full dark:brightness-[0.5] dark:grayscale'
        />
      </div>
    </main>
  );
};

export default Page;
