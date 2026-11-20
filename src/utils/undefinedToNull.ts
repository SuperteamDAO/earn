// `input` with every undefined value (at any depth) replaced by null.
type UndefinedToNull<T> = T extends undefined
  ? null
  : T extends (infer U)[]
    ? UndefinedToNull<U>[]
    : T extends object
      ? { [K in keyof T]: UndefinedToNull<T[K]> }
      : T;

/**
 * Recursively converts all `undefined` values in the input to `null`.
 * Helpful for axios API calls where undefined values are ignored from api request body.
 * @param input - Any input value of any type.
 * @returns A new value with all `undefined` replaced by `null`.
 */
export const convertUndefinedToNull = <T>(input: T): UndefinedToNull<T> =>
  convert(input) as UndefinedToNull<T>;

const convert = (input: unknown): unknown => {
  if (input === undefined) {
    return null;
  }

  if (Array.isArray(input)) {
    return input.map((item) => convert(item));
  }

  if (input !== null && typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      return {
        ...acc,
        [key]: convert(value),
      };
    }, {});
  }

  return input;
};
