declare module 'cloudflare:test' {
  interface ProvidedEnv {
    DB: D1Database;
    MIGRATIONS: D1Migration[];
  }
}
