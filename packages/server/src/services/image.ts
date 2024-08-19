import { Context } from 'hono';
import type {
  Env,
  CloudinaryConfig,
  CloudinaryOptions,
  CloudinaryResponse,
} from '../types';

import { createHash } from 'node:crypto';
import { snakeCaseifyKeys } from '@cs/utils';

export const cloudinary = {
  uploadUrl: 'https://api.cloudinary.com',
  fetchUrl: 'https://res.cloudinary.com',
  config: {
    resourceType: 'image',
    cloudName: '',
    apiKey: '',
    apiSecret: '',
  } as CloudinaryConfig,
  configure(config: CloudinaryConfig) {
    this.config = {
      ...this.config,
      ...config,
    };
    return this;
  },
  async fetch(imageUrl: string | URL) {
    const { cloudName, resourceType } = this.config;

    const url = new URL(
      `/${cloudName}/${resourceType}/fetch/${imageUrl}`,
      this.fetchUrl
    );

    console.log({ url });

    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);

    return response.clone();
  },
  async upload(file: File, options: CloudinaryOptions) {
    const { publicId, uploadPreset, eager } = options;
    const { cloudName, resourceType, apiKey } = this.config;

    const url = new URL(
      `/v1_1/${cloudName}/${resourceType}/upload`,
      this.uploadUrl
    );

    const { timestamp, hash } = this.sign(options);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', apiKey);
    formData.append('public_id', publicId);
    formData.append('timestamp', timestamp);
    formData.append('signature', hash);
    if (eager) formData.append('eager', eager);
    if (uploadPreset) formData.append('upload_preset', uploadPreset);

    const response = await fetch(url, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) throw new Error(response.statusText);

    return response.json() as Promise<CloudinaryResponse>;
  },
  sign(options: CloudinaryOptions) {
    const { apiSecret } = this.config;
    const timestamp = Date.now().toString();

    const obj = { ...options, timestamp };
    const sorted = this.sort(obj);
    const value = this.combine(sorted) + apiSecret;

    const hash = createHash('sha256').update(value).digest('hex');
    return { timestamp, hash };
  },
  combine<T extends object>(obj: T) {
    const snakeCasefied = snakeCaseifyKeys(obj);
    return Object.entries(snakeCasefied)
      .map(([key, value]) => `${key}=${value}`)
      .join('&');
  },
  sort<T extends object>(obj: T) {
    return Object.keys(obj)
      .sort()
      .reduce(
        (reducer, acc) => ({ ...reducer, [acc]: obj[acc as keyof T] }),
        {} as T
      );
  },
};

export const initializeCloudinary = (c: Context<Env>) => {
  return cloudinary.configure({
    cloudName: c.env.CLOUDINARY_CLOUD_NAME,
    apiKey: c.env.CLOUDINARY_API_KEY,
    apiSecret: c.env.CLOUDINARY_API_SECRET,
  });
};