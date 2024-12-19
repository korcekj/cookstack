import type { Env } from '../types';

import {
  imageSchema,
  getRecipeSchema,
  getRecipesSchema,
  createRecipeSchema,
  updateRecipeSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  recipesTranslations,
  recipes as recipesTable,
} from '../services/db/schema';
import { eq } from 'drizzle-orm';
import { initializeDB } from '../services/db';
import { verifyRoles } from '../middlewares/auth';
import rateLimit from '../middlewares/rate-limit';
import { initializeImage } from '../services/image';
import { generateId, slugify, pick, omit } from '@cs/utils';
import { getConflictUpdateSetter } from '../services/db/utils';
import { validator, validateRecipe } from '../middlewares/validation';
import { useRecipe, useRecipes, useCategory } from '../services/db/queries';

import sections from './sections';

const recipes = new Hono<Env>();

recipes.use(rateLimit);

recipes.get('/', validator('query', getRecipesSchema), async c => {
  const options = c.req.valid('query');
  const { limit, offset } = options;

  const { recipes, total } = await useRecipes(c, options);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ recipes, total, page, pages });
});

recipes.post(
  '/',
  verifyRoles(['author', 'admin']),
  validator('json', createRecipeSchema),
  async c => {
    const { t, locale } = c.get('i18n');
    const { translations, ...recipe } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const userId = c.get('user')!.id;
    const recipeId = generateId(16);

    try {
      const [[insert1], insert2, [get1]] = await db.batch([
        db
          .insert(recipesTable)
          .values({
            ...recipe,
            id: recipeId,
            userId,
          })
          .returning(),
        db
          .insert(recipesTranslations)
          .values(
            translations.map(v => ({
              ...v,
              recipeId,
              slug: slugify(v.name),
            })),
          )
          .returning(),
        useCategory(c, { categoryId: recipe.categoryId }),
      ]);

      const translation = insert2.find(v => v.language === locale());
      return c.json(
        {
          ...omit(insert1, ['userId']),
          ...(translation
            ? pick(translation, ['name', 'description', 'slug'])
            : {}),
          category: get1,
        },
        201,
      );
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('recipe.duplicate') }, 409);
        } else if (err.message.includes('D1_ERROR: FOREIGN KEY')) {
          return c.json({ error: t('category.notFound') }, 404);
        }
      }

      throw err;
    }
  },
);

recipes.get(
  '/:recipeId',
  validator('param', getRecipeSchema),
  validateRecipe,
  async c => {
    const options = c.req.valid('param');

    const [recipe] = await useRecipe(c, options);

    return c.json(recipe);
  },
);

recipes.patch(
  '/:recipeId',
  verifyRoles(['author', 'admin']),
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('json', updateRecipeSchema),
  async c => {
    const { t } = c.get('i18n');
    const { recipeId } = c.req.valid('param');
    const { translations, ...recipe } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    try {
      await db.batch([
        db
          .update(recipesTable)
          .set({ ...recipe, updatedAt: new Date() })
          .where(eq(recipesTable.id, recipeId)),
        ...(translations
          ? [
              db
                .insert(recipesTranslations)
                .values(
                  translations.map(v => ({
                    ...v,
                    recipeId,
                    slug: slugify(v.name),
                  })),
                )
                .onConflictDoUpdate({
                  target: [
                    recipesTranslations.recipeId,
                    recipesTranslations.language,
                  ],
                  set: getConflictUpdateSetter(recipesTranslations, [
                    'name',
                    'slug',
                    'description',
                  ]),
                }),
            ]
          : []),
      ]);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: UNIQUE')) {
          return c.json({ error: t('recipe.duplicate') }, 409);
        } else if (err.message.includes('D1_ERROR: FOREIGN KEY')) {
          return c.json({ error: t('category.notFound') }, 404);
        }
      }

      throw err;
    }

    return c.body(null, 204);
  },
);

recipes.put(
  '/:recipeId/image',
  verifyRoles(['author', 'admin']),
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('form', imageSchema),
  async c => {
    const { recipeId } = c.req.valid('param');
    const { image: file } = c.req.valid('form');

    const db = initializeDB(c.env.DB);
    const image = initializeImage(c);

    const imageId = generateId(16);

    const {
      eager: [{ secure_url: imageUrl }],
    } = await image.upload(file, {
      publicId: imageId,
      folder: `cookstack/${c.env.ENV}/recipes`,
      uploadPreset: 'cookstack',
    });

    await db
      .update(recipesTable)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(recipesTable.id, recipeId));

    return c.json({ id: imageId, url: imageUrl });
  },
);

recipes.delete(
  '/:recipeId',
  verifyRoles(['author', 'admin']),
  validator('param', getRecipeSchema),
  validateRecipe,
  async c => {
    const { recipeId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db.delete(recipesTable).where(eq(recipesTable.id, recipeId));

    return c.body(null, 204);
  },
);

recipes.route('/:recipeId/sections', sections);

export default recipes;
