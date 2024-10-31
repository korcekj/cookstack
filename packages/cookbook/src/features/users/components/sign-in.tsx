'use client';

import React from 'react';
import { env } from '@/env';
import { cn } from '@cs/ui/utils';
import { REDIRECTS } from '@/lib/constants';
import { signInSchema } from '@cs/utils/zod';
import { signIn } from '@/features/users/actions';
import { useI18nForm } from '@/hooks/use-i18n-form';

import {
  Input,
  Button,
  SubmitButton,
  Password,
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
} from '@cs/ui/components';
import { Link } from '@/i18n/routing';

type Props = {
  className?: string | string[];
};

export const SignInForm: React.FC<Props> = ({ className }) => {
  const [form, formAction] = useI18nForm(signInSchema, signIn, {
    email: '',
    password: '',
  });

  return (
    <div className={cn('space-y-6', className)}>
      <div className='grid gap-2 text-center'>
        <h1 className='text-3xl font-bold'>Prihlásenie</h1>
        <p className='text-balance text-muted-foreground'>
          Použite email na prihlásenie do svojho účtu
        </p>
      </div>
      <div className='space-y-4'>
        <Form {...form}>
          <form className='space-y-4' action={formAction}>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete='email'
                      placeholder='vas@email.com'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <div className='flex items-center'>
                    <FormLabel>Heslo</FormLabel>
                    <Link
                      href={REDIRECTS.resetPassword}
                      className='ml-auto text-sm underline'
                      tabIndex={-1}
                    >
                      Zabudnuté heslo?
                    </Link>
                  </div>
                  <FormControl>
                    <Password autoComplete='current-password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton className='w-full'>Prihlásiť</SubmitButton>
          </form>
        </Form>
        <Button variant='outline' className='w-full' asChild>
          <Link
            href={`${env.NEXT_PUBLIC_SERVER_URL}/api/auth/sign-in/google?redirectUrl=${env.NEXT_PUBLIC_BASE_URL}`}
          >
            Prihlásenie s Google
          </Link>
        </Button>
      </div>
      <div className='mt-4 text-center text-sm'>
        Ešte nemáte účet?{' '}
        <Link href={REDIRECTS.signUp} className='underline'>
          Registrácia
        </Link>
      </div>
    </div>
  );
};
