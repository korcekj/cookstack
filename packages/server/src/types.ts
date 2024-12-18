import type { Translation } from './i18n';
import type { User, Session } from '@cs/utils/zod';

export type Prettify<T> = {
  [K in keyof T]: T[K];
} & {};

export type Bindings = {
  DB: D1Database;
  ENV: 'test' | 'dev' | 'production';
  BASE_URL: string;
  SENTRY_DSN: string;
  RESEND_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GOOGLE_CLIENT_SECRET: string;
  GOOGLE_REDIRECT_URL: string;
  UPSTASH_REDIS_REST_URL: string;
  UPSTASH_REDIS_REST_TOKEN: string;
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
  CF_VERSION_METADATA: WorkerVersionMetadata;
};

export type Variables = {
  i18n: Translation;
  user: User | null;
  session: Session | null;
};

export type Env = { Bindings: Bindings; Variables: Variables };

export enum Provider {
  Google = 'Google',
}

export type AuthConfig = {
  bindings: Pick<
    Bindings,
    | 'DB'
    | 'ENV'
    | 'GOOGLE_REDIRECT_URL'
    | 'GOOGLE_CLIENT_ID'
    | 'GOOGLE_CLIENT_SECRET'
  >;
  url: string;
};

export type Email = {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
  bcc?: string | string[];
  headers?: Record<string, string>;
};

export type ResendConfig = {
  apiKey: string;
};

export type CloudinaryConfig = {
  resourceType?: 'auto' | 'image' | 'video';
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type CloudinaryOptions = {
  publicId: string;
  folder?: string;
  eager?: string;
  uploadPreset?: string;
};

export type CloudinaryResponse = {
  asset_id: string;
  public_id: string;
  version: number;
  version_id: string;
  signature: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
  created_at: string;
  bytes: number;
  type: string;
  etag: string;
  placeholder: boolean;
  url: string;
  secure_url: string;
  folder: string;
  access_mode: string;
  original_filename: string;
  original_extension: string;
  eager: {
    transformation: string;
    width: number;
    height: number;
    bytes: number;
    format: string;
    url: string;
    secure_url: string;
  }[];
};

export type CloudinaryTransformation = {
  t?: string;
  w?: number | 'auto';
  h?: number;
  q?: number | 'auto';
  c?: string;
  f?: string;
  o?: number;
  g?: string;
};
