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
    containsRecipes: 'Kategória obsahuje recepty',
  },
  roleRequest: {
    duplicate: 'Rola je už vyžiadaná',
    notFound: 'Požiadavka o rolu nebola nájdená',
  },
  emails: {
    verificationCode: {
      subject: 'Verifikačný kód',
      heading: 'Potvrďte Vašu emailovú adresu',
      body: 'Prosim zadajte Váš verifikačný kód pri vyžiadaní.',
    },
    passwordReset: {
      subject: 'Reset hesla',
      heading: 'Resetovanie hesla',
      body: 'Pre resetovanie hesla použite následujúcú odkaz.',
      button: 'Resetovať heslo',
    },
    roleRequest: {
      subject: 'Požiadavka o rolu',
      heading: 'Ďalšia požiadavka o rolu',
      body: (obj: { id: string; role: string }) =>
        // @ts-ignore
        `Prosím skontrolujte požiadavku <${obj.id}> s rolou <${messages.roles[obj.role]}>.`,
    },
    roleRequestStatus: {
      subject: 'Tvoja požiadavka o rolu',
      heading: 'Status požiadavky o rolu',
      body: (obj: { id: string; role: string; status: string }) =>
        // @ts-ignore
        `Požiadavka o rolu <${obj.id}> s rolou <${messages.roles[obj.role]}> bola <${messages.status[obj.status]}>.`,
    },
  },
};
