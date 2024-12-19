import type {
  GetRecipeInput,
  GetRecipesInput,
  GetSectionInput,
  GetCategoryInput,
  GetCategoriesInput,
  GetRoleRequestInput,
  GetRoleRequestsInput,
  RecipesOrderByColumns,
  CategoriesOrderByColumns,
  RoleRequestsOrderByColumns,
} from '@cs/utils/zod';
import type { Context } from 'hono';
import type { Env, Prettify } from '../../types';

import {
  users,
  roleRequests,
  recipesTranslations,
  sectionsTranslations,
  categoriesTranslations,
  ingredientsTranslations,
  instructionsTranslations,
  recipes as recipesTable,
  sections as sectionsTable,
  categories as categoriesTable,
  ingredients as ingredientsTable,
  instructions as instructionsTable,
} from './schema';
import { initializeDB } from '.';
import { getOrderByClauses } from './utils';
import { getTableColumns, sql, count, eq, and, asc } from 'drizzle-orm';

export const useCategory = (c: Context<Env>, options: GetCategoryInput) => {
  const { locale } = c.get('i18n');

  const db = initializeDB(c.env.DB);

  return db
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
        eq(categoriesTranslations.language, locale()),
      ),
    )
    .where(eq(categoriesTable.id, options.categoryId))
    .limit(1);
};

