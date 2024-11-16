import type { Env } from './types';
import type { Context } from 'hono';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';
import { HTTPException } from 'hono/http-exception';

import { i18n } from './middlewares/i18n';
import { handleAuth } from './middlewares/auth';

import auth from './routes/auth';
import user from './routes/user';
import recipes from './routes/recipes';
import categories from './routes/categories';

const app = new Hono<Env>();

app.use(logger());

app.use(i18n);

app.use(
  csrf({
    origin: (origin, c: Context<Env>) =>
      c.env.ENV === 'test'
        ? true
        : c.env.ENV === 'dev'
          ? /^https?:\/\/localhost(:\d+)?$/.test(origin)
          : origin.endsWith('korcek.com'),
  }),
);
app.use(
  cors({
    origin: (origin, c: Context<Env>) =>
      c.env.ENV === 'test'
        ? origin
        : c.env.ENV === 'dev'
          ? origin.startsWith('http://localhost')
            ? origin
            : null
          : origin.endsWith('korcek.com')
            ? origin
            : null,
    credentials: true,
  }),
);

const api = app.basePath('/api');

api.use('*', handleAuth);
api.route('/auth', auth);
api.route('/user', user);
api.route('/recipes', recipes);
api.route('/categories', categories);

app.route('/', api);

app.onError((err, c) => {
  const { t } = c.get('i18n');

  if (err instanceof HTTPException) {
    return c.json({ error: err.message }, err.status);
  }

  console.error(err);
  return c.json({ error: t('errors.internalServerError') }, 500);
});

export default app;
