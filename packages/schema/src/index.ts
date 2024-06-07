import type { NamedValue } from './types';
import type { ZodErrorMap, ZodError } from 'zod';

import { z, defaultErrorMap, ZodIssueCode, ZodParsedType } from 'zod';

export * from './auth';

export const parseError = (error: ZodError<any>) => {
  const { formErrors, fieldErrors } = error.flatten();
  if (formErrors.length) return formErrors[0];
  return Object.entries(fieldErrors).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value[0],
    }),
    {} as Record<keyof typeof fieldErrors, string>
  );
};

export const makeZodI18nMap =
  (
    t: (k: string, nv?: NamedValue) => string,
    te: (k: string) => boolean,
    key = 'errors'
  ): ZodErrorMap =>
  (issue, _ctx) => {
    console.log(issue);

    let options = {} as NamedValue;
    let { message } = defaultErrorMap(issue, _ctx);

    const makePath = (...args: string[]) => args.filter(Boolean).join('.');

    const translate = (message: string, options: NamedValue) => {
      const path = makePath(key, message);
      if (te(path)) return t(path, options);
      if (te(message)) return t(message, options);
      return message;
    };

    switch (issue.code) {
      case ZodIssueCode.invalid_type:
        if (issue.received === ZodParsedType.undefined) {
          message = 'invalidTypeReceivedUndefined';
        } else if (issue.received === ZodParsedType.null) {
          message = 'invalidTypeReceivedNull';
        } else {
          message = 'invalidType';
          options = {
            expected: te(`types.${issue.expected}`)
              ? t(`types.${issue.expected}`)
              : issue.expected,
            received: te(`types.${issue.received}`)
              ? t(`types.${issue.received}`)
              : issue.received,
          };
        }
        break;
      case ZodIssueCode.invalid_string:
        if (typeof issue.validation === 'object') {
          if ('startsWith' in issue.validation) {
            message = `invalidString.startsWith`;
            options = {
              startsWith: issue.validation.startsWith,
            };
          } else if ('endsWith' in issue.validation) {
            message = `invalidString.endsWith`;
            options = {
              endsWith: issue.validation.endsWith,
            };
          }
        } else {
          message = `invalidString.${issue.validation}`;
        }
        break;
      case ZodIssueCode.too_small:
        message = `tooSmall.${issue.type}.${
          issue.exact ? 'exact' : issue.inclusive ? 'inclusive' : 'notInclusive'
        }`;
        options = {
          minimum: issue.minimum,
        };

        break;
      case ZodIssueCode.too_big:
        message = `tooBig.${issue.type}.${
          issue.exact ? 'exact' : issue.inclusive ? 'inclusive' : 'notInclusive'
        }`;
        options = {
          maximum: issue.maximum,
        };
        break;
      case ZodIssueCode.custom:
        message = 'custom';
        if (issue.params?.i18n) {
          if (typeof issue.params.i18n === 'string') {
            message = issue.params.i18n;
          } else if (
            typeof issue.params.i18n === 'object' &&
            issue.params.i18n?.key
          ) {
            message = issue.params.i18n.key;
            if (issue.params.i18n?.options) {
              options = issue.params.i18n.options;
            }
          }
        }
        break;
    }

    message = translate(message, options);

    return {
      message,
    };
  };

export { z };
