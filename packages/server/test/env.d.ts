declare module 'cloudflare:test' {
  interface ProvidedEnv {
    ENV: 'test';
    DB: D1Database;
    MIGRATIONS: D1Migration[];
  }
}
