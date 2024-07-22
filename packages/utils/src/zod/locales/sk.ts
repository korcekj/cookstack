// https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/sk/zod.json
export default {
  errors: {
    invalidType:
      'Hodnota musí byť {expected}, ale bola obdržaná typ {received}',
    invalidTypeReceivedUndefined: 'Povinné',
    invalidTypeReceivedNull: 'Povinné',
    invalidLiteral: 'Invalid value, expected {expected}',
    unrecognizedKeys: "'Keys doesn't recognized {keys}'",
    invalidUnion: 'Invalid value',
    invalidUnionDiscriminator:
      'Invalid discriminator value. Expected {options}',
    invalidEnumValue: 'Neplatná hodnota. Očakáva sa: {options}',
    invalidArguments: 'Invalid funciont parameters',
    invalidReturnType: 'Invalid function value returned',
    invalidDate: 'Neplatný dátum',
    custom: 'Neplatná hodnota',
    notSamePassword: 'Heslá sa nezhodujú',
    invalidIntersectionTypes: 'Intersection results could not be merged',
    notMultipleOf: 'The number must be a multiple of {multipleOf}',
    notFinite: 'The number must be finite',
    invalidString: {
      email: 'Neplatný email',
      url: 'Neplatná url',
      uuid: 'Neplatné uuid',
      cuid: 'Neplatné cuid',
      regex: 'Neplatná kombinácia',
      datetime: 'Neplatný dátum a čas',
      startsWith: 'Neplatná hodnota: musí začínať s "{startsWith}"',
      endsWith: 'Neplatná hodnota: musí končiť s "{endsWith}"',
    },
    tooSmall: {
      array: {
        exact: 'Pole musí obsahovať presne {minimum} prvky',
        inclusive: 'Pole musí obsahovať aspoň {minimum} prvky',
        notInclusive: 'Pole musí obsahovať viac ako {minimum} prvky',
      },
      string: {
        exact: 'Dĺžka musí mať presne {minimum} znak(y)',
        inclusive: 'Minimálna dĺžka je {minimum} znak(y)',
        notInclusive: 'Vložte viac ako {minimum} znak(y)',
      },
      number: {
        exact: 'The value must be {minimum}',
        inclusive: 'Insert a value greater or equal to {minimum}',
        notInclusive: 'Insert a value greater than {minimum}',
      },
      set: {
        exact: 'Invalid value',
        inclusive: 'Invalid value',
        notInclusive: 'Invalid value',
      },
      date: {
        exact: 'The date must be {minimum}',
        inclusive: 'The date must be later or equal to {minimum}',
        notInclusive: 'The date must be later than {minimum}',
      },
    },
    tooBig: {
      array: {
        exact: 'Insert {maximum} elements',
        inclusive: 'Insert at most {maximum} elements',
        notInclusive: 'Insert less of {maximum} elements',
      },
      string: {
        exact: 'Dĺžka musí mať presne {maximum} znak(y)',
        inclusive: 'Minimálna dĺžka je {maximum} znak(y)',
        notInclusive: 'Vložte menej ako {maximum} znak(y)',
      },
      number: {
        exact: 'The value must be {maximum}',
        inclusive: 'Insert a value less or equal to {maximum}',
        notInclusive: 'Insert a value less than {maximum}',
      },
      set: {
        exact: 'Invalid value',
        inclusive: 'Invalid value',
        notInclusive: 'Invalid value',
      },
      date: {
        exact: 'The date must be {maximum}',
        inclusive: 'The date must be earlier or equal to {maximum}',
        notInclusive: 'The date must be earlier than {maximum}',
      },
    },
  },
  types: {
    function: 'funkcia',
    number: 'číslo',
    string: 'text',
    nan: 'NaN',
    integer: 'celé číslo',
    float: 'reálne číslo',
    boolean: 'boolean',
    date: 'dátum',
    bigint: 'bigint',
    undefined: 'undefined',
    symbol: 'symbol',
    null: 'null',
    array: 'pole',
    object: 'objekt',
    unknown: 'neznámy',
    promise: 'promise',
    void: 'void',
    never: 'never',
    map: 'mapa',
    set: 'množina',
  },
};
