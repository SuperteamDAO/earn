function undefinedToNull(input: unknown): unknown {
  if (input === undefined) {
    return null;
  }

  if (Array.isArray(input)) {
    return input.map((item: unknown) => undefinedToNull(item));
  }

  if (input !== null && typeof input === 'object') {
    return convertUndefinedToNull(input);
  }

  return input;
}

/**
 * Recursively converts all `undefined` values in the input to `null`.
 * Helpful for JSON request bodies, where undefined values are dropped.
 * @param input - An object.
 * @returns A new object with all `undefined` replaced by `null`.
 */
export function convertUndefinedToNull(input: object): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [key, undefinedToNull(value)]),
  );
}