export const useCategories = async (
  c: Context<Env>,
  options: GetCategoryInput | GetCategoriesInput,
) => {
  const { locale } = c.get('i18n');

  const whereClauses = [
    'categoryId' in options
      ? eq(categoriesTable.id, options.categoryId)
      : undefined,
  ];

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
        eq(categoriesTranslations.language, locale()),
      ),
    )
    .where(and(...whereClauses));

  const totalQuery = db
    .select({ total: count() })
    .from(categoriesTable)
    .where(and(...whereClauses));

  if ('orderBy' in options) {
    const orderByClauses = getOrderByClauses<CategoriesOrderByColumns>(
      options.orderBy,
      value => {
        switch (value) {
          case 'name':
            return categoriesTranslations.name;
          default:
            throw new Error(`Invalid column name: ${value}`);
        }
      },
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

export const useRecipe = (c: Context<Env>, options: GetRecipeInput) => {
  const { locale } = c.get('i18n');

  const db = initializeDB(c.env.DB);

  return db
    .select({
      id: sql`${recipesTable.id}`.mapWith(recipesTable.id).as('r_id'),
      imageUrl: recipesTable.imageUrl,
      preparation: recipesTable.preparation,
      cook: recipesTable.cook,
      total: recipesTable.total,
      yield: recipesTable.yield,
      name: sql`${recipesTranslations.name}`
        .mapWith(recipesTranslations.name)
        .as('rt_name'),
      slug: sql`${recipesTranslations.slug}`
        .mapWith(recipesTranslations.slug)
        .as('rt_slug'),
      description: recipesTranslations.description,
      category: {
        id: categoriesTable.id,
        name: categoriesTranslations.name,
        slug: categoriesTranslations.slug,
        createdAt: categoriesTable.createdAt,
        updatedAt: categoriesTable.updatedAt,
      },
      createdAt: sql`${recipesTable.createdAt}`
        .mapWith(recipesTable.createdAt)
        .as('r_created_at'),
      updatedAt: sql`${recipesTable.updatedAt}`
        .mapWith(recipesTable.updatedAt)
        .as('r_updated_at'),
    })
    .from(recipesTable)
    .innerJoin(
      recipesTranslations,
      and(
        eq(recipesTranslations.recipeId, recipesTable.id),
        eq(recipesTranslations.language, locale()),
      ),
    )
    .innerJoin(categoriesTable, eq(categoriesTable.id, recipesTable.categoryId))
    .innerJoin(
      categoriesTranslations,
      and(
        eq(categoriesTranslations.categoryId, recipesTable.categoryId),
        eq(categoriesTranslations.language, locale()),
      ),
    )
    .where(eq(recipesTable.id, options.recipeId))
    .limit(1);
};

export const useRecipes = async (
  c: Context<Env>,
  options: GetRecipeInput | GetRecipesInput | GetCategoryInput,
) => {
  const { locale } = c.get('i18n');

  const db = initializeDB(c.env.DB);

  const whereClauses = [
    'recipeId' in options ? eq(recipesTable.id, options.recipeId) : undefined,
    'categoryId' in options
      ? eq(recipesTable.categoryId, options.categoryId)
      : undefined,
  ];

  const recipesQuery = db
    .select({
      id: sql`${recipesTable.id}`.mapWith(recipesTable.id).as('r_id'),
      imageUrl: recipesTable.imageUrl,
      preparation: recipesTable.preparation,
      cook: recipesTable.cook,
      total: recipesTable.total,
      yield: recipesTable.yield,
      name: sql`${recipesTranslations.name}`
        .mapWith(recipesTranslations.name)
        .as('rt_name'),
      slug: sql`${recipesTranslations.slug}`
        .mapWith(recipesTranslations.slug)
        .as('rt_slug'),
      description: recipesTranslations.description,
      category: {
        id: categoriesTable.id,
        name: categoriesTranslations.name,
        slug: categoriesTranslations.slug,
        createdAt: categoriesTable.createdAt,
        updatedAt: categoriesTable.updatedAt,
      },
      createdAt: sql`${recipesTable.createdAt}`
        .mapWith(recipesTable.createdAt)
        .as('r_created_at'),
      updatedAt: sql`${recipesTable.updatedAt}`
        .mapWith(recipesTable.updatedAt)
        .as('r_updated_at'),
    })
    .from(recipesTable)
    .innerJoin(
      recipesTranslations,
      and(
        eq(recipesTranslations.recipeId, recipesTable.id),
        eq(recipesTranslations.language, locale()),
      ),
    )
    .innerJoin(categoriesTable, eq(categoriesTable.id, recipesTable.categoryId))
    .innerJoin(
      categoriesTranslations,
      and(
        eq(categoriesTranslations.categoryId, recipesTable.categoryId),
        eq(categoriesTranslations.language, locale()),
      ),
    )
    .where(and(...whereClauses));

  const totalQuery = db
    .select({ total: count() })
    .from(recipesTable)
    .where(and(...whereClauses));

  if ('orderBy' in options) {
    const orderByClauses = getOrderByClauses<RecipesOrderByColumns>(
      options.orderBy,
      value => {
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
      },
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

export const useSections = (c: Context<Env>, options: GetRecipeInput) => {
  const { locale } = c.get('i18n');

  const db = initializeDB(c.env.DB);

  return db
    .select({
      id: sectionsTable.id,
      name: sectionsTranslations.name,
      position: sectionsTable.position,
    })
    .from(sectionsTable)
    .innerJoin(
      sectionsTranslations,
      and(
        eq(sectionsTranslations.sectionId, sectionsTable.id),
        eq(sectionsTranslations.language, locale()),
      ),
    )
    .where(eq(sectionsTable.recipeId, options.recipeId))
    .orderBy(asc(sectionsTable.position));
};

export const useIngredients = (c: Context<Env>, options: GetSectionInput) => {
  const { locale } = c.get('i18n');

  const db = initializeDB(c.env.DB);

  return db
    .select({
      id: ingredientsTable.id,
      name: ingredientsTranslations.name,
      unit: ingredientsTranslations.unit,
      amount: ingredientsTranslations.amount,
      position: ingredientsTable.position,
    })
    .from(ingredientsTable)
    .innerJoin(
      ingredientsTranslations,
      and(
        eq(ingredientsTranslations.ingredientId, ingredientsTable.id),
        eq(ingredientsTranslations.language, locale()),
      ),
    )
    .where(eq(ingredientsTable.sectionId, options.sectionId))
    .orderBy(asc(ingredientsTable.position));
};

export const useInstructions = (c: Context<Env>, options: GetSectionInput) => {
  const { locale } = c.get('i18n');

  const db = initializeDB(c.env.DB);

  return db
    .select({
      id: instructionsTable.id,
      text: instructionsTranslations.text,
      position: instructionsTable.position,
    })
    .from(instructionsTable)
    .innerJoin(
      instructionsTranslations,
      and(
        eq(instructionsTranslations.instructionId, instructionsTable.id),
        eq(instructionsTranslations.language, locale()),
      ),
    )
    .where(eq(instructionsTable.sectionId, options.sectionId))
    .orderBy(asc(instructionsTable.position));
};

export const useRoleRequests = async (
  c: Context<Env>,
  options:
    | GetRoleRequestInput
    | Prettify<GetRoleRequestsInput & { userId?: string }>,
) => {
  const db = initializeDB(c.env.DB);

  const whereClauses = [
    'status' in options ? eq(roleRequests.status, options.status) : undefined,
    'userId' in options ? eq(roleRequests.userId, options.userId!) : undefined,
    'requestId' in options ? eq(roleRequests.id, options.requestId) : undefined,
  ];

  const { hashedPassword, ...columns } = getTableColumns(users);

  const requestsQuery = db
    .select({
      id: sql`${roleRequests.id}`.mapWith(roleRequests.id).as('r_id'),
      role: sql`${roleRequests.role}`.mapWith(roleRequests.role).as('r_role'),
      ...('userId' in options ? {} : { user: columns }),
      status: roleRequests.status,
      createdAt: sql`${roleRequests.createdAt}`
        .mapWith(roleRequests.updatedAt)
        .as('r_created_at'),
      updatedAt: sql`${roleRequests.updatedAt}`
        .mapWith(roleRequests.updatedAt)
        .as('r_updated_at'),
    })
    .from(roleRequests)
    .innerJoin(users, eq(roleRequests.userId, users.id))
    .where(and(...whereClauses));

  const totalQuery = db
    .select({ total: count() })
    .from(roleRequests)
    .where(and(...whereClauses));

  if ('orderBy' in options) {
    console.log({ orderBy: options.orderBy });
    const orderByClauses = getOrderByClauses<RoleRequestsOrderByColumns>(
      options.orderBy,
      value => {
        switch (value) {
          case 'role':
            return roleRequests.role;
          case 'createdAt':
            return roleRequests.createdAt;
          default:
            throw new Error(`Invalid column name: ${value}`);
        }
      },
    );
    requestsQuery.$dynamic().orderBy(...orderByClauses);
  }

  if ('limit' in options && 'offset' in options) {
    requestsQuery.$dynamic().limit(options.limit).offset(options.offset);
  }

  const [requests, [{ total: total }]] = await db.batch([
    requestsQuery,
    totalQuery,
  ]);

  return { requests, total };
};
