'use client';

import React from 'react';
import { toast } from 'sonner';
import { useFormState } from 'react-dom';
import { signOut } from '@/features/users/actions';

import { SubmitButton } from '@cs/ui/components';

export const SignOut: React.FC = () => {
  const [state, formAction] = useFormState(signOut, null);

  React.useEffect(() => {
    if (state?.error) toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <SubmitButton>Odhlásiť</SubmitButton>
    </form>
  );
};
