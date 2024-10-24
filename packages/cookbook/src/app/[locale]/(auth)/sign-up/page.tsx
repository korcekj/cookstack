import type { Metadata } from 'next';

import React from 'react';

import { Image } from '@unpic/react';
import { SignUpForm } from '@/features/users/components/sign-up';

export const metadata: Metadata = {
  title: 'Registrácia',
};

const Page = async () => {
  return (
    <main className='lg:grid lg:grid-cols-2 lg:min-h-[600px]'>
      <SignUpForm className='p-6 sm:p-12'></SignUpForm>
      <div className='hidden bg-muted lg:block'>
        <Image
          priority
          src='https://res.cloudinary.com/rest-image-cloud/image/upload/cookstack/auth.jpg'
          alt='Registrácia'
          width={1920}
          height={1080}
          className='h-full w-full dark:brightness-[0.5] dark:grayscale'
        />
      </div>
    </main>
  );
};

export default Page;
