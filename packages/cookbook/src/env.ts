import { z } from '@cs/utils/zod';
import { createEnv } from '@t3-oss/env-nextjs';
import { vercel } from '@t3-oss/env-core/presets';

export const env = createEnv({
  server: {},
  client: {
    NEXT_PUBLIC_BASE_URL: z.string().url(),
    NEXT_PUBLIC_AUTH_URL: z.string().url(),
  },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_AUTH_URL: process.env.NEXT_PUBLIC_AUTH_URL,
  },
  extends: [vercel()],
});
