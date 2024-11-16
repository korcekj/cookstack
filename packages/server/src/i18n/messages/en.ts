import { replaceValues } from '@cs/utils';

import en from '@cs/utils/zod/messages/en';

const messages = replaceValues(en, /{([^{}]+)}/g);

export default {
  ...messages,
  errors: {
    ...messages.errors,
    internalServerError: 'Internal server error',
    badRequest: 'Bad request',
    tryAgainInMinutes: 'Try again in a few minutes',
    tooManyRequests: 'Too many requests',
  },
  auth: {
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    invalidEmail: 'Invalid email',
    invalidEmailPassword: 'Invalid email or password',
    invalidCode: 'Invalid code',
    invalidToken: 'Invalid token',
    invalidHeader: 'Invalid header',
    unverifiedEmail: 'Unverified email',
    existsEmail: 'Email cannot be used',
    existsAuthor: 'Author already exists',
  },
  recipe: {
    duplicate: 'Recipe already exists',
    notFound: 'Recipe not found',
  },
  section: {
    duplicate: 'Section already exists',
    notFound: 'Section not found',
  },
  ingredient: {
    duplicate: 'Ingredient already exists',
    notFound: 'Ingredient not found',
  },
  instruction: {
    duplicate: 'Instruction already exists',
    notFound: 'Instruction not found',
  },
  category: {
    duplicate: 'Category already exists',
    notFound: 'Category not found',
    containsRecipe: 'Category contains recipe',
  },
  image: {
    notFound: 'Image not found',
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
