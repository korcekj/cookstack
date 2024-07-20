import type { Context } from 'hono';
import type { BatchItem } from 'drizzle-orm/batch';
import type { RecipeTranslation, CategoryTranslation } from '../db/schema';
import type { Env, Recipe, Section, Ingredient, Instruction } from '../types';
import type {
  RecipesOrderByColumns,
  GetRecipesInput,
  GetRecipeInput,
} from '@cs/utils/zod';

import {
  recipes as recipesTable,
  recipesTranslations,
  sections as sectionsTable,
  sectionsTranslations,
  ingredients as ingredientsTable,
  ingredientsTranslations,
  instructions as instructionsTable,
  instructionsTranslations,
  categoriesTranslations,
} from '../db/schema';
import {
  getRecipeSchema,
  getRecipesSchema,
  createRecipeSchema,
} from '@cs/utils/zod';
import { Hono } from 'hono';
import { slugify } from '@cs/utils';
import { initializeDB } from '../db';
import { useTranslation } from '@intlify/hono';
import { generateIdFromEntropySize } from 'lucia';
import { verifyAuthor } from '../middlewares/auth';
import { validator } from '../middlewares/validation';
import { rateLimit } from '../middlewares/rate-limit';
import { getLocale, getOrderByClauses } from '../utils';
import { sql, count, eq, and, inArray } from 'drizzle-orm';

const recipes = new Hono<Env>();

recipes.use(rateLimit);

