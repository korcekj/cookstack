import type { ZodErrorMap, ZodError } from 'zod';

import { set } from 'lodash';
import { joinValues } from '../index';
import { z, defaultErrorMap, ZodIssueCode, ZodParsedType } from 'zod';

export * from './auth';
export * from './recipe';
export * from './section';
export * from './category';
export * from './ingredient';

type NamedValue<T = {}> = T & Record<string, unknown>;

export const parseError = (error: ZodError<any>) => {
  const { issues } = error;
  if (!issues[0].path.length) return issues[0].message;
  return issues.reduce((acc, issue) => {
    set(acc, issue.path.join('.'), issue.message);
    return acc;
  }, {});
};

// https://github.com/volverjs/zod-vue-i18n/blob/develop/src/index.ts
export const makeZodI18nMap =
  (
    t: (k: string, nv?: NamedValue) => string,
    te: (k: string) => boolean,
    ns = 'errors'
  ): ZodErrorMap =>
  (issue, _ctx) => {
    // TODO: remove
    console.log(issue);

    let options = {} as NamedValue;
    let { message } = defaultErrorMap(issue, _ctx);

    const makePath = (...args: string[]) => args.filter(Boolean).join('.');

    const translate = (message: string, options: NamedValue) => {
      const path = makePath(ns, message);
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
      case ZodIssueCode.invalid_enum_value:
        message = 'invalidEnumValue';
        options = {
          options: joinValues(issue.options),
          received: issue.received,
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
