import type { Context } from 'hono';
import type { Env, Email } from '../types';

import { Resend } from 'resend';
import { html } from 'hono/html';
import { useTranslation } from '@intlify/hono';

export const sendEmail = async (c: Context<Env>, email: Email) => {
  try {
    const resend = new Resend(c.env.RESEND_API_KEY);
    await resend.emails.send({
      from: 'CookStack <cookstack@korcek.com>',
      ...email,
    });
    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
};

export const verificationCodeTemplate = (
  c: Context<Env>,
  props: { code: string }
) => {
  const t = useTranslation(c);
  return html`
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

export const resetPasswordTemplate = (
  c: Context<Env>,
  props: { link: string }
) => {
  const t = useTranslation(c);
  return html`
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
