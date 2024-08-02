import { z } from './index';

export const createIngredientSchema = z.object({
  translations: z
    .array(
      z.object({
        name: z.string().max(128),
        unit: z.string().max(128),
        amount: z.number().nonnegative(),
        language: z.string().length(2),
      })
    )
    .min(1),
});

export const updateIngredientSchema = z
  .array(
    z
      .object({
        id: z.string(),
        position: z.number().nonnegative(),
        translations: z
          .array(
            z.object({
              name: z.string().max(128),
              unit: z.string().max(128),
              amount: z.number().nonnegative(),
              language: z.string().length(2),
            })
          )
          .min(1),
      })
      .partial()
  )
  .min(1);

export const getIngredientSchema = z.object({
  recipeId: z.string(),
  sectionId: z.string(),
  ingredientId: z.string(),
});

export type GetIngredientInput = z.infer<typeof getIngredientSchema>;
