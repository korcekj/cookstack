'use client';

import type { ButtonProps } from './button';

import React from 'react';
import { useFormStatus } from 'react-dom';

import { Loader2 } from 'lucide-react';
import { Button } from './button';

type Props = ButtonProps & React.PropsWithChildren;

export const SubmitButton: React.FC<Props> = ({ children, ...rest }) => {
  const { pending } = useFormStatus();

  return (
    <Button type='submit' disabled={pending} {...rest}>
      {pending && <Loader2 className='mr-2 size-4 animate-spin' />}
      {children}
    </Button>
  );
};
