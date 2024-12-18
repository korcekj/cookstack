import type { Context } from 'hono';
import type { Env } from '../../types';

import { html } from 'hono/html';

export const verificationCode = (c: Context<Env>) => {
  const { t, locale } = c.get('i18n');
  return (props: { code: string }) =>
    html`
      <html lang="${locale()}">
        <head>
          <title></title>
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

export const passwordReset = (c: Context<Env>) => {
  const { t, locale } = c.get('i18n');
  return (props: { link: string }) =>
    html`
      <html lang="${locale()}">
        <head>
          <title></title>
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
          <h1>${t('emails.passwordReset.heading')}</h1>
          <p>${t('emails.passwordReset.body')}</p>
          <div>
            <a href="${props.link}">${t('emails.passwordReset.button')}</a>
          </div>
        </body>
      </html>
    `.toString();
};

export const roleRequest = (c: Context<Env>) => {
  const { t, locale } = c.get('i18n');
  return (props: { id: string; role: string }) =>
    html`
      <html lang="${locale()}">
        <head>
          <title></title>
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
          <h1>${t('emails.roleRequest.heading')}</h1>
          <p>
            ${t('emails.roleRequest.body', { id: props.id, role: props.role })}
          </p>
        </body>
      </html>
    `.toString();
};

export const roleRequestStatus = (c: Context<Env>) => {
  const { t, locale } = c.get('i18n');
  return (props: { id: string; role: string; status: string }) =>
    html`
      <html lang="${locale()}">
        <head>
          <title></title>
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
          <h1>${t('emails.roleRequestStatus.heading')}</h1>
          <p>
            ${t('emails.roleRequestStatus.body', {
              id: props.id,
              role: props.role,
              status: props.status,
            })}
          </p>
        </body>
      </html>
    `.toString();
};
