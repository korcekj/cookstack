'use client';

import type { ActionResponse } from '@/types';
import type { UseFormReturn, DefaultValues, Path } from 'react-hook-form';

import React from 'react';
import { toast } from 'sonner';
import { z } from '@cs/utils/zod';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { objectEntries } from '@cs/utils';
import { useI18nZod } from '@/hooks/use-i18n-zod';
import { zodResolver } from '@hookform/resolvers/zod';

export const useI18nForm = <
  S extends z.ZodType<any, any>,
  T extends ActionResponse<S>
>(
  schema: S,
  action: (_: any, formData: FormData) => Promise<T>,
  initialValues: Partial<z.infer<S>> = {}
): [UseFormReturn<z.infer<S>>, (payload: FormData) => void] => {
  // Enable i18n in zodResolver
  useI18nZod();

  const [state, formAction] = useFormState(action, null);
  const form = useForm<z.infer<S>>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      ...initialValues,
      ...state?.fields,
    } as DefaultValues<z.infer<S>>,
  });

  React.useEffect(() => {
    if (state?.error) {
      toast.error(state.error);
    } else if (state?.success) {
      form.reset();
      toast.success(state.success);
    } else if (state?.fieldErrors) {
      objectEntries(state.fieldErrors).forEach(([key, value]) => {
        form.setError(key as Path<z.infer<S>>, { message: value });
      });
    }
  }, [state, form]);

  return [form, formAction];
};
