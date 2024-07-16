// https://github.com/aiji42/zod-i18n/blob/main/packages/core/locales/en/zod.json
export default {
  errors: {
    invalidType: 'Expected {expected}, received {received}',
    invalidTypeReceivedUndefined: 'Required',
    invalidTypeReceivedNull: 'Required',
    invalidLiteral: 'Invalid value, expected {expected}',
    unrecognizedKeys: "'Keys doesn't recognized {keys}'",
    invalidUnion: 'Invalid value',
    invalidUnionDiscriminator:
      'Invalid discriminator value. Expected {options}',
    invalidEnumValue: 'Invalid value. Expected: {options}',
    invalidArguments: 'Invalid function parameters',
    invalidReturnType: 'Invalid function value returned',
    invalidDate: 'Invalid date',
    custom: 'Invalid value',
    notSamePassword: 'Passwords do not match',
    invalidIntersectionTypes: 'Intersection results could not be merged',
    notMultipleOf: 'The number must be a multiple of {multipleOf}',
    notFinite: 'The number must be finite',
    invalidString: {
      email: 'Invalid email',
      url: 'Invalid url',
      uuid: 'Invalid uuid',
      cuid: 'Invalid cuid',
      regex: 'Invalid value',
      datetime: 'Invalid date and time',
      startsWith: 'Invalid value: must start with "{startsWith}"',
      endsWith: 'Invalid value: must end with "{endsWith}"',
    },
    tooSmall: {
      array: {
        exact: 'Insert exactly {minimum} element(s)',
        inclusive: 'Insert at least {minimum} element(s)',
        notInclusive: 'Insert more of {minimum} element(s)',
      },
      string: {
        exact: 'The length must be of {minimum} character(s)',
        inclusive: 'Minimum length {minimum} character(s)',
        notInclusive: 'Insert more of {minimum} character(s)',
      },
      number: {
        exact: 'The value must be exactly {minimum}',
        inclusive: 'Insert a value greater or equal to {minimum}',
        notInclusive: 'Insert a value greater than {minimum}',
      },
      set: {
        exact: 'Invalid value',
        inclusive: 'Invalid value',
        notInclusive: 'Invalid value',
      },
      date: {
        exact: 'The date must be exactly {minimum}',
        inclusive: 'The date must be later or equal to {minimum}',
        notInclusive: 'The date must be later than {minimum}',
      },
    },
    tooBig: {
      array: {
        exact: 'Insert exactly {maximum} element(s)',
        inclusive: 'Insert at most {maximum} element(s)',
        notInclusive: 'Insert less of {maximum} element(s)',
      },
      string: {
        exact: 'The length must be of {maximum} character(s)',
        inclusive: 'Maximum length {maximum} character(s)',
        notInclusive: 'Insert less of {maximum} character(s)',
      },
      number: {
        exact: 'The value must be exactly {maximum}',
        inclusive: 'Insert a value less or equal to {maximum}',
        notInclusive: 'Insert a value less than {maximum}',
      },
      set: {
        exact: 'Invalid value',
        inclusive: 'Invalid value',
        notInclusive: 'Invalid value',
      },
      date: {
        exact: 'The date must be exactly {maximum}',
        inclusive: 'The date must be earlier or equal to {maximum}',
        notInclusive: 'The date must be earlier than {maximum}',
      },
    },
  },
  types: {
    function: 'function',
    number: 'number',
    string: 'string',
    nan: 'nan',
    integer: 'integer',
    float: 'float',
    boolean: 'boolean',
    date: 'date',
    bigint: 'bigint',
    undefined: 'undefined',
    symbol: 'symbol',
    null: 'null',
    array: 'array',
    object: 'object',
    unknown: 'unknown',
    promise: 'promise',
    void: 'void',
    never: 'never',
    map: 'map',
    set: 'set',
  },
};
