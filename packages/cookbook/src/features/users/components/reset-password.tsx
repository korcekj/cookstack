'use client';

import React from 'react';
import { cn } from '@cs/ui/utils';
import { REDIRECTS } from '@/lib/constants';
import { useI18nForm } from '@/hooks/use-i18n-form';
import { resetPassword } from '@/features/users/actions';
import { confirmPassword, resetPasswordSchema } from '@cs/utils/zod';

import {
  Form,
  Input,
  FormItem,
  Password,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
  SubmitButton,
} from '@cs/ui/components';
import { Link } from '@/i18n/routing';

type Props = {
  token: string;
  className?: string | string[];
};

export const ResetPassword: React.FC<Props> = ({ token, className }) => {
  const [form, formAction] = useI18nForm(
    resetPassword,
    confirmPassword(resetPasswordSchema),
    {
      token,
      password: '',
      passwordConfirm: '',
    },
  );

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Resetovanie hesla</h1>
        <p className="text-muted-foreground text-balance">
          Zadajte svoje nové heslo pre dokončenie akcie
        </p>
      </div>
      <div className="space-y-4">
        <Form {...form}>
          <form className="space-y-4" action={formAction}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Password autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo znovu</FormLabel>
                  <FormControl>
                    <Password autoComplete="new-password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="token"
              render={({ field }) => (
                <FormItem className="hidden">
                  <FormControl>
                    <Input type="hidden" {...field} />
                  </FormControl>
                </FormItem>
              )}
            />
            <SubmitButton className="w-full">Resetovať</SubmitButton>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          Ešte nemáte účet?{' '}
          <Link href={REDIRECTS.signUp} className="underline">
            Registrácia
          </Link>
        </div>
      </div>
    </div>
  );
};
