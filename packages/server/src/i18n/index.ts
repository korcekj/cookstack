import rosetta from 'rosetta';

import en from '../i18n/messages/en';
import sk from '../i18n/messages/sk';

export const DEFAULT_LOCALE = 'en';
export const LOCALES = ['en', 'sk'];

export type TranslationKeys = typeof en;

export const translation = rosetta<TranslationKeys>();

translation.set('en', en);
translation.set('sk', sk);

export type Translation = typeof translation;
