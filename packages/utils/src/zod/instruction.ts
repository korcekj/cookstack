import { z } from './index';

export const createInstructionSchema = z.object({
  translations: z
    .array(
      z.object({
        text: z.string().max(1024),
        language: z.string().length(2),
      })
    )
    .min(1),
});

export const updateInstructionSchema = z
  .array(
    z
      .object({
        id: z.string(),
        position: z.number().nonnegative(),
        translations: z
          .array(
            z.object({
              text: z.string().max(1024),
              language: z.string().length(2),
            })
          )
          .min(1),
      })
      .partial()
  )
  .min(1);

export const getInstructionSchema = z.object({
  recipeId: z.string(),
  sectionId: z.string(),
  instructionId: z.string(),
});

export type GetInstructionInput = z.infer<typeof getInstructionSchema>;
