/**
 * It stringifies the object which is necessary to ensure that in a logging system(like Axiom) we see the object in context in a single log event
 */
export function safeStringify(obj: unknown) {
  try {
    if (obj instanceof Error) {
      // Errors don't serialize well, so we extract what we want
      // We stringify so that we can log the error message and stack trace in a single log event
      return JSON.stringify(obj.stack ?? obj.message, null, 2);
    }
    // Avoid crashing on circular references
    return JSON.stringify(obj, null, 2);
  } catch (e) {
    return obj;
  }
}

export function convertDatesToISO<TInput>(input: TInput): TInput {
  const recur = (value: any): any => {
    if (value instanceof Date) return value.toISOString();
    if (Array.isArray(value)) return value.map(recur);
    if (value && typeof value === 'object') {
      const out: Record<string, any> = {};
      for (const key of Object.keys(value)) {
        out[key] = recur((value as any)[key]);
      }
      return out;
    }
    return value;
  };
  return recur(input);
}
