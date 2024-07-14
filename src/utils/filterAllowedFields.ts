export function filterAllowedFields<T extends { [key: string]: any }>(
  body: T,
  allowedFields: (keyof T)[],
): Partial<T> {
  const filteredData: Partial<T> = {};

  for (const key of Object.keys(body) as Array<keyof T>) {
    if (allowedFields.includes(key)) {
      filteredData[key] = body[key];
    }
  }

  return filteredData;
}
