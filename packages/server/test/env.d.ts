declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    MIGRATIONS: D1Migration[];
    AUTH_AUTHOR_TOKEN: string;
  }
}
