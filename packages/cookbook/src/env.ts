import { z } from '@cs/utils/zod';
import { createEnv } from '@t3-oss/env-nextjs';
import { vercel } from '@t3-oss/env-core/presets';

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_SERVER_URL: z.string().url(),
    NEXT_PUBLIC_COOKIE_NAME: z.string(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL,
    NEXT_PUBLIC_COOKIE_NAME: process.env.NEXT_PUBLIC_COOKIE_NAME,
  },
  extends: [vercel()],
});
