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
  recipesFavorites,
  recipesTranslations,
  recipes as recipesTable,
} from '../services/db/schema';
import {
  useRecipe,
  useRecipes,
  useFavoriteRecipes,
} from '../services/db/queries';
import {
  validator,
  validateRecipe,
  validateRecipeDraft,
} from '../middlewares/validation';
import { slugify } from '@cs/utils';
import { eq, and } from 'drizzle-orm';
import { initializeDB } from '../services/db';
import { log } from '../middlewares/analytics';
import { generateId } from '@cs/utils/generators';
import rateLimit from '../middlewares/rate-limit';
import { HTTPException } from 'hono/http-exception';
import { initializeImage } from '../services/image';
import { getConflictUpdateSetter } from '../utils/db';
import { verifyRoles, verifyAuthor, verifyAuth } from '../middlewares/auth';

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

recipes.get(
  '/favorites',
  verifyAuth,
  validator('query', getRecipesSchema),
  async c => {
    const options = c.req.valid('query');
    const { limit, offset } = options;

    const { recipes, total } = await useFavoriteRecipes(c, options);
    const page = Math.floor(offset / limit) + 1;
    const pages = Math.ceil(total / limit);

    return c.json({ recipes, total, page, pages });
  },
);

recipes.post(
  '/',
  log('recipes', 'Recipe creation attempt'),
  verifyRoles(['author', 'admin']),
  validator('json', createRecipeSchema),
  async c => {
    const { t } = c.get('i18n');
    const { translations, ...recipe } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const userId = c.get('user')!.id;
    const recipeId = generateId(16);

    try {
      const [_1, _2, [results]] = await db.batch([
        db.insert(recipesTable).values({
          ...recipe,
          id: recipeId,
          userId,
        }),
        db.insert(recipesTranslations).values(
          translations.map(v => ({
            ...v,
            recipeId,
            slug: slugify(v.name),
          })),
        ),
        useRecipe(c, { recipeId }),
      ]);

      return c.json(results, 201);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: FOREIGN KEY')) {
          throw new HTTPException(400, { message: t('category.notFound') });
        }
      }

      throw err;
    }
  },
);

recipes.use('/:recipeId/*', validateRecipe);
recipes.get('/:recipeId/*', validateRecipeDraft);
recipes.get('/:recipeId', validator('param', getRecipeSchema), async c => {
  const recipe = c.get('recipe')!;

  return c.json(recipe);
});

recipes.patch(
  '/:recipeId',
  log('recipes', 'Recipe update attempt'),
  verifyAuthor(verifyRoles(['admin'])),
  validator('param', getRecipeSchema),
  validator('json', updateRecipeSchema),
  async c => {
    const { t } = c.get('i18n');
    const { recipeId } = c.req.valid('param');
    const { translations, ...recipe } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    try {
      const [_1, ...get1] = await db.batch([
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
        useRecipe(c, { recipeId }),
      ]);

      const [results] = get1.filter(v => Array.isArray(v)).map(v => v[0]);
      return c.json(results);
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('D1_ERROR: FOREIGN KEY')) {
          throw new HTTPException(400, { message: t('category.notFound') });
        }
      }

      throw err;
    }
  },
);

recipes.patch(
  '/:recipeId/publish',
  log('recipes', 'Recipe publication attempt'),
  verifyAuthor(verifyRoles(['admin'])),
  validator('param', getRecipeSchema),
  async c => {
    const { recipeId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db
      .update(recipesTable)
      .set({ status: 'published' })
      .where(eq(recipesTable.id, recipeId));

    return c.body(null, 204);
  },
);

recipes.put(
  '/:recipeId/image',
  verifyAuthor(verifyRoles(['admin'])),
  validator('param', getRecipeSchema),
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

recipes.put(
  '/:recipeId/favorite',
  verifyAuth,
  validateRecipeDraft,
  validator('param', getRecipeSchema),
  async c => {
    const user = c.get('user')!;
    const { recipeId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    const favorite = await db.query.recipesFavorites.findFirst({
      where: (t, { and, eq }) =>
        and(eq(t.recipeId, recipeId), eq(t.userId, user.id)),
    });

    if (favorite) {
      await db
        .delete(recipesFavorites)
        .where(
          and(
            eq(recipesFavorites.recipeId, recipeId),
            eq(recipesFavorites.userId, user.id),
          ),
        );
    } else {
      await db.insert(recipesFavorites).values({ recipeId, userId: user.id });
    }

    return c.body(null, 204);
  },
);

recipes.delete(
  '/:recipeId',
  log('recipes', 'Recipe deletion attempt', 'warning'),
  verifyAuthor(verifyRoles(['admin'])),
  validator('param', getRecipeSchema),
  async c => {
    const { recipeId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);

    await db.delete(recipesTable).where(eq(recipesTable.id, recipeId));

    return c.body(null, 204);
  },
);

recipes.route('/:recipeId/sections', sections);

export default recipes;
