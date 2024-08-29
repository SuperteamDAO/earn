import {
  discordRegex,
  githubRegex,
  linkedinRegex,
  telegramRegex,
  twitterRegex,
  websiteRegex,
} from './regex';

export function isValidTwitterInput(input: string): boolean {
  return twitterRegex.test(input);
}

export function isValidTelegramInput(input: string): boolean {
  return telegramRegex.test(input);
}

export function isValidLinkedInInput(input: string): boolean {
  return linkedinRegex.test(input);
}

export function isValidGitHubInput(input: string): boolean {
  return githubRegex.test(input);
}

export function isValidDiscordInput(input: string): boolean {
  return discordRegex.test(input);
}

export function isValidWebsiteUrl(input: string): boolean {
  return websiteRegex.test(input);
}
