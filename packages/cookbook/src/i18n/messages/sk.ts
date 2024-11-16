import sk from '@cs/utils/zod/messages/sk';

const messages = {
  ...sk,
  LocaleSwitch: {
    locale: '{locale, select, sk {Slovensky} en {Anglicky} other {Neznámy}}',
  },
};

export default messages;
