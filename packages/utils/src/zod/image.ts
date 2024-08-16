import { z } from './index';

export const getImageSchema = z.object({
  imageId: z.string().length(16),
});
