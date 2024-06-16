import sk from '@cs/utils/zod/locales/sk';

export default {
  ...sk,
  errors: {
    ...sk.errors,
    unauthorized: 'Neoprávnený',
    invalidEmail: 'Neplatný email',
    invalidEmailPassword: 'Neplatný email alebo heslo',
    invalidCode: 'Neplatný kód',
    invalidToken: 'Neplatný token',
    internalServerError: 'Interná chyba servera',
    unverifiedEmail: 'Neoverený email',
    badRequest: 'Zlá požiadavka',
    existsEmail: 'Zvolený email nie je možné použiť',
    notSamePassword: 'Heslá sa nezhodujú',
    tryAgainInMinutes: 'Skúste to znovu o niekoľko minút',
    tooManyRequests: 'Príliš veľa požiadaviek',
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
