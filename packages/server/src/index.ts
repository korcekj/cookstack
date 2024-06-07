import type { Env } from './types';
import type { Context } from 'hono';

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { csrf } from 'hono/csrf';
import { logger } from 'hono/logger';

import auth from './routes/auth';
import user from './routes/user';
import { handleAuth } from './middlewares/auth';
import { i18n, i18nZod } from './middlewares/i18n';

const app = new Hono<Env>();

app.use(logger());

app.use(i18n);
app.use(i18nZod);

app.use(
  csrf({
    origin: (origin, c: Context<Env>) =>
      c.env.ENV === 'dev'
        ? /^https?:\/\/localhost(:\d+)?$/.test(origin)
        : origin.endsWith('korcek.com'),
  })
);
app.use(
  cors({
    origin: (origin, c: Context<Env>) =>
      c.env.ENV === 'dev'
        ? origin.startsWith('http://localhost')
          ? origin
          : null
        : origin.endsWith('korcek.com')
        ? origin
        : null,
    credentials: true,
  })
);

const api = app.basePath('/api');

api.use('*', handleAuth);
api.route('/auth', auth);
api.route('/user', user);

app.route('/', api);

export default app;
