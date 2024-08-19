import type {
  Env,
  CloudinaryConfig,
  CloudinaryOptions,
  CloudinaryResponse,
  CloudinaryTransformation,
} from '../types';
import { Context } from 'hono';

import { snakeCaseifyKeys } from '@cs/utils';
import { sha256, combineEntries } from '../utils';

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
  async fetch(imageUrl: string | URL, options: CloudinaryTransformation = {}) {
    const { cloudName, resourceType } = this.config;

    const transformations = combineEntries(Object.entries(options), '_', ',');
    const paths = [cloudName, resourceType, 'fetch', transformations, imageUrl];
    const url = new URL(paths.filter(Boolean).join('/'), this.fetchUrl);

    const response = await fetch(url);
    if (!response.ok) throw new Error(response.statusText);

    return response.clone();
  },
  async upload(file: File, options: CloudinaryOptions) {
    const { cloudName, resourceType, apiKey } = this.config;
    const { publicId, folder, uploadPreset, eager } = options;

    const url = new URL(
      `v1_1/${cloudName}/${resourceType}/upload`,
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
    if (folder) formData.append('folder', folder);
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

    const hash = sha256(value);
    return { timestamp, hash };
  },
  combine<T extends object>(obj: T) {
    const snakeCasefied = snakeCaseifyKeys(obj);
    return combineEntries(Object.entries(snakeCasefied), '=', '&');
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
