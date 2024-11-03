import en from '@cs/utils/zod/locales/en';

const messages = {
  ...en,
  LocaleSwitch: {
    locale: '{locale, select, sk {Slovak} en {English} other {Unknown}}',
  },
};

export default messages;
