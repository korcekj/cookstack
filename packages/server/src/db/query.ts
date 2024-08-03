import type {
  RecipeTranslation,
  CategoryTranslation,
  Recipe as RecipeTable,
} from '../db/schema';
import type {
  GetRecipeInput,
  GetRecipesInput,
  GetCategoryInput,
  GetCategoriesInput,
  RecipesOrderByColumns,
  CategoriesOrderByColumns,
} from '@cs/utils/zod';
import type { Context } from 'hono';
import type { Env } from '../types';

import {
  recipesTranslations,
  categoriesTranslations,
  recipes as recipesTable,
  categories as categoriesTable,
} from '../db/schema';
import { getLocale } from '../utils';
import { sql, count, eq, and } from 'drizzle-orm';
import { initializeDB, getOrderByClauses } from '../db';

export const useCategories = async (
  c: Context<Env>,
  options: GetCategoryInput | GetCategoriesInput
) => {
  const locale = getLocale(c);

  const db = initializeDB(c.env.DB);

  const categoriesQuery = db
    .select({
      id: categoriesTable.id,
      name: categoriesTranslations.name,
      slug: categoriesTranslations.slug,
      createdAt: categoriesTable.createdAt,
      updatedAt: categoriesTable.updatedAt,
    })
    .from(categoriesTable)
    .innerJoin(
      categoriesTranslations,
      and(
        eq(categoriesTranslations.categoryId, categoriesTable.id),
        eq(categoriesTranslations.language, locale)
      )
    );
  const totalQuery = db.select({ total: count() }).from(categoriesTable);

  if ('categoryId' in options) {
    categoriesQuery
      .$dynamic()
      .where(eq(categoriesTable.id, options.categoryId));
    totalQuery.$dynamic().where(eq(categoriesTable.id, options.categoryId));
  }

  if ('orderBy' in options) {
    const orderByClauses = getOrderByClauses<CategoriesOrderByColumns>(
      options.orderBy,
      (value) => {
        switch (value) {
          case 'name':
            return categoriesTranslations.name;
          default:
            throw new Error(`Invalid column name: ${value}`);
        }
      }
    );
    categoriesQuery.$dynamic().orderBy(...orderByClauses);
  }

  if ('limit' in options && 'offset' in options) {
    categoriesQuery.$dynamic().limit(options.limit).offset(options.offset);
  }

  const [categories, [{ total }]] = await db.batch([
    categoriesQuery,
    totalQuery,
  ]);

  return { categories, total };
};

export const useRecipes = async (
  c: Context<Env>,
  options: GetRecipeInput | GetRecipesInput | GetCategoryInput
) => {
  const locale = getLocale(c);

  const db = initializeDB(c.env.DB);

  const recipesQuery = db
    .select({
      id: sql<RecipeTable['id']>`${recipesTable.id}`.as('r_id'),
      image: recipesTable.imageUrl,
      preparation: recipesTable.preparation,
      cook: recipesTable.cook,
      total: recipesTable.total,
      yield: recipesTable.yield,
      name: sql<RecipeTranslation['name']>`${recipesTranslations.name}`.as(
        'rt_name'
      ),
      slug: sql<RecipeTranslation['slug']>`${recipesTranslations.slug}`.as(
        'rt_slug'
      ),
      description: recipesTranslations.description,
      category: {
        id: sql<RecipeTable['categoryId']>`${recipesTable.categoryId}`.as(
          'c_id'
        ),
        name: sql<
          CategoryTranslation['name']
        >`${categoriesTranslations.name}`.as('ct_name'),
        slug: sql<
          CategoryTranslation['slug']
        >`${categoriesTranslations.slug}`.as('ct_slug'),
      },
      createdAt: recipesTable.createdAt,
      updatedAt: recipesTable.updatedAt,
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
  const totalQuery = db.select({ total: count() }).from(recipesTable);

  if ('recipeId' in options) {
    recipesQuery.$dynamic().where(eq(recipesTable.id, options.recipeId));
    totalQuery.$dynamic().where(eq(recipesTable.id, options.recipeId));
  }

  if ('categoryId' in options) {
    recipesQuery
      .$dynamic()
      .where(eq(recipesTable.categoryId, options.categoryId));
    totalQuery
      .$dynamic()
      .where(eq(recipesTable.categoryId, options.categoryId));
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

    recipesQuery.$dynamic().orderBy(...orderByClauses);
  }

  if ('limit' in options && 'offset' in options) {
    recipesQuery.$dynamic().limit(options.limit).offset(options.offset);
  }

  const [recipes, [{ total: total }]] = await db.batch([
    recipesQuery,
    totalQuery,
  ]);

  return { recipes, total };
};
