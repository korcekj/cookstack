import { z } from 'zod';

export const createIngredientSchema = z.object({
  translations: z
    .array(
      z.object({
        name: z.string().max(128),
        unit: z.string().max(128),
        amount: z.number().nonnegative(),
        language: z.string().length(2),
      }),
    )
    .min(1),
});

export const updateIngredientSchema = z
  .array(
    z
      .object({
        id: z.string().length(16),
        position: z.number().nonnegative(),
        translations: z
          .array(
            z.object({
              name: z.string().max(128),
              unit: z.string().max(128),
              amount: z.number().nonnegative(),
              language: z.string().length(2),
            }),
          )
          .min(1),
      })
      .partial(),
  )
  .min(1);

export const getIngredientSchema = z.object({
  recipeId: z.string().length(16),
  sectionId: z.string().length(16),
  ingredientId: z.string().length(16),
});

export type GetIngredientInput = z.infer<typeof getIngredientSchema>;
