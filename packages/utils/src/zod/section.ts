import { z } from './index';

export const createSectionSchema = z.object({
  translations: z
    .array(
      z.object({
        name: z.string().max(128),
        language: z.string().length(2),
      })
    )
    .min(1),
});

export const updateSectionSchema = z
  .object({
    position: z.number().nonnegative(),
    translations: z
      .array(
        z.object({
          name: z.string().max(128),
          language: z.string().length(2),
        })
      )
      .min(1),
  })
  .partial();

export const getSectionSchema = z.object({
  recipeId: z.string(),
  sectionId: z.string(),
});

export type GetSectionInput = z.infer<typeof getSectionSchema>;
