import { getRandomValues } from 'crypto';

export const ADJECTIVES = [
  'happy',
  'clever',
  'swift',
  'bright',
  'fresh',
  'golden',
  'silver',
  'master',
  'super',
  'mega',
  'ultra',
  'prime',
  'epic',
  'royal',
  'grand',
  'noble',
];

export const NOUNS = [
  'chef',
  'cook',
  'baker',
  'gourmet',
  'foodie',
  'kitchen',
  'taste',
  'flavor',
  'spice',
  'plate',
  'dish',
  'recipe',
  'meal',
  'feast',
  'bistro',
  'cuisine',
];

export const random = (size: number, alphabet: string) => {
  const randomValues = new Uint8Array(size);
  getRandomValues(randomValues);
  return Array.from(
    randomValues,
    value => alphabet[value % alphabet.length],
  ).join('');
};

export const generateName = (value: string) => {
  const hash = Array.from(value).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const adjective = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[hash % NOUNS.length];
  return `${adjective} ${noun}`;
};

export const generateId = (size: number) => {
  const alphabet = '1234567890abcdefghijklmnopqrstuvwxyz';
  return random(size, alphabet);
};

export const generateNumbers = (size: number) => {
  const alphabet = '1234567890';
  return random(size, alphabet);
};
