'use client';

import type { ButtonProps } from './button';

import React from 'react';
import { useFormStatus } from 'react-dom';

import { Loader2 } from 'lucide-react';
import { Button } from './button';

type Props = ButtonProps &
  React.PropsWithChildren & {
    icon?: React.ReactNode;
  };

export const SubmitButton: React.FC<Props> = ({ icon, children, ...rest }) => {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending} {...rest}>
      {!pending && icon}
      {pending && <Loader2 className="animate-spin" />}
      {children}
    </Button>
  );
};
