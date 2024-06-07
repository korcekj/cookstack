import { z } from './index';

export const signInGoogleSchema = z.object({
  redirectUrl: z.string().url().optional(),
});

export type SignInGoogleInput = z.infer<typeof signInGoogleSchema>;

export const signInGoogleCallbackSchema = z.object({
  state: z.string(),
  code: z.string(),
});

export type SignInGoogleCallbackInput = z.infer<
  typeof signInGoogleCallbackSchema
>;

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(24),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const signUpSchema = z
  .object({
    firstName: z.string().max(16).optional(),
    lastName: z.string().max(32).optional(),
    email: z.string().email(),
    password: z.string().min(8).max(24),
    passwordConfirm: z.string().min(8).max(24),
  })
  .refine(({ password, passwordConfirm }) => password === passwordConfirm, {
    path: ['passwordConfirm'],
    params: {
      i18n: 'notSamePassword',
    },
  });

export type SignUpInput = z.infer<typeof signUpSchema>;

export const verifyEmailSchema = z.object({
  code: z.string().regex(/^\d+$/).length(8),
});

export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const forgotPasswordSchema = z.object({
  redirectUrl: z.string().url().optional(),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const generateResetPasswordTokenSchema = z.object({
  email: z.string().email(),
});

export type GenerateResetPasswordTokenInput = z.infer<
  typeof generateResetPasswordTokenSchema
>;

export const resetPasswordTokenSchema = z.object({
  token: z.string().length(40),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8).max(24),
    passwordConfirm: z.string().min(8).max(24),
  })
  .refine(({ password, passwordConfirm }) => password === passwordConfirm, {
    path: ['passwordConfirm'],
    params: {
      i18n: 'notSamePassword',
    },
  });
