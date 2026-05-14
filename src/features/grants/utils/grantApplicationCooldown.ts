import { dayjs } from '@/utils/dayjs';

export const GRANT_APPLICATION_COOLDOWN_DAYS = 30;

export const getGrantApplicationCooldownEndsAt = (
  decidedAt: Date | string | null | undefined,
) => {
  if (!decidedAt) return null;

  const decisionDate = dayjs(decidedAt);
  if (!decisionDate.isValid()) return null;

  return decisionDate.add(GRANT_APPLICATION_COOLDOWN_DAYS, 'day');
};

export const isGrantApplicationInCooldown = (
  decidedAt: Date | string | null | undefined,
) => {
  const cooldownEndsAt = getGrantApplicationCooldownEndsAt(decidedAt);
  if (!cooldownEndsAt) return false;

  return dayjs().isBefore(cooldownEndsAt);
};

export const grantApplicationCooldownTooltip = (
  decidedAt: Date | string | null | undefined,
) => {
  const cooldownEndsAt = getGrantApplicationCooldownEndsAt(decidedAt);
  if (!cooldownEndsAt) return null;

  return `A cooldown period of 30 days started after your previous application was rejected. You can apply again on or after ${cooldownEndsAt.format('MMMM D, YYYY')}.`;
};
