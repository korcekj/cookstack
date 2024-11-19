import {
  createHash,
  randomBytes,
  getRandomValues,
  pbkdf2 as pbkdf2_,
} from 'crypto';

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
  url: string | URL,
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
    {} as T,
  );
};

export const joinValues = <T extends unknown[]>(array: T, separator = ' | ') =>
  array
    .map(val => (typeof val === 'string' ? `'${val}'` : val))
    .join(separator);

export const objectEntries = <T extends object>(
  obj: T,
): [keyof T, T[keyof T]][] => {
  return Object.entries(obj) as [keyof T, T[keyof T]][];
};

export const combineEntries = <T extends [string, unknown][]>(
  entries: T,
  coupler: string = '=',
  delimiter: string = ',',
) => {
  return entries
    .map(([key, value]) => `${key}${coupler}${value}`)
    .join(delimiter);
};

export const formDataEntries = <K extends string | number | symbol>(
  obj: Record<string, FormDataEntryValue>,
) => {
  return Object.entries(obj).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: value.toString(),
    }),
    {} as Record<K, string>,
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
  path: K | K[],
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
  keys: K[],
): Omit<T, K> => {
  const result = { ...object };

  keys.forEach(key => {
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

export const replaceValues = <T extends object>(obj: T, regex: RegExp) => {
  const replacer = (input: Record<string, any> | string) => {
    if (typeof input === 'string') return input.replace(regex, '{{$1}}');
    else if (input && typeof input === 'object') {
      for (let key in input) {
        input[key] = replacer(input[key]);
      }
    }
    return input;
  };

  return replacer(obj) as T;
};

export const random = (size: number, alphabet: string) => {
  const randomValues = new Uint8Array(size);
  getRandomValues(randomValues);
  return Array.from(
    randomValues,
    value => alphabet[value % alphabet.length],
  ).join('');
};

export const generateId = (size: number) => {
  const alphabet = '1234567890abcdefghijklmnopqrstuvwxyz';
  return random(size, alphabet);
};

export const generateNumbers = (size: number) => {
  const alphabet = '1234567890';
  return random(size, alphabet);
};

export const sha256 = (value: string | Uint8Array) => {
  return createHash('sha256').update(value).digest('hex');
};

export const pbkdf2 = {
  key(
    value: string | Uint8Array,
    salt: string | Uint8Array,
    options?: { c: number; dkLen: number; digest: 'sha256' | 'sha512' },
  ) {
    const { c = 100_000, dkLen = 64, digest = 'sha512' } = options ?? {};
    return new Promise<string>((resolve, reject) => {
      pbkdf2_(value, salt, c, dkLen, digest, (err, key) => {
        if (err) reject(err);
        else resolve(key.toString('hex'));
      });
    });
  },
  async hash(value: string | Uint8Array) {
    const salt = randomBytes(16).toString('hex');
    const key = await this.key(value, salt);
    return `${salt}:${key}`;
  },
  async verify(hash: string, value: string | Uint8Array) {
    const [salt, key] = hash.split(':');
    const targetKey = await this.key(value, salt);
    return targetKey === key;
  },
};
