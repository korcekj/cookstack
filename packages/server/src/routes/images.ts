import type { Env } from '../types';

import { Hono } from 'hono';
import { useTranslation } from '@intlify/hono';
import { getImageSchema } from '@cs/utils/zod';
import { validator } from '../middlewares/validation';

const images = new Hono<Env>();

images.get('/:imageId', validator('param', getImageSchema), async (c) => {
  const t = useTranslation(c);
  const { imageId } = c.req.valid('param');

  const object = await c.env.BUCKET.get(imageId);
  if (!object) {
    return c.json({ error: t('image.notFound') }, 404);
  }

  c.header('etag', object.httpEtag);
  c.header('content-type', object.httpMetadata?.contentType);

  return c.body(object.body, 200);
});

export default images;
