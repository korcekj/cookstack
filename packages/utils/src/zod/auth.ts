import { z } from './index';

export const signInGoogleSchema = z.object({
  redirectUrl: z.string().url().optional(),
});

export const signInGoogleCallbackSchema = z.object({
  state: z.string(),
  code: z.string(),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(24),
});

export const signUpSchema = z.object({
  firstName: z.string().max(16).optional(),
  lastName: z.string().max(32).optional(),
  email: z.string().email(),
  password: z.string().min(8).max(24),
  passwordConfirm: z.string().min(8).max(24),
});

export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d+$/).length(8),
});

export const forgotPasswordSchema = z.object({
  redirectUrl: z.string().url().optional(),
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().length(40),
  password: z.string().min(8).max(24),
  passwordConfirm: z.string().min(8).max(24),
});

export const confirmPassword = <
  T extends {
    password: string;
    passwordConfirm: string;
  }
>(
  schema: z.ZodType<T>
) => {
  return schema.refine(
    ({ password, passwordConfirm }) => password === passwordConfirm,
    {
      path: ['passwordConfirm'],
      params: {
        i18n: 'notSamePassword',
      },
    }
  );
};
