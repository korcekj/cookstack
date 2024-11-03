import sk from './src/i18n/messages/sk.ts';

type Messages = typeof sk;

declare global {
  interface IntlMessages extends Messages {}
}
