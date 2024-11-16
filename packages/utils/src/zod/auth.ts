import { z } from 'zod';

export const userSchema = z.object({
  id: z.string(),
  firstName: z.string().nullable(),
  lastName: z.string().nullable(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  imageUrl: z.string().url().nullable(),
  role: z.enum(['user', 'author']),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type User = z.infer<typeof userSchema>;

export const sessionSchema = z.object({
  id: z.string(),
  fresh: z.boolean(),
  userId: z.string(),
  expiresAt: z.date(),
});

export type Session = z.infer<typeof sessionSchema>;

export const googleUserSchema = z.object({
  sub: z.string(),
  name: z.string(),
  given_name: z.string(),
  family_name: z.string(),
  picture: z.string().url(),
  email: z.string().email(),
  email_verified: z.boolean(),
  locale: z.string(),
});

export type GoogleUser = z.infer<typeof googleUserSchema>;

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
  code: z.string().regex(/^\d+$/).length(6),
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
  },
>(
  schema: z.ZodType<T>,
) => {
  return schema.refine(
    ({ password, passwordConfirm }) => password === passwordConfirm,
    {
      path: ['passwordConfirm'],
      params: {
        i18n: 'notSamePassword',
      },
    },
  );
};
