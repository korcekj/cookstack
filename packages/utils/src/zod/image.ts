import { z } from './index';

export const getImageParamSchema = z.object({
  imageId: z.string().min(1),
});

export type GetImageParamInput = z.infer<typeof getImageParamSchema>;

export const getImageQuerySchema = z
  .object({
    w: z.union([z.coerce.number().min(1).max(1920), z.literal('auto')]),
    h: z.coerce.number().min(1).max(1920),
    q: z.union([z.coerce.number().min(1).max(100), z.literal('auto')]),
    o: z.coerce.number().min(0).max(100),
    c: z.enum(['auto', 'fill', 'fit', 'crop', 'scale', 'thumb']),
    f: z.enum(['auto', 'jpg', 'png', 'webp']),
    t: z.string().min(1),
    g: z.string().min(1),
  })
  .partial();

export type GetImageQueryInput = z.infer<typeof getImageQuerySchema>;
