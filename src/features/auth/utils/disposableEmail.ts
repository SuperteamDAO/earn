const DEFAULT_BLOCKED_EMAIL_DOMAINS = [
  // Domains used in the current account-farming attack.
  'euploading.com',
  'maildrop.cc',

  // Common disposable-email providers. ZeroBounce remains the broader,
  // authoritative check for new accounts; this list is the emergency fallback.
  '10minutemail.com',
  'dispostable.com',
  'emailondeck.com',
  'fakemail.net',
  'getnada.com',
  'grr.la',
  'guerrillamail.com',
  'guerrillamailblock.com',
  'mailinator.com',
  'mailnesia.com',
  'mintemail.com',
  'moakt.com',
  'mytemp.email',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
] as const;

export function getEmailDomain(email: string): string | null {
  const normalizedEmail = email.trim().toLowerCase();
  const separator = normalizedEmail.lastIndexOf('@');

  if (separator <= 0 || separator === normalizedEmail.length - 1) return null;

  return normalizedEmail.slice(separator + 1).replace(/\.$/, '');
}

export function isBlockedDisposableEmail(email: string): boolean {
  const emailDomain = getEmailDomain(email);
  if (!emailDomain) return false;

  return [...DEFAULT_BLOCKED_EMAIL_DOMAINS].some(
    (blockedDomain) =>
      emailDomain === blockedDomain ||
      emailDomain.endsWith(`.${blockedDomain}`),
  );
}
