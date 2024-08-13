export function extractTwitterUsername(input: string): string | null {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?(twitter\.com|x\.com)\/(@?[a-zA-Z0-9_]{1,15})\/?$/;
  const match = input.match(regex);
  if (match && match[2]) {
    return match[2].startsWith('@') ? match[2].slice(1) : match[2];
  }
  const usernameRegex = /^@?[a-zA-Z0-9_]{1,15}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0].startsWith('@')
      ? usernameMatch[0].slice(1)
      : usernameMatch[0];
  }
  return null;
}

export function extractTelegramUsername(input: string): string | null {
  const urlRegex =
    /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(@?[a-zA-Z0-9_]{5,32})\/?$/;
  const urlMatch = input.match(urlRegex);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1].startsWith('@') ? urlMatch[1].slice(1) : urlMatch[1];
  }

  const usernameRegex = /^@?[a-zA-Z0-9_]{5,32}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0].startsWith('@')
      ? usernameMatch[0].slice(1)
      : usernameMatch[0];
  }

  return null;
}
