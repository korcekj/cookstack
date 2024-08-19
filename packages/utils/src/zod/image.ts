import { z } from './index';

export const getImageParamSchema = z.object({
  imageId: z.string().length(16),
});

export type GetImageParamInput = z.infer<typeof getImageParamSchema>;

export const getImageQuerySchema = z.object({
  // TODO: add language specific error
  w: z.coerce.number().min(1).max(1920).default(256),
  q: z.coerce.number().min(0).max(100).optional(),
});
