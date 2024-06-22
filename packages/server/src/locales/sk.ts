import sk from '@cs/utils/zod/locales/sk';

export default {
  ...sk,
  errors: {
    ...sk.errors,
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
    unverifiedEmail: 'Neoverený email',
    existsEmail: 'Zvolený email nie je možné použiť',
  },
  recipe: {
    duplicate: 'Recept už existuje',
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
