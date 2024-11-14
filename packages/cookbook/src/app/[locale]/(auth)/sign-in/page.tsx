import type { Metadata } from 'next';

import React from 'react';

import { Image } from '@unpic/react';
import { SignInForm } from '@/features/users/components/sign-in';

export const metadata: Metadata = {
  title: 'Prihlásenie',
};

const Page = async () => {
  return (
    <main className="lg:grid lg:min-h-[600px] lg:grid-cols-2">
      <SignInForm className="p-6 sm:p-12"></SignInForm>
      <div className="bg-muted hidden lg:block">
        <Image
          priority
          src="https://res.cloudinary.com/rest-image-cloud/image/upload/cookstack/auth.jpg"
          alt="Prihlásenie"
          width={1920}
          height={1080}
          className="h-full w-full dark:brightness-[0.5] dark:grayscale"
        />
      </div>
    </main>
  );
};

export default Page;
