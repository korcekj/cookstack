import React from 'react';
import { getUserCached } from '@/features/users/api';

import {
  Button,
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuSeparator,
} from '@cs/ui/components';
import { Link } from '@/i18n/routing';
import { Image } from '@unpic/react/nextjs';
import { CircleUser, LogOut, Settings } from 'lucide-react';
import { SignOut } from '@/features/users/components/sign-out';

export const User: React.FC = async () => {
  const user = await getUserCached();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="icon">
          {user!.imageUrl ? (
            <Image
              src={user!.imageUrl}
              alt="User"
              className="select-none rounded-md"
            />
          ) : (
            <CircleUser className="h-5 w-5" />
          )}
          <span className="sr-only">Toggle user menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>My Account</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <Link href="/user/settings" className="w-full">
            <div className="flex items-center gap-2">
              <Settings />
              Settings
            </div>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem>
          <SignOut>
            <div className="flex items-center gap-2">
              <LogOut />
              Logout
            </div>
          </SignOut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
