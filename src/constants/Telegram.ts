export const JTTG = 'https://t.me/jilltodkar/';

const TELEGRAM_BOT_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://t.me/STEarnBot'
    : 'https://t.me/EarnNotificationsStagingBot';

export function generateTelegramBotUrl(
  email: string | null | undefined,
): string {
  if (!email) {
    return TELEGRAM_BOT_URL;
  }
  // UTF-8 then base64, like Buffer's, but in browsers too.
  const encodedEmail = btoa(
    String.fromCharCode(...new TextEncoder().encode(email)),
  );
  return `${TELEGRAM_BOT_URL}?start=${encodedEmail}`;
}
