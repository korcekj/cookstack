import type { Context } from 'hono';
import type { Env } from '../../types';

import { html } from 'hono/html';
import { useTranslation } from '@intlify/hono';

export const verificationCode = (c: Context<Env>) => {
  const t = useTranslation(c);
  return (props: { code: string }) =>
    html`
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          style="font-size: 1em; font-family: 'Rubik', sans-serif; font-optical-sizing: auto;"
        >
          <h1>${t('emails.verificationCode.heading')}</h1>
          <p>${t('emails.verificationCode.body')}</p>
          <div>
            <b style="font-size: 2em;">${props.code}</b>
          </div>
        </body>
      </html>
    `.toString();
};

export const resetPassword = (c: Context<Env>) => {
  const t = useTranslation(c);
  return (props: { link: string }) =>
    html`
      <html>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
          <link
            href="https://fonts.googleapis.com/css2?family=Rubik:ital,wght@0,300..900;1,300..900&display=swap"
            rel="stylesheet"
          />
        </head>
        <body
          style="font-size: 1em; font-family: 'Rubik', sans-serif; font-optical-sizing: auto;"
        >
          <h1>${t('emails.resetPassword.heading')}</h1>
          <p>${t('emails.resetPassword.body')}</p>
          <div>
            <a href="${props.link}">${t('emails.resetPassword.button')}</a>
          </div>
        </body>
      </html>
    `.toString();
};
