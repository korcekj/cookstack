import type { User, Session } from 'lucia';
import type {
  Recipe as R,
  RecipeTranslation as RT,
  Category as C,
  CategoryTranslation as CT,
  Section as S,
  SectionTranslation as ST,
  Ingredient as I1,
  IngredientTranslation as I1T,
  Instruction as I2,
  InstructionTranslation as I2T,
} from './db/schema';

export type Bindings = {
  DB: D1Database;
  ENV: string;
  BASE_URL: string;
  SALT: string;
  RESEND_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
};

export type Variables = {
  user: User | null;
  session: Session | null;
};

export type Env = { Bindings: Bindings; Variables: Variables };

export type GoogleUser = {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  locale: string;
};

export enum Provider {
  Google = 'Google',
}

export type Email = {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
};

export type Recipe = Partial<R> & {
  name: RT['name'];
  slug: RT['slug'];
  category: Category;
};

export type Category = Partial<C> & {
  name: CT['name'];
  slug: CT['slug'];
};

export type Section = Partial<S> & {
  id: S['id'];
  name: ST['name'];
  recipeId: S['recipeId'];
};

export type Ingredient = Partial<I1> & {
  sectionId: I1['sectionId'];
  name: I1T['name'];
  unit: I1T['unit'];
  amount: I1T['amount'];
};

export type Instruction = Partial<I2> & {
  sectionId: I2['sectionId'];
  text: I2T['text'];
};
