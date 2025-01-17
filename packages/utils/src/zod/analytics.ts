import { z } from 'zod';
import { objectEntries } from '../index';

const SENSITIVE_FIELDS = [
  // Authentication & Security
  'password',
  'passwordConfirm',
  // Personal Information
  'email',
  'firstName',
  'lastName',
  // Media & URLs containing personal info
  'imageUrl',
  'state',
  'token',
  'code',
];

export const sanitizeObjectSchema = z
  .object({})
  .passthrough()
  .transform(data => {
    if (data) {
      Object.keys(data).forEach(key => {
        if (SENSITIVE_FIELDS.includes(key)) {
          delete data[key];
        }
      });
    }

    return data;
  });

export const sanitizeUrlSchema = z
  .object({ url: z.string(), route: z.string() })
  .transform(({ url, route }) => {
    const base = new URL(url);
    const segments1 = base.pathname.split('/');
    const segments2 = route.split('/');

    if (segments1.length !== segments2.length) return url;

    base.pathname = segments2
      .map((segment, index) => {
        if (SENSITIVE_FIELDS.includes(segment.replace(':', ''))) return segment;
        return segments1[index];
      })
      .join('/');

    return base.toString();
  });

export const sanitizeQuerySchema = z.string().transform(query => {
  return query
    .split('&')
    .filter(Boolean)
    .map(entry => entry.split('='))
    .map(([key, value]) => {
      if (SENSITIVE_FIELDS.includes(key)) return `${key}=:${key}`;
      return `${key}=${value}`;
    })
    .join('&');
});
