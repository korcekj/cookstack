'use client';

import React from 'react';
import { cn } from '@cs/ui/utils';
import { verifyEmailSchema } from '@cs/utils/zod';
import { useI18nForm } from '@/hooks/use-i18n-form';
import { verifyEmail, resendVerificationEmail } from '@/features/users/actions';

import {
  Form,
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  FormItem,
  FormLabel,
  FormField,
  FormControl,
  FormMessage,
  SubmitButton,
} from '@cs/ui/components';
import { RotateCcw } from 'lucide-react';

type Props = {
  className?: string | string[];
};

export const VerifyEmail: React.FC<Props> = ({ className }) => {
  const [_, resendAction] = useI18nForm(resendVerificationEmail);
  const [form, verifyAction] = useI18nForm(verifyEmail, verifyEmailSchema, {
    code: '',
  });

  return (
    <div className={cn('space-y-6', className)}>
      <div className='grid gap-2 text-center'>
        <h1 className='text-3xl font-bold'>Overenie emailu</h1>
        <p className='text-balance text-muted-foreground'>
          Zadajte overovací kód odoslaný na váš email
        </p>
      </div>
      <div className='space-y-4'>
        <Form {...form}>
          <form
            className='flex flex-col items-center space-y-4'
            action={verifyAction}
          >
            <FormField
              control={form.control}
              name='code'
              render={({ field }) => (
                <FormItem className='w-full'>
                  <FormLabel>Overovací kód</FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <SubmitButton className='w-full'>Overiť</SubmitButton>
          </form>
        </Form>
        <form action={resendAction}>
          <SubmitButton variant='secondary' className='w-full'>
            <RotateCcw /> Znovu odoslať
          </SubmitButton>
        </form>
      </div>
    </div>
  );
};
