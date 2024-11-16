import { z } from 'zod';

export const imageSchema = z.object({
  image: z
    .any()
    .refine(file => file?.size <= 5 * 1024 * 1024, {
      params: {
        i18n: {
          key: 'invalidFileSize',
          options: {
            maximum: 5,
          },
        },
      },
    })
    .refine(file => file?.type.startsWith('image/'), {
      params: {
        i18n: 'invalidFileType',
      },
    }),
});
