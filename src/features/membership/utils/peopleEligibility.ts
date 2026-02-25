export const ELIGIBLE_PEOPLE_TYPES = ['member', 'core'] as const;

const ELIGIBLE_PEOPLE_TYPE_SET = new Set<string>(ELIGIBLE_PEOPLE_TYPES);

export function isEligiblePeopleType(type: string | null | undefined): boolean {
  const normalized = type?.trim().toLowerCase();
  return normalized ? ELIGIBLE_PEOPLE_TYPE_SET.has(normalized) : false;
}
