import type { Env } from '../types';

import { Hono } from 'hono';
import { verifyAuth } from '../middlewares/auth';

const user = new Hono<Env>();
const profile = new Hono<Env>();

profile.get('/', async (c) => {
  const user = c.get('user');
  return c.json({ user });
});

user.use(verifyAuth);
user.route('/profile', profile);

export default user;
