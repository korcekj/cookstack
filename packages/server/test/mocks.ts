import type { CloudinaryResponse } from '../src/types';

import { resend } from '../src/services/email';
import { cloudinary } from '../src/services/image';

export const executionCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
};

export const emailSend = vi.spyOn(resend, 'send').mockResolvedValue(true);

export const imageUpload = vi.spyOn(cloudinary, 'upload').mockResolvedValue({
  eager: [
    {
      secure_url: 'https://mock-cloudinary.com/test.jpg',
    },
  ],
} as CloudinaryResponse);
