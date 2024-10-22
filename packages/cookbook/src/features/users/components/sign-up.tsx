'use client';

import React from 'react';
import { env } from '@/env';
import { cn } from '@cs/ui/utils';
import { signUpSchema } from '@cs/utils/zod';
import { signUp } from '@/features/users/actions';
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

export const SignUpForm: React.FC<Props> = ({ className }) => {
  const [form, formAction] = useI18nForm(signUpSchema, signUp, {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    passwordConfirm: '',
  });

  return (
    <div className={cn('space-y-6', className)}>
      <div className='grid gap-2 text-center'>
        <h1 className='text-3xl font-bold'>Registrácia</h1>
        <p className='text-balance text-muted-foreground'>
          Zadajte vaše údaje pre vytvorenie účtu
        </p>
      </div>
      <div className='space-y-4'>
        <Form {...form}>
          <form className='space-y-4' action={formAction}>
            <div className='flex space-x-4'>
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Meno</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete='given-name'
                        placeholder='Meno'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem className='w-full'>
                    <FormLabel>Priezvisko</FormLabel>
                    <FormControl>
                      <Input
                        autoComplete='family-name'
                        placeholder='Priezvisko'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
                  <FormLabel>Heslo</FormLabel>
                  <FormControl>
                    <Password autoComplete='new-password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='passwordConfirm'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Heslo znovu</FormLabel>
                  <FormControl>
                    <Password autoComplete='new-password' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton className='w-full'>Registrovať</SubmitButton>
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
        Už ste registrovaný?{' '}
        <Link href='/sign-in' className='underline'>
          Prihlásenie
        </Link>
      </div>
    </div>
  );
};
