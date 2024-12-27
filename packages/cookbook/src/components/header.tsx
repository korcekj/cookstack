import React from 'react';

import {
  Sheet,
  Button,
  ThemeSwitch,
  SheetContent,
  SheetTrigger,
} from '@cs/ui/components';
import { Link } from '@/i18n/routing';
import { REDIRECTS } from '@/lib/constants';
import { Menu, CircleUser } from 'lucide-react';
import { SignedIn } from '@/components/signed-in';
import { SignedOut } from '@/components/signed-out';
import { User } from '@/features/users/components/user';
import { LocaleSwitch } from '@/components/locale-switch';

export const Header: React.FC = () => {
  return (
    <header className="bg-background sticky top-0 z-10 flex h-16 items-center gap-4 border-b px-4 md:px-6">
      <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
        <Link
          href="/"
          className="flex items-center text-lg font-semibold md:text-base"
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 91 104"
            xmlns="http://www.w3.org/2000/svg"
            className="fill-primary"
          >
            <path d="M89.5933 48.7911C85.3746 69.4164 67.1227 84.9296 45.2532 84.9296C23.3857 84.9296 5.14136 69.4164 0.915434 48.7911C0.320002 51.7393 0 54.7919 0 57.9131C0 82.9098 20.2607 103.168 45.2532 103.168C70.2481 103.168 90.5084 82.9098 90.5084 57.9131C90.5083 54.7919 90.196 51.7393 89.5933 48.7911Z" />
            <path d="M24.4568 11.8416C22.4184 13.1807 20.4987 14.7491 18.7056 16.5384C4.3973 30.8501 4.3973 54.0537 18.7056 68.3635C25.8633 75.5193 35.2382 79.0965 44.6208 79.0965C54.0014 79.0965 63.3801 75.5193 70.5345 68.3635C72.3238 66.576 73.8861 64.645 75.2255 62.6118C69.1318 66.6374 62.0967 68.65 55.0616 68.65C45.6848 68.65 36.3023 65.0747 29.1483 57.9188C16.6298 45.3984 15.0671 26.068 24.4568 11.8416Z" />
            <path d="M55.0098 0C38.3819 0.00190474 24.7582 13.3315 24.4756 30.0242C24.1856 46.8974 37.6193 60.8076 54.4963 61.0903C54.6784 61.0941 54.8571 61.0979 55.0395 61.0979C56.9592 61.0979 58.8415 60.9192 60.6571 60.5787C34.1968 29.1015 61.6914 0.732957 61.6914 0.732957C59.712 0.290288 57.6548 0.0388576 55.5455 0.00380937C55.3668 0.00190474 55.1881 0 55.0098 0Z" />
          </svg>

          <div className="text-primary text-3xl font-bold tracking-tight">
            <span>ook</span>
            <span className="text-foreground">ooB</span>
          </div>
        </Link>
        <Link
          href="/recipes"
          className="text-foreground hover:text-foreground transition-colors"
        >
          Recipes
        </Link>
        <Link
          href="/categories"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          Categories
        </Link>
      </nav>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle navigation menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/events"
              className="text-foreground hover:text-foreground transition-colors"
            >
              Podujatia
            </Link>
            <Link
              href="/movies"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Filmy
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <div className="ml-auto flex items-center gap-4">
        {/* <form className="ml-auto flex-1 sm:flex-initial">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search products..."
                className="pl-8 sm:w-[300px] md:w-[200px] lg:w-[300px]"
              />
            </div>
          </form> */}
        <LocaleSwitch></LocaleSwitch>
        <ThemeSwitch></ThemeSwitch>
        <SignedOut>
          <Button asChild>
            <Link href={REDIRECTS.signIn}>Prihlásiť</Link>
          </Button>
        </SignedOut>
        <SignedIn>
          <User></User>
        </SignedIn>
      </div>
    </header>
  );
};
