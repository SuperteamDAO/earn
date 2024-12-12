const twitterUsernameRegex = /^[a-zA-Z-1-9_]{4,15}$/;
const telegramUsernameRegex = /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/;
const linkedinUsernameRegex = /^[a-zA-Z0-9]{3,100}$/;
const githubUsernameRegex = /^(?!-)(?!.*--)(?!.*-$)[a-zA-Z0-9-]{1,39}$/;
const discordUsernameRegex = /^(?=[a-z0-9._]{2,32}$)(?!.*\.\.)[a-z0-9._]+$/;

const twitterRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?(twitter\\.com|x\\.com)\\/${twitterUsernameRegex.source}\\/?$`,
);

const telegramRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?(?:t\\.me|telegram\\.me)\\/${telegramUsernameRegex.source}\\/?$`,
);

const linkedinRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?linkedin\\.com\\/(?:in|pub)\\/${linkedinUsernameRegex.source}\\/?$`,
);

const githubRegex = new RegExp(
  `^(?:https?:\\/\\/)?(?:www\\.)?github\\.com\\/${githubUsernameRegex.source}\\/?$`,
);

const discordRegex = new RegExp(`^${discordUsernameRegex.source}$`);

const websiteRegex =
  /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export {
  discordRegex,
  discordUsernameRegex,
  emailRegex,
  githubRegex,
  githubUsernameRegex,
  linkedinRegex,
  linkedinUsernameRegex,
  telegramRegex,
  telegramUsernameRegex,
  twitterRegex,
  twitterUsernameRegex,
  websiteRegex,
};
