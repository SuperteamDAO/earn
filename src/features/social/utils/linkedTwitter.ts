// `linkedTwitter` is a JSON column holding the user's verified X handles.
export function getLinkedTwitterHandles(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((handle): handle is string => typeof handle === 'string')
    : [];
}
