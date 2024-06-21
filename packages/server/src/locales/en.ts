import en from '@cs/utils/zod/locales/en';

export default {
  ...en,
  errors: {
    ...en.errors,
    internalServerError: 'Internal server error',
    badRequest: 'Bad request',
    tryAgainInMinutes: 'Try again in a few minutes',
    tooManyRequests: 'Too many requests',
  },
  auth: {
    unauthorized: 'Unauthorized',
    invalidEmail: 'Invalid email',
    invalidEmailPassword: 'Invalid email or password',
    invalidCode: 'Invalid code',
    invalidToken: 'Invalid token',
    unverifiedEmail: 'Unverified email',
    existsEmail: 'Email cannot be used',
    notSamePassword: 'Passwords do not match',
  },
  recipe: {
    duplicate: 'Recipe already exists',
  },
  emails: {
    verificationCode: {
      subject: 'Verification code',
      heading: 'Confirm your email address',
      body: 'Please enter your verification code when prompted.',
    },
    resetPassword: {
      subject: 'Password reset',
      heading: 'Reset your password',
      body: 'Please use the link below to reset your password.',
      button: 'Reset your password',
    },
  },
};
