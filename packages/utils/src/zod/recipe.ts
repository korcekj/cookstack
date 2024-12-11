import { z } from 'zod';
import { joinValues } from '../index';
import { categorySchema } from './category';

export const recipeSchema = z.object({
  id: z.string(),
  imageUrl: z.string().url().nullable(),
  preparation: z.number(),
  cook: z.number(),
  total: z.number(),
  yield: z.number(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  category: categorySchema.pick({ id: true, name: true, slug: true }),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Recipe = z.infer<typeof recipeSchema>;

export const createRecipeSchema = z.object({
  imageUrl: z.string().url().optional(),
  preparation: z.number().nonnegative(),
  cook: z.number().nonnegative(),
  yield: z.number().positive(),
  categoryId: z.string().length(16),
  translations: z
    .array(
      z.object({
        name: z.string().max(128),
        description: z.string().max(1024).optional(),
        language: z.string().length(2),
      }),
    )
    .min(1),
});

export const updateRecipeSchema = z
  .object({
    imageUrl: z.string().url(),
    preparation: z.number().nonnegative(),
    cook: z.number().nonnegative(),
    yield: z.number().positive(),
    categoryId: z.string().length(16),
    translations: z
      .array(
        z.object({
          name: z.string().max(128),
          description: z.string().max(1024).optional(),
          language: z.string().length(2),
        }),
      )
      .min(1),
  })
  .partial();

export const getRecipeSchema = z.object({
  recipeId: z.string().length(16),
});

export type GetRecipeInput = z.infer<typeof getRecipeSchema>;

export const recipesOrderBySchema = z.enum([
  'name',
  '-name',
  'createdAt',
  '-createdAt',
  'updatedAt',
  '-updatedAt',
  'yield',
  '-yield',
  'total',
  '-total',
]);

export type RecipesOrderByInput = z.infer<typeof recipesOrderBySchema>;

export type RecipesOrderByColumns<T = RecipesOrderByInput> =
  T extends `-${string}` ? never : T;

export const getRecipesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z
    .string()
    .optional()
    .refine(
      v =>
        v
          ? v.split(',').every(s => recipesOrderBySchema.safeParse(s).success)
          : true,
      {
        params: {
          i18n: {
            key: 'invalidEnumValue',
            options: {
              options: joinValues(recipesOrderBySchema.options),
            },
          },
        },
      },
    ),
});

export type GetRecipesInput = z.infer<typeof getRecipesSchema>;
