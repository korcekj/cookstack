import { z } from 'zod';
import { joinValues } from '../index';

export const createCategorySchema = z.object({
  translations: z
    .array(
      z.object({
        name: z.string().max(128),
        language: z.string().length(2),
      }),
    )
    .min(1),
});

export const updateCategorySchema = z.object({
  translations: z
    .array(
      z.object({
        name: z.string().max(128),
        language: z.string().length(2),
      }),
    )
    .min(1),
});

export const getCategorySchema = z.object({
  categoryId: z.string().length(16),
});

export type GetCategoryInput = z.infer<typeof getCategorySchema>;

export const categoriesOrderBySchema = z.enum(['name', '-name']);

export type CategoriesOrderByInput = z.infer<typeof categoriesOrderBySchema>;

export type CategoriesOrderByColumns<T = CategoriesOrderByInput> =
  T extends `-${string}` ? never : T;

export const getCategoriesSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(10),
  offset: z.coerce.number().min(0).default(0),
  orderBy: z
    .string()
    .optional()
    .refine(
      v =>
        v
          ? v
              .split(',')
              .every(s => categoriesOrderBySchema.safeParse(s).success)
          : true,
      {
        params: {
          i18n: {
            key: 'invalidEnumValue',
            options: {
              options: joinValues(categoriesOrderBySchema.options),
            },
          },
        },
      },
    ),
});

export type GetCategoriesInput = z.infer<typeof getCategoriesSchema>;
