import React from 'react';
import { getUserCached } from '@/features/users/api';

export const SignedIn: React.FC<React.PropsWithChildren> = async ({
  children,
}) => {
  const user = await getUserCached();

  return user ? <>{children}</> : null;
};
