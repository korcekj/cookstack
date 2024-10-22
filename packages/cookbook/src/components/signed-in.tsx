import React from 'react';
import { getUser } from '@/features/users/api';

export const SignedIn: React.FC<React.PropsWithChildren> = async ({
  children,
}) => {
  const user = await getUser();

  return user ? <>{children}</> : null;
};
