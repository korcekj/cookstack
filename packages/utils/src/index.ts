export const isURL = (value: string) => {
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    return false;
  }

  return url.protocol === 'http:' || url.protocol === 'https:';
};

export const parseUrl = (
  url: string | URL
): Partial<{ protocol: string; domain: string; tld: string | null }> => {
  try {
    const { hostname, protocol } = new URL(url);
    const parts = hostname.split('.');
    if (parts.length === 1) {
      return {
        protocol,
        domain: hostname,
        tld: null,
      };
    }

    const tld = parts.pop();
    const domain = parts.pop();
    return {
      protocol,
      domain,
      tld,
    };
  } catch (err) {
    return {};
  }
};

export const slugify = (value: string) => {
  const normalized = value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return toCase(normalized, '-');
};

export const snakeCaseifyKeys = <T extends object>(obj: T) => {
  return Object.keys(obj).reduce(
    (reducer, acc) => ({
      ...reducer,
      [toCase(acc, '_')]: obj[acc as keyof T],
    }),
    {} as T
  );
};

export const joinValues = <T extends unknown[]>(array: T, separator = ' | ') =>
  array
    .map((val) => (typeof val === 'string' ? `'${val}'` : val))
    .join(separator);

export const objectEntries = <T extends object>(
  obj: T
): [keyof T, T[keyof T]][] => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};

export const combineEntries = <T extends [string, unknown][]>(
  entries: T,
  coupler: string = '=',
  delimiter: string = ','
) => {
  return entries
    .map(([key, value]) => `${key}${coupler}${value}`)
    .join(delimiter);
};

export const formDataEntries = <K extends string | number | symbol>(
  obj: Record<string, FormDataEntryValue>
) => {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value.toString(),
    }),
    {} as Record<K, string>
  );
};

export const set = <T extends object>(object: T, path: string, value: any) => {
  const pathArray = Array.isArray(path) ? path : path.match(/([^[.\]]+)/g);

  pathArray?.reduce((acc, key, index) => {
    if (index === pathArray.length - 1) {
      acc[key] = value;
    } else {
      if (!acc[key]) {
        acc[key] = isNaN(Number(pathArray[index + 1])) ? {} : [];
      }
    }
    return acc[key];
  }, object);

  return object;
};

export const get = <T extends object, K extends keyof T>(
  object: T,
  path: K | K[]
): T[K] | undefined => {
  const pathArray = Array.isArray(path)
    ? path
    : String(path).match(/([^[.\]]+)/g);

  return pathArray?.reduce((acc: any, key) => {
    return acc && acc[key as keyof T] !== undefined
      ? acc[key as keyof T]
      : undefined;
  }, object);
};

export const omit = <T extends object, K extends keyof T>(
  object: T,
  keys: K[]
): Omit<T, K> => {
  const result = { ...object };

  keys.forEach((key) => {
    delete result[key];
  });

  return result;
};

export const toCase = (value: string, separator = '-') => {
  return value
    .replace(/([a-z])([A-Z])/g, `$1${separator}$2`)
    .replace(/\s+/g, separator)
    .replace(/_+/g, separator)
    .toLowerCase();
};
