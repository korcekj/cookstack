'use client';

import React from 'react';
import { cn } from '@cs/ui/utils';
import { REDIRECTS } from '@/lib/constants';
import { useI18nForm } from '@/hooks/use-i18n-form';
import { forgotPasswordSchema } from '@cs/utils/zod';
import { forgotPassword } from '@/features/users/actions';

import {
  Input,
  Form,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
  SubmitButton,
} from '@cs/ui/components';
import { Link } from '@/i18n/routing';
import { RotateCcw } from 'lucide-react';

type Props = {
  className?: string | string[];
};

export const ForgotPassword: React.FC<Props> = ({ className }) => {
  const [email, setEmail] = React.useState('');
  const [form, formAction] = useI18nForm(
    forgotPasswordSchema.omit({ redirectUrl: true }),
    forgotPassword,
    {
      email: '',
    }
  );

  const onSubmit = (formData: FormData) => {
    setEmail(formData.get('email') as string);
    formAction(formData);
  };

  const onResubmit = (formData: FormData) => {
    formData.set('email', email);
    formAction(formData);
  };

  return (
    <div className={cn('space-y-6', className)}>
      <div className='grid gap-2 text-center'>
        <h1 className='text-3xl font-bold'>Zabudnuté heslo</h1>
        <p className='text-balance text-muted-foreground'>
          Použite svoj email na resetovanie hesla
        </p>
      </div>
      <div className='space-y-4'>
        <Form {...form}>
          <form className='space-y-4' action={onSubmit}>
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
            <div className='flex flex-col sm:flex-row gap-4'>
              <SubmitButton className='w-full'>Odoslať</SubmitButton>
              {email && (
                <SubmitButton
                  className='w-full'
                  variant='secondary'
                  formAction={onResubmit}
                >
                  <RotateCcw /> Znovu odoslať
                </SubmitButton>
              )}
            </div>
          </form>
        </Form>
        <div className='mt-4 text-center text-sm'>
          Ešte nemáte účet?{' '}
          <Link href={REDIRECTS.signUp} className='underline'>
            Registrácia
          </Link>
        </div>
      </div>
    </div>
  );
};