recipes.post(
  '/',
  verifyAuthor,
  validator('json', createRecipeSchema),
  async (c) => {
    const t = useTranslation(c);
    const { recipe, translations, sections } = c.req.valid('json');

    const db = initializeDB(c.env.DB);

    const userId = c.get('user')!.id;
    const recipeId = generateIdFromEntropySize(10);
    const batches: [BatchItem<'sqlite'>, ...BatchItem<'sqlite'>[]] = [
      db.insert(recipesTable).values({
        id: recipeId,
        userId,
        ...recipe,
      }),
      db.insert(recipesTranslations).values(
        translations.map((v) => ({
          recipeId,
          slug: slugify(v.name),
          ...v,
        }))
      ),
    ];

    for (const { ingredients, instructions, translations } of sections) {
      const sectionId = generateIdFromEntropySize(10);
      batches.push(
        db.insert(sectionsTable).values({
          id: sectionId,
          recipeId,
        })
      );
      batches.push(
        db.insert(sectionsTranslations).values(
          translations.map((v) => ({
            sectionId,
            ...v,
          }))
        )
      );
      for (const { translations } of ingredients) {
        const ingredientId = generateIdFromEntropySize(10);
        batches.push(
          db.insert(ingredientsTable).values({
            id: ingredientId,
            sectionId,
          })
        );
        batches.push(
          db.insert(ingredientsTranslations).values(
            translations.map((v) => ({
              ingredientId,
              ...v,
            }))
          )
        );
      }
      for (const { translations } of instructions) {
        const instructionId = generateIdFromEntropySize(10);
        batches.push(
          db.insert(instructionsTable).values({
            id: instructionId,
            sectionId,
          })
        );
        batches.push(
          db.insert(instructionsTranslations).values(
            translations.map((v) => ({
              instructionId,
              ...v,
            }))
          )
        );
      }
    }

    try {
      await db.batch(batches);
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

recipes.get('/', validator('query', getRecipesSchema), async (c) => {
  const { limit, offset, orderBy } = c.req.valid('query');

  const { recipes, total } = await getRecipes(c, { limit, offset, orderBy });
  const page = Math.floor(offset / limit) + 1;
  const pages = Math.ceil(total / limit);

  return c.json({ recipes, total, page, pages });
});

recipes.get('/:slug', validator('param', getRecipeSchema), async (c) => {
  const t = useTranslation(c);
  const { slug } = c.req.valid('param');
  const { recipes } = await getRecipes(c, { slug });
  if (!recipes.length) return c.json({ error: t('recipe.notFound') }, 404);

  return c.json({ recipe: recipes });
});

const getRecipes = async (
  c: Context<Env>,
  options: GetRecipeInput | GetRecipesInput
) => {
  const locale = getLocale(c);
  const db = initializeDB(c.env.DB);

  const query = db
    .select({
      id: recipesTable.id,
      image: recipesTable.imageUrl,
      preparation: recipesTable.preparation,
      cook: recipesTable.cook,
      total: recipesTable.total,
      yield: recipesTable.yield,
      name: sql<RecipeTranslation['name']>`${recipesTranslations.name}`.as(
        'rc_name'
      ),
      slug: sql<RecipeTranslation['slug']>`${recipesTranslations.slug}`.as(
        'rc_slug'
      ),
      description: recipesTranslations.description,
      category: {
        name: sql<
          CategoryTranslation['name']
        >`${categoriesTranslations.name}`.as('ct_name'),
        slug: sql<
          CategoryTranslation['slug']
        >`${categoriesTranslations.slug}`.as('ct_slug'),
      },
    })
    .from(recipesTable)
    .innerJoin(
      recipesTranslations,
      and(
        eq(recipesTranslations.recipeId, recipesTable.id),
        eq(recipesTranslations.language, locale)
      )
    )
    .innerJoin(
      categoriesTranslations,
      and(
        eq(categoriesTranslations.categoryId, recipesTable.categoryId),
        eq(categoriesTranslations.language, locale)
      )
    );

  if ('slug' in options) {
    query.$dynamic().where(eq(recipesTranslations.slug, options.slug));
  }

  if ('orderBy' in options) {
    const orderByClauses = getOrderByClauses<RecipesOrderByColumns>(
      options.orderBy,
      (value) => {
        switch (value) {
          case 'name':
            return recipesTranslations.name;
          case 'createdAt':
            return recipesTable.createdAt;
          case 'updatedAt':
            return recipesTable.updatedAt;
          case 'yield':
            return recipesTable.yield;
          case 'total':
            return recipesTable.total;
          default:
            throw new Error(`Invalid column name: ${value}`);
        }
      }
    );

    query.$dynamic().orderBy(...orderByClauses);
  }

  if ('limit' in options && 'offset' in options) {
    query.$dynamic().limit(options.limit).offset(options.offset);
  }

  const [recipes, [{ count: total }]] = await db.batch([
    query,
    db.select({ count: count() }).from(recipesTable),
  ]);

  if (!recipes.length) return { recipes: [], total };

  const sections = await db
    .select({
      id: sectionsTable.id,
      recipeId: sectionsTable.recipeId,
      name: sectionsTranslations.name,
    })
    .from(sectionsTable)
    .innerJoin(
      sectionsTranslations,
      and(
        eq(sectionsTranslations.sectionId, sectionsTable.id),
        eq(sectionsTranslations.language, locale)
      )
    )
    .where(
      inArray(
        sectionsTable.recipeId,
        recipes.map(({ id }) => id)
      )
    );

  const [ingredients, instructions] = await db.batch([
    db
      .select({
        sectionId: ingredientsTable.sectionId,
        name: ingredientsTranslations.name,
        unit: ingredientsTranslations.unit,
        amount: ingredientsTranslations.amount,
      })
      .from(ingredientsTable)
      .innerJoin(
        ingredientsTranslations,
        and(
          eq(ingredientsTranslations.ingredientId, ingredientsTable.id),
          eq(ingredientsTranslations.language, locale)
        )
      )
      .where(
        inArray(
          ingredientsTable.sectionId,
          sections.map(({ id }) => id)
        )
      ),
    db
      .select({
        sectionId: instructionsTable.sectionId,
        text: instructionsTranslations.text,
      })
      .from(instructionsTable)
      .innerJoin(
        instructionsTranslations,
        and(
          eq(instructionsTranslations.instructionId, instructionsTable.id),
          eq(instructionsTranslations.language, locale)
        )
      )
      .where(
        inArray(
          instructionsTable.sectionId,
          sections.map(({ id }) => id)
        )
      ),
  ]);

  return {
    recipes: aggregate([recipes, sections, ingredients, instructions]),
    total,
  };
};

const aggregate = ([recipes, sections, ingredients, instructions]: [
  Recipe[],
  Section[],
  Ingredient[],
  Instruction[]
]) =>
  recipes.map((recipe) => ({
    ...recipe,
    sections: sections
      .filter((section) => section.recipeId === recipe.id)
      .map((section) => ({
        id: section.id,
        name: section.name,
        ingredients: ingredients
          .filter((ingredient) => ingredient.sectionId === section.id)
          .map((ingredient) => ({
            name: ingredient.name,
            unit: ingredient.unit,
            amount: ingredient.amount,
          })),
        instructions: instructions
          .filter((instruction) => instruction.sectionId === section.id)
          .map((instruction) => ({
            text: instruction.text,
          })),
      })),
  }));

export default recipes;
