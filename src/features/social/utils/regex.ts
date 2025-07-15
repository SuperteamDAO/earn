const twitterUsernameRegex = /[a-zA-Z0-9_]{4,15}/;
const telegramUsernameRegex = /[a-zA-Z][a-zA-Z0-9_]{4,32}/;

const twitterRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?(twitter\\.com|x\\.com)\\/${twitterUsernameRegex.source}\\/?$`,
);

// allows normal username and group links
const telegramRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?(?:t\\.me|telegram\\.me)\\/(?:${
    telegramUsernameRegex.source
  }|\\+[a-zA-Z0-9_-]+)\/?$`,
);

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const tweetLinkRegex =
  /^(https?:\/\/)?(www\.)?(twitter\.com|x\.com)\/[a-zA-Z0-9_]{4,15}\/status\/\d+\/?$/;

export { emailRegex, telegramRegex, twitterRegex };
