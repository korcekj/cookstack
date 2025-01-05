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

export const generateName = (value: string) => {
  const hash = Array.from(value).reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0,
  );
  const adjective = ADJECTIVES[hash % ADJECTIVES.length];
  const noun = NOUNS[hash % NOUNS.length];
  return `${adjective} ${noun}`;
};
