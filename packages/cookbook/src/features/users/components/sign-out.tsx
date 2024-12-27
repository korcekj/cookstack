'use client';

import React from 'react';
import { signOut } from '@/features/users/actions';
import { useI18nForm } from '@/hooks/use-i18n-form';

export const SignOut: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [_, formAction] = useI18nForm(signOut);
  const formRef = React.useRef<HTMLFormElement>(null);

  return (
    <form ref={formRef} action={formAction} className="flex w-full flex-col">
      <div
        onClick={() => formRef.current?.requestSubmit()}
        className="cursor-pointer"
      >
        {children}
      </div>
    </form>
  );
};
