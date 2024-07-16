import { deburr } from 'lodash';

export const isURL = (value: string) => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

export const sameDomains = (value1: string, value2: string) => {
  if (!isURL(value1) || !isURL(value2)) return false;

  const url1 = new URL(value1);
  const url2 = new URL(value2);

  const { domains: d1, topLevelDomain: tld1 } = parseOrigin(url1.origin);
  const { domains: d2, topLevelDomain: tld2 } = parseOrigin(url2.origin);

  return d1.at(-1) === d2.at(-1) && tld1 === tld2;
};

export const parseOrigin = (origin: string) => {
  const matches = [...origin.matchAll(/(.*):\/\/(.*)\.(.*)/g)];
  const protocol = matches.at(0)?.at(1);
  const domains = matches.at(0)?.at(2)?.split('.') ?? [];
  const topLevelDomain = matches.at(0)?.at(3);
  return {
    protocol,
    domains,
    topLevelDomain,
  };
};

export const slugify = (value: string, separator = '-') => {
  return deburr(value).toLowerCase().replace(/ +/g, separator);
};

export const joinValues = <T extends unknown[]>(array: T, separator = ' | ') =>
  array
    .map((val) => (typeof val === 'string' ? `'${val}'` : val))
    .join(separator);
