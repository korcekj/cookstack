import React from 'react';

import {
  Sheet,
  Button,
  ThemeSwitch,
  SheetContent,
  SheetTrigger,
} from '@cs/ui/components';
import { Menu } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { SignedIn } from '@/components/signed-in';
import { SignedOut } from '@/components/signed-out';
import { SignOut } from '@/features/users/components/sign-out';

export const Header: React.FC = () => {
  return (
    <header className='sticky top-0 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6'>
      <nav className='hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6'>
        <Link
          href='/'
          className='flex items-center gap-2 text-lg font-semibold md:text-base'
        >
          {/* <Package2 className="h-6 w-6" /> */}
          Logo
        </Link>
        <Link
          href='/recipes'
          className='text-foreground transition-colors hover:text-foreground'
        >
          Recipes
        </Link>
        <Link
          href='/categories'
          className='text-muted-foreground transition-colors hover:text-foreground'
        >
          Categories
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='outline' size='icon' className='shrink-0 md:hidden'>
            <Menu className='h-5 w-5' />
            <span className='sr-only'>Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='left'>
          <nav className='grid gap-6 text-lg font-medium'>
            <Link
              href='/events'
              className='text-foreground transition-colors hover:text-foreground'
            >
              Podujatia
            </Link>
            <Link
              href='/movies'
              className='text-muted-foreground transition-colors hover:text-foreground'
            >
              Filmy
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className='flex items-center gap-4 ml-auto'>
        {/* <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <CircleUser className="h-5 w-5" />
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuItem>Support</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu> */}
        <ThemeSwitch></ThemeSwitch>
        <SignedOut>
          <Button asChild>
            <Link href='/sign-in'>Prihlásiť</Link>
          </Button>
        </SignedOut>
        <SignedIn>
          <SignOut></SignOut>
        </SignedIn>
      </div>
    </header>
  );
};
