const twitterRegex =
  /^(?:https?:\/\/)?(?:www\.)?(twitter\.com|x\.com)\/(@?[a-zA-Z0-9]{1,90})\/?$/;

const telegramRegex =
  /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(@?[a-zA-Z0-9_]{5,90})\/?$/;

const linkedinRegex =
  /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/([a-zA-Z0-9\-]{5,90})\/?$/;

const githubRegex =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9\-]{1,90})\/?$/;

const discordRegex = /^(?:@?[a-zA-Z0-9_]{2,32}(?:#\d{4})?|[a-zA-Z0-9_]{2,90})$/;

const websiteRegex =
  /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?$/;

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export {
  discordRegex,
  emailRegex,
  githubRegex,
  linkedinRegex,
  telegramRegex,
  twitterRegex,
  websiteRegex,
};
