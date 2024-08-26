import type { Env } from '../types';

import { Hono } from 'hono';
import { cache } from 'hono/cache';
import { initializeDB } from '../db';
import { useTranslation } from '@intlify/hono';
import { validator } from '../middlewares/validation';
import { initializeCloudinary } from '../services/image';
import { getImageParamSchema, getImageQuerySchema } from '@cs/utils/zod';

const images = new Hono<Env>();

images.get(
  '/:imageId',
  cache({
    cacheName: 'images',
    cacheControl: `max-age=${60 * 60 * 24 * 7}`,
  }),
  validator('param', getImageParamSchema),
  validator('query', getImageQuerySchema),
  async (c) => {
    const t = useTranslation(c);
    const query = c.req.valid('query');
    const { imageId } = c.req.valid('param');

    const db = initializeDB(c.env.DB);
    const cloudinary = initializeCloudinary(c);

    const image = await db.query.images.findFirst({
      where: (t, { eq }) => eq(t.id, imageId),
    });

    let externalUrl = image?.externalUrl;
    if (!externalUrl) {
      externalUrl = cloudinary.url(imageId).toString();
    }

    const response = await cloudinary.fetch(externalUrl, query);
    if (!response.ok) return c.json({ error: t('image.notFound') }, 404);

    const { body, headers } = response;

    c.header('content-type', headers.get('content-type')!);
    c.header('etag', headers.get('etag')!);

    // @ts-expect-error
    return c.body(body, 200);
  }
);

export default images;
