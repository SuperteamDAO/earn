import {
  discordRegex,
  githubRegex,
  linkedinRegex,
  telegramRegex,
  twitterRegex,
} from './regex';

export function extractTwitterUsername(input: string): string | null {
  const match = input.match(twitterRegex);
  if (match && match[2]) {
    return match[2].startsWith('@') ? match[2].slice(1) : match[2];
  }
  const usernameRegex = /^@?([a-zA-Z0-9_]{1,90})$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0].startsWith('@')
      ? usernameMatch[0].slice(1)
      : usernameMatch[0];
  }
  return null;
}

export function extractTelegramUsername(input: string): string | null {
  const urlMatch = input.match(telegramRegex);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].startsWith('@') ? urlMatch[1].slice(1) : urlMatch[1];
  }

  const usernameRegex = /^@?[a-zA-Z0-9_]{5,90}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0].startsWith('@')
      ? usernameMatch[0].slice(1)
      : usernameMatch[0];
  }

  return null;
}

export function extractLinkedInUsername(input: string): string | null {
  const urlMatch = input.match(linkedinRegex);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  const usernameRegex = /^[a-zA-Z0-9\-]{5,90}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0];
  }
  return null;
}

export function extractGitHubUsername(input: string): string | null {
  const urlMatch = input.match(githubRegex);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  const usernameRegex = /^[a-zA-Z0-9\-]{1,90}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0];
  }
  return null;
}

export function extractDiscordUsername(input: string): string | null {
  const usernameMatch = input.match(discordRegex);
  if (usernameMatch && usernameMatch[1]) {
    return usernameMatch[1];
  }
  return null;
}
