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
import type { SQLiteTable } from 'drizzle-orm/sqlite-core';

import {
  recipesTranslations,
  categoriesTranslations,
  recipes as recipesTable,
  categories as categoriesTable,
} from '../db/schema';
import { getLocale } from '../utils';
import { sql, count, eq, and } from 'drizzle-orm';
import { initializeDB, getOrderByClauses } from '../db';

export const useTotalCount = async (c: Context<Env>, table: SQLiteTable) => {
  const db = initializeDB(c.env.DB);

  const [{ count: total }] = await db.select({ count: count() }).from(table);

  return total;
};

export const useCategories = async (
  c: Context<Env>,
  options: GetCategoryInput | GetCategoriesInput
) => {
  const locale = getLocale(c);

  const db = initializeDB(c.env.DB);

  const query = db
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

  if ('categoryId' in options) {
    query.$dynamic().where(eq(categoriesTable.id, options.categoryId));
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
    query.$dynamic().orderBy(...orderByClauses);
  }

  if ('limit' in options && 'offset' in options) {
    query.$dynamic().limit(options.limit).offset(options.offset);
  }

  const [categories, [{ count: total }]] = await db.batch([
    query,
    db.select({ count: count() }).from(categoriesTable),
  ]);

  return { categories, total };
};

export const useRecipes = async (
  c: Context<Env>,
  options: GetRecipeInput | GetRecipesInput | GetCategoryInput
) => {
  const locale = getLocale(c);

  const db = initializeDB(c.env.DB);

  const query = db
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

  if ('recipeId' in options) {
    query.$dynamic().where(eq(recipesTable.id, options.recipeId));
  }

  if ('categoryId' in options) {
    query.$dynamic().where(eq(recipesTable.categoryId, options.categoryId));
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

  return { recipes, total };
};
