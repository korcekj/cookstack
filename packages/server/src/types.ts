import type { User, Session } from 'lucia';

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
  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
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

export type CloudinaryConfig = {
  resourceType?: 'auto' | 'image' | 'video';
  cloudName: string;
  apiKey: string;
  apiSecret: string;
};

export type CloudinaryOptions = {
  publicId: string;
  uploadPreset?: string;
  eager?: string;
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
