import type { Context } from 'hono';
import type { Env, Email, ResendConfig } from '../../types';

import { Resend } from 'resend';
import * as templates from './templates';
import { objectEntries } from '@cs/utils';

export const resend = {
  config: {} as ResendConfig,
  instance: new Resend('re_123'),
  templates: {} as Record<keyof typeof templates, (...args: any[]) => string>,
  configure(config: ResendConfig) {
    this.instance = new Resend(config.apiKey);
    this.config = {
      ...this.config,
      ...config,
    };
    return this;
  },
  async send(email: Email) {
    try {
      await this.instance.emails.send({
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
