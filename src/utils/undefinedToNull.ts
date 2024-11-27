type AnyType = any;

/**
 * Recursively converts all `undefined` values in the input to `null`.
 * Helpful for axios API calls where undefined values are ignored from api request body.
 * @param input - Any input value of any type.
 * @returns A new value with all `undefined` replaced by `null`.
 */
export const convertUndefinedToNull = (input: AnyType): AnyType => {
  if (input === undefined) {
    return null;
  }

  if (Array.isArray(input)) {
    return input.map((item) => convertUndefinedToNull(item));
  }

  if (input !== null && typeof input === 'object') {
    return Object.entries(input).reduce((acc, [key, value]) => {
      return {
        ...acc,
        [key]: convertUndefinedToNull(value),
      };
    }, {});
  }

  return input;
};
