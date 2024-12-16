const twitterUsernameRegex = /^[a-zA-Z-1-9_]{4,15}$/;
const telegramUsernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;

const twitterRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?(twitter\\.com|x\\.com)\\/${twitterUsernameRegex.source}\\/?$`,
);

const telegramRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?(?:t\\.me|telegram\\.me)\\/${telegramUsernameRegex.source}\\/?$`,
);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidTwitterInput(input: string) {
  return twitterRegex.test(input);
}

export function isValidTwitterUsername(value: string) {
  return twitterUsernameRegex.test(value);
}

export { emailRegex, telegramRegex, twitterRegex, twitterUsernameRegex };
