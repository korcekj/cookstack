import sk from './src/lib/messages/sk.ts';

type Messages = typeof sk;

declare global {
  interface IntlMessages extends Messages {}
}
