import type { Context } from 'hono';
import type { Env, Email, EmailConfig } from '../../types';

import { Resend } from 'resend';
import * as templates from './templates';
import { objectEntries } from '@cs/utils';

export const resend = {
  config: {} as EmailConfig,
  templates: {} as Record<keyof typeof templates, (...args: any[]) => string>,
  configure(config: EmailConfig) {
    this.config = {
      ...this.config,
      ...config,
    };
    return this;
  },
  async send(email: Email) {
    try {
      const { apiKey } = this.config;
      const resend = new Resend(apiKey);
      await resend.emails.send({
        from: 'CookStack <cookstack@korcek.com>',
        ...email,
      });
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  },
};

export const initializeEmail = (c: Context<Env>) => {
  const instance = resend.configure({
    apiKey: c.env.RESEND_API_KEY,
  });
  objectEntries(templates).forEach(([key, value]) => {
    instance.templates[key] = value(c);
  });
  return instance;
};
