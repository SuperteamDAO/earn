import {
  discordRegex,
  githubRegex,
  githubUsernameRegex,
  linkedinRegex,
  linkedinUsernameRegex,
  telegramRegex,
  telegramUsernameRegex,
  twitterRegex,
  twitterUsernameRegex,
  websiteRegex,
} from './regex';

export function isValidTwitterInput(input: string) {
  return twitterRegex.test(input);
}

export function isValidTelegramInput(input: string) {
  return telegramRegex.test(input);
}

export function isValidLinkedInInput(input: string) {
  return linkedinRegex.test(input);
}

export function isValidGitHubInput(input: string) {
  return githubRegex.test(input);
}

export function isValidDiscordInput(input: string) {
  return discordRegex.test(input);
}

export function isValidWebsiteUrl(input: string) {
  return websiteRegex.test(input);
}

export function isValidTwitterUsername(value: string) {
  return twitterUsernameRegex.test(value);
}

export function isValidGitHubUsername(value: string) {
  return githubUsernameRegex.test(value);
}

export function isValidLinkedInUsername(value: string) {
  return linkedinUsernameRegex.test(value);
}

export function isValidTelegramUsername(value: string) {
  return telegramUsernameRegex.test(value);
}
