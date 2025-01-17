import type { SQL } from 'drizzle-orm';

import { sql } from 'drizzle-orm';
import {
  text,
  real,
  index,
  integer,
  primaryKey,
  uniqueIndex,
  sqliteTable,
} from 'drizzle-orm/sqlite-core';

export const users = sqliteTable('users', {
  id: text('id').notNull().primaryKey(),
  slug: text('slug').notNull().unique(),
  email: text('email').notNull().unique(),
  emailVerified: integer('email_verified', { mode: 'boolean' })
    .default(false)
    .notNull(),
  hashedPassword: text('hashed_password'),
  firstName: text('first_name'),
  lastName: text('last_name'),
  imageUrl: text('image_url'),
  role: text('role', { enum: ['user', 'author', 'admin'] })
    .default('user')
    .notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type User = typeof users.$inferSelect;

export const sessions = sqliteTable('sessions', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at').notNull(),
});

export const oauthAccounts = sqliteTable(
  'oauth_accounts',
  {
    providerId: text('provider_id').notNull(),
    providerUserId: text('provider_user_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  t => ({
    pk: primaryKey({ columns: [t.providerId, t.providerUserId] }),
  }),
);

export const emailVerificationCodes = sqliteTable('email_verification_codes', {
  id: text('id').notNull().primaryKey(),
  code: text('code').notNull(),
  email: text('email').notNull(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
});

export const passwordResetTokens = sqliteTable(
  'password_reset_tokens',
  {
    hashedToken: text('hashedToken').notNull().unique(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  },
  t => ({
    userIdx: index('password_reset_tokens_user_idx').on(t.userId),
  }),
);

export const roleRequests = sqliteTable(
  'role_requests',
  {
    id: text('id').notNull().primaryKey(),
    role: text('role', { enum: ['user', 'author', 'admin'] }).notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    status: text('status', {
      enum: ['pending', 'approved', 'rejected'],
    })
      .default('pending')
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  t => ({
    unq: uniqueIndex('role_requests_unq')
      .on(t.role, t.userId)
      .where(sql`${t.status} = 'pending'`),
  }),
);

export const categories = sqliteTable('categories', {
  id: text('id').notNull().primaryKey(),
  createdAt: integer('created_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
  updatedAt: integer('updated_at', { mode: 'timestamp' })
    .default(sql`(strftime('%s', 'now'))`)
    .notNull(),
});

export type Category = typeof categories.$inferSelect;

export const categoriesTranslations = sqliteTable(
  'categories_translations',
  {
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id, { onDelete: 'cascade' }),
    language: text('language', { length: 2 }).notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.categoryId, t.language] }),
    unq: uniqueIndex('categories_translations_unq').on(t.slug, t.language),
  }),
);

export const recipes = sqliteTable(
  'recipes',
  {
    id: text('id').notNull().primaryKey(),
    imageUrl: text('image_url'),
    preparation: integer('preparation').notNull(),
    cook: integer('cook').notNull(),
    total: integer('total')
      .generatedAlwaysAs(
        (): SQL => sql`${recipes.preparation} + ${recipes.cook}`,
        { mode: 'virtual' },
      )
      .notNull(),
    yield: integer('yield').notNull(),
    userId: text('user_id').references(() => users.id, {
      onDelete: 'set null',
    }),
    categoryId: text('category_id')
      .notNull()
      .references(() => categories.id),
    status: text('status', {
      enum: ['draft', 'published'],
    })
      .default('draft')
      .notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  t => ({
    userIdx: index('recipes_user_idx').on(t.userId),
    categoryIdx: index('recipes_category_idx').on(t.categoryId),
  }),
);

export type Recipe = typeof recipes.$inferSelect;

export const recipesTranslations = sqliteTable(
  'recipes_translations',
  {
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    recipeId: text('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    language: text('language', { length: 2 }).notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.recipeId, t.language] }),
    nameIdx: index('recipes_translations_name_idx').on(t.name),
  }),
);

export const recipesFavorites = sqliteTable(
  'recipes_favorites',
  {
    userId: text('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    recipeId: text('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .default(sql`(strftime('%s', 'now'))`)
      .notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.userId, t.recipeId] }),
  }),
);

export const sections = sqliteTable(
  'sections',
  {
    id: text('id').notNull().primaryKey(),
    position: integer('position').default(0).notNull(),
    recipeId: text('recipe_id')
      .notNull()
      .references(() => recipes.id, { onDelete: 'cascade' }),
  },
  t => ({
    unq: uniqueIndex('sections_unq').on(t.recipeId, t.position),
  }),
);

export type Section = typeof sections.$inferSelect;

export const sectionsTranslations = sqliteTable(
  'sections_translations',
  {
    name: text('name').notNull(),
    sectionId: text('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
    language: text('language', { length: 2 }).notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.sectionId, t.language] }),
  }),
);

export const ingredients = sqliteTable(
  'ingredients',
  {
    id: text('id').notNull().primaryKey(),
    position: integer('position').default(0).notNull(),
    sectionId: text('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
  },
  t => ({
    unq: uniqueIndex('ingredients_unq').on(t.sectionId, t.position),
  }),
);

export type Ingredient = typeof ingredients.$inferSelect;

export const ingredientsTranslations = sqliteTable(
  'ingredients_translations',
  {
    name: text('name').notNull(),
    unit: text('unit'),
    amount: real('amount'),
    ingredientId: text('ingredient_id')
      .notNull()
      .references(() => ingredients.id, { onDelete: 'cascade' }),
    language: text('language', { length: 2 }).notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.ingredientId, t.language] }),
  }),
);

export const instructions = sqliteTable(
  'instructions',
  {
    id: text('id').notNull().primaryKey(),
    position: integer('position').default(0).notNull(),
    sectionId: text('section_id')
      .notNull()
      .references(() => sections.id, { onDelete: 'cascade' }),
  },
  t => ({
    unq: uniqueIndex('instructions_unq').on(t.sectionId, t.position),
  }),
);

export type Instruction = typeof instructions.$inferSelect;

export const instructionsTranslations = sqliteTable(
  'instructions_translations',
  {
    text: text('text').notNull(),
    instructionId: text('step_id')
      .notNull()
      .references(() => instructions.id, { onDelete: 'cascade' }),
    language: text('language', { length: 2 }).notNull(),
  },
  t => ({
    pk: primaryKey({ columns: [t.instructionId, t.language] }),
  }),
);
