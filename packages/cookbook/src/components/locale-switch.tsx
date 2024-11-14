'use client';

import React from 'react';
import { LOCALES } from '@/lib/constants';
import { usePathname } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';

import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@cs/ui/components';
import { Link } from '@/i18n/routing';
import { Languages } from 'lucide-react';

export const LocaleSwitch: React.FC = () => {
  const t = useTranslations('LocaleSwitch');
  const pathname = usePathname();
  const currentLocale = useLocale();
  const search = useSearchParams().toString();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Languages />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {LOCALES.map(locale => (
          <DropdownMenuItem
            asChild
            key={locale}
            disabled={locale === currentLocale}
          >
            <Link href={{ pathname, search }} locale={locale}>
              {t('locale', { locale })}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
