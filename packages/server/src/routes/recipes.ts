import type { Env } from '../types';

import {
  getRecipeSchema,
  getRecipesSchema,
  createRecipeSchema,
  updateRecipeSchema,
  updateRecipeImageSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import {
  recipesTranslations,
  recipes as recipesTable,
} from '../services/db/schema';
import { eq } from 'drizzle-orm';
import { slugify } from '@cs/utils';
import { initializeDB } from '../services/db';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { useRecipes } from '../services/db/queries';
import { initializeImage } from '../services/image';
import { rateLimit } from '../middlewares/rate-limit';
import { getConflictUpdateSetter } from '../services/db/helpers';
import { validator, validateRecipe } from '../middlewares/validation';

import sections from './sections';

const recipes = new Hono<Env>();

recipes.use(rateLimit);

recipes.get('/', validator('query', getRecipesSchema), async (c) => {
  const options = c.req.valid('query');
  const { limit, offset } = options;

  const { recipes, total } = await useRecipes(c, options);
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ recipes, total, page, pages });
});

recipes.post(
  '/',
  verifyAuthor,
  validator('json', createRecipeSchema),
  async (c) => {
    const t = useTranslation(c);
    const { translations, ...recipe } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const userId = c.get('user')!.id;
    const recipeId = generateIdFromEntropySize(10);

    try {
      await db.batch([
        db.insert(recipesTable).values({
          ...recipe,
          id: recipeId,
          userId,
        }),
        db.insert(recipesTranslations).values(
          translations.map((v) => ({
            ...v,
            recipeId,
            slug: slugify(v.name),
          }))
        ),
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

    return c.json({ recipe: { id: recipeId } }, 201);
  }
);

recipes.get(
  '/:recipeId',
  validator('param', getRecipeSchema),
  validateRecipe,
  async (c) => {
    const options = c.req.valid('param');
    const { recipes } = await useRecipes(c, options);
    return c.json({ recipe: recipes[0] });
  }
);

recipes.patch(
  '/:recipeId',
  verifyAuthor,
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('json', updateRecipeSchema),
  async (c) => {
    const t = useTranslation(c);
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
                  translations.map((v) => ({
                    ...v,
                    recipeId,
                    slug: slugify(v.name),
                  }))
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
  }
);

recipes.put(
  '/:recipeId/image',
  verifyAuthor,
  validator('param', getRecipeSchema),
  validateRecipe,
  validator('form', updateRecipeImageSchema),
  async (c) => {
    const { recipeId } = c.req.valid('param');
    const { image: file } = c.req.valid('form');

    const db = initializeDB(c.env.DB);
    const image = initializeImage(c);

    const imageId = generateIdFromEntropySize(10);

    const {
      eager: [{ secure_url: imageUrl }],
    } = await image.upload(file, {
      publicId: imageId,
      folder: `cookstack/${c.env.ENV}`,
      uploadPreset: 'cookstack',
    });

    await db
      .update(recipesTable)
      .set({ imageUrl, updatedAt: new Date() })
      .where(eq(recipesTable.id, recipeId));

    return c.json({ image: { id: imageId, url: imageUrl } });
  }
);

recipes.delete(
  '/:recipeId',
  verifyAuthor,
  validator('param', getRecipeSchema),
  validateRecipe,
  async (c) => {
    const { recipeId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db.delete(recipesTable).where(eq(recipesTable.id, recipeId));

    return c.body(null, 204);
  }
);

recipes.route('/:recipeId/sections', sections);

export default recipes;
