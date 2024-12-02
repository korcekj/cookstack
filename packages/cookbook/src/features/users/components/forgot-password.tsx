'use client';

import React from 'react';
import { cn } from '@cs/ui/utils';
import { REDIRECTS } from '@/lib/constants';
import { useTimer } from '@/hooks/use-timer';
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

type Props = {
  className?: string | string[];
};

export const ForgotPassword: React.FC<Props> = ({ className }) => {
  const [disabled, setDisabled] = React.useState(true);
  const { remaining, start, set } = useTimer('forgot-password');
  const [form, formAction] = useI18nForm(
    forgotPassword,
    forgotPasswordSchema.omit({ redirectUrl: true }),
    {
      email: '',
    },
  );

  const onSubmit = async (formData: FormData) => {
    const isValid = await form.trigger();
    if (isValid) {
      set(60);
      start();
      formAction(formData);
    }
  };

  React.useEffect(() => {
    start();
    setDisabled(false);
  }, [start]);

  return (
    <div className={cn('space-y-6', className)}>
      <div className="grid gap-2 text-center">
        <h1 className="text-3xl font-bold">Zabudnuté heslo</h1>
        <p className="text-muted-foreground text-balance">
          Použite svoj email na resetovanie hesla
        </p>
      </div>
      <div className="space-y-4">
        <Form {...form}>
          <form className="space-y-4" action={onSubmit}>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      autoComplete="email"
                      placeholder="vas@email.com"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex flex-col gap-4 sm:flex-row">
              <SubmitButton
                className="w-full"
                disabled={disabled || remaining > 0}
              >
                Odoslať {remaining > 0 && `(${remaining}s)`}
              </SubmitButton>
            </div>
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
