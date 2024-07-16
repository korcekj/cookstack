import { z } from './index';
import { joinValues } from '../index';

export const createRecipeSchema = z.object({
  recipe: z.object({
    imageUrl: z.string().url().optional(),
    preparation: z.number().nonnegative(),
    cook: z.number().nonnegative(),
    yield: z.number().positive(),
    categoryId: z.string(),
  }),
  translations: z.array(
    z.object({
      name: z.string().max(128),
      description: z.string().max(1024).optional(),
      language: z.string().length(2),
    })
  ),
  sections: z.array(
    z.object({
      translations: z.array(
        z.object({
          name: z.string().max(128),
          language: z.string().length(2),
        })
      ),
      ingredients: z.array(
        z.object({
          translations: z.array(
            z.object({
              name: z.string().max(128),
              unit: z.string().max(128),
              amount: z.number().nonnegative(),
              language: z.string().length(2),
            })
          ),
        })
      ),
      instructions: z.array(
        z.object({
          translations: z.array(
            z.object({
              text: z.string().max(1024),
              language: z.string().length(2),
            })
          ),
        })
      ),
    })
  ),
});

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
      (v) =>
        v
          ? v.split(',').every((s) => recipesOrderBySchema.safeParse(s).success)
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
      }
    ),
});
