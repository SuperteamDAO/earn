const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATETIME_PATTERN =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/;

export type LiveDeadlineResult =
  | { ok: true; value: Date }
  | { ok: false; error: string };

function hasValidCalendarDate(value: string): boolean {
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

/**
 * Parses the optional lower deadline bound used by agent discovery.
 * The live endpoint never permits a caller-provided value to move the bound
 * into the past.
 */
export function parseLiveDeadline(
  input: string | string[] | undefined,
  now = new Date(),
): LiveDeadlineResult {
  if (input === undefined) {
    return { ok: true, value: now };
  }

  if (
    typeof input !== 'string' ||
    (!ISO_DATE_PATTERN.test(input) && !ISO_DATETIME_PATTERN.test(input)) ||
    !hasValidCalendarDate(input)
  ) {
    return {
      ok: false,
      error: 'deadline must be a single ISO-8601 date or datetime',
    };
  }

  const parsed = new Date(
    ISO_DATE_PATTERN.test(input) ? `${input}T00:00:00.000Z` : input,
  );
  if (Number.isNaN(parsed.getTime())) {
    return {
      ok: false,
      error: 'deadline must be a single ISO-8601 date or datetime',
    };
  }

  return {
    ok: true,
    value: new Date(Math.max(parsed.getTime(), now.getTime())),
  };
}
