export const PDTG = 'https://t.me/pratikdholani/';
export const ABTG = 'https://t.me/abhwshek/';

export const TELEGRAM_BOT_URL =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? 'https://t.me/STEarnBot'
    : 'https://t.me/EarnNotificationsStagingBot';

export function generateTelegramBotUrl(
  email: string | null | undefined,
): string {
  if (!email) {
    return TELEGRAM_BOT_URL;
  }
  const encodedEmail = Buffer.from(email).toString('base64');
  return `${TELEGRAM_BOT_URL}?start=${encodedEmail}`;
}
