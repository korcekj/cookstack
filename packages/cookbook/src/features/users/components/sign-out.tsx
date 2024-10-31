'use client';

import React from 'react';
import { signOut } from '@/features/users/actions';
import { useI18nForm } from '@/hooks/use-i18n-form';

import { SubmitButton } from '@cs/ui/components';

export const SignOut: React.FC = () => {
  const [_, formAction] = useI18nForm(signOut);

  return (
    <form action={formAction}>
      <SubmitButton>Odhlásiť</SubmitButton>
    </form>
  );
};
