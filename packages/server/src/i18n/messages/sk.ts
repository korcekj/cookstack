import { replaceValues } from '@cs/utils';

import sk from '@cs/utils/zod/messages/sk';

const messages = replaceValues(sk, /{([^{}]+)}/g);

export default {
  ...messages,
  errors: {
    ...messages.errors,
    internalServerError: 'Interná chyba servera',
    badRequest: 'Zlá požiadavka',
    tryAgainInMinutes: 'Skúste to znovu o niekoľko minút',
    tooManyRequests: 'Príliš veľa požiadaviek',
  },
  auth: {
    unauthorized: 'Neoprávnený',
    forbidden: 'Zakázaný',
    invalidEmail: 'Neplatný email',
    invalidEmailPassword: 'Neplatný email alebo heslo',
    invalidCode: 'Neplatný kód',
    invalidToken: 'Neplatný token',
    invalidHeader: 'Neplatná hlavička',
    unverifiedEmail: 'Neoverený email',
    existsEmail: 'Zvolený email nie je možné použiť',
    existsAuthor: 'Autor už existuje',
  },
  recipe: {
    duplicate: 'Recept už existuje',
    notFound: 'Recept nebol nájdený',
  },
  section: {
    duplicate: 'Sekcia už existuje',
    notFound: 'Sekcia nebola nájdená',
  },
  ingredient: {
    duplicate: 'Ingrediencia už existuje',
    notFound: 'Ingrediencia nebola nájdená',
  },
  instruction: {
    duplicate: 'Inštrukcia už existuje',
    notFound: 'Inštrukcia nebola nájdená',
  },
  category: {
    duplicate: 'Kategória už existuje',
    notFound: 'Kategória nebola nájdená',
    containsRecipe: 'Kategória obsahuje recept',
  },
  image: {
    notFound: 'Obrázok nebol nájdený',
  },
  emails: {
    verificationCode: {
      subject: 'Verifikačný kód',
      heading: 'Potvrďte Vašu emailovú adresu',
      body: 'Prosim zadajte Váš verifikačný kód pri vyžiadaní.',
    },
    resetPassword: {
      subject: 'Reset hesla',
      heading: 'Resetovanie hesla',
      body: 'Pre resetovanie hesla použite následujúcú odkaz.',
      button: 'Resetovať heslo',
    },
  },
};
