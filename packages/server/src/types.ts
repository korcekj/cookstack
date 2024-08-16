import type { User, Session } from 'lucia';

export type Bindings = {
  DB: D1Database;
  BUCKET: R2Bucket;
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
