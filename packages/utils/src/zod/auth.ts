import { z } from 'zod';
import { joinValues } from '../index';

export const roleSchema = z.enum(['user', 'author', 'admin']);

export type Role = z.infer<typeof roleSchema>;

export const roleRequestSchema = z.object({
  role: roleSchema,
});

export const getRoleRequestSchema = z.object({
  requestId: z.string().length(16),
  status: z.enum(['approved', 'rejected']),
});

export type GetRoleRequestInput = z.infer<typeof getRoleRequestSchema>;

export const roleRequestsOrderBySchema = z.enum([
  'role',
  '-role',
  'createdAt',
  '-createdAt',
]);

export type RoleRequestsOrderByInput = z.infer<
  typeof roleRequestsOrderBySchema
>;

export type RoleRequestsOrderByColumns<T = RoleRequestsOrderByInput> =
  T extends `-${string}` ? never : T;

export const getRoleRequestsSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  status: z.enum(['pending', 'approved', 'rejected']).default('pending'),
  orderBy: z
    .string()
    .min(1)
    .nullish()
    .refine(
      v =>
        v
          ? v
              .split(',')
              .every(s => roleRequestsOrderBySchema.safeParse(s).success)
          : true,
      {
        params: {
          i18n: {
            key: 'invalidEnumValue',
            options: {
              options: joinValues(roleRequestsOrderBySchema.options),
            },
          },
        },
      },
    ),
});

export type GetRoleRequestsInput = z.infer<typeof getRoleRequestsSchema>;

export const userSchema = z.object({
  id: z.string(),
  firstName: z.string().max(16).nullable(),
  lastName: z.string().max(32).nullable(),
  email: z.string().email(),
  emailVerified: z.boolean(),
  imageUrl: z.string().url().nullable(),
  role: roleSchema,
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
