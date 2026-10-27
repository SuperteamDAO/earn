export function filterAllowedFields<T extends object>(
  body: T,
  allowedFields: (keyof T)[],
): Partial<T> {
  const filteredData: Partial<T> = {};
  const allowedFieldSet = new Set(allowedFields);

  for (const key of Object.keys(body) as Array<keyof T>) {
    if (allowedFieldSet.has(key)) {
      filteredData[key] = body[key];
    }
  }

  return filteredData;
}
