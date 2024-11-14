import { z } from './index';

export const createInstructionSchema = z.object({
  translations: z
    .array(
      z.object({
        text: z.string().max(1024),
        language: z.string().length(2),
      }),
    )
    .min(1),
});

export const updateInstructionSchema = z
  .array(
    z
      .object({
        id: z.string().length(16),
        position: z.number().nonnegative(),
        translations: z
          .array(
            z.object({
              text: z.string().max(1024),
              language: z.string().length(2),
            }),
          )
          .min(1),
      })
      .partial(),
  )
  .min(1);

export const getInstructionSchema = z.object({
  recipeId: z.string().length(16),
  sectionId: z.string().length(16),
  instructionId: z.string().length(16),
});

export type GetInstructionInput = z.infer<typeof getInstructionSchema>;
