export type QueryParamValue = string | string[] | undefined;

export type BoundedIntegerResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

export function getSingleQueryParam(value: QueryParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function parseBoundedIntegerParam(
  value: QueryParamValue,
  {
    defaultValue,
    maxValue,
    minValue = 0,
    name,
  }: {
    defaultValue: number;
    maxValue: number;
    minValue?: number;
    name: string;
  },
): BoundedIntegerResult {
  const rawValue = getSingleQueryParam(value);

  if (rawValue === undefined) {
    return { ok: true, value: defaultValue };
  }

  if (!/^\d+$/.test(rawValue)) {
    return {
      ok: false,
      error: `${name} must be a non-negative integer`,
    };
  }

  const parsedValue = Number(rawValue);
  if (!Number.isSafeInteger(parsedValue)) {
    return { ok: false, error: `${name} is too large` };
  }

  if (parsedValue < minValue) {
    return { ok: false, error: `${name} must be at least ${minValue}` };
  }

  return { ok: true, value: Math.min(parsedValue, maxValue) };
}
