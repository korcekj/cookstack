import { z } from 'zod';

export const createSectionSchema = z.object({
  translations: z
    .array(
      z.object({
        name: z.string().max(128),
        language: z.string().length(2),
      }),
    )
    .min(1),
});

export const updateSectionSchema = z
  .array(
    z
      .object({
        id: z.string().length(16),
        position: z.number().nonnegative(),
        translations: z
          .array(
            z.object({
              name: z.string().max(128),
              language: z.string().length(2),
            }),
          )
          .min(1),
      })
      .partial(),
  )
  .min(1);

export const getSectionSchema = z.object({
  recipeId: z.string().length(16),
  sectionId: z.string().length(16),
});

export type GetSectionInput = z.infer<typeof getSectionSchema>;
