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

export function extractLinkedInUsername(input: string): string | null {
  const urlRegex =
    /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/([a-zA-Z0-9\-]{5,30})\/?$/;
  const urlMatch = input.match(urlRegex);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  const usernameRegex = /^[a-zA-Z0-9\-]{5,30}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0];
  }
  return null;
}

export function extractGitHubUsername(input: string): string | null {
  const urlRegex =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9\-]{1,39})\/?$/;
  const urlMatch = input.match(urlRegex);
  if (urlMatch && urlMatch[1]) {
    return urlMatch[1];
  }
  const usernameRegex = /^[a-zA-Z0-9\-]{1,39}$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[0]) {
    return usernameMatch[0];
  }
  return null;
}

export function extractDiscordUsername(input: string): string | null {
  const usernameRegex = /^@?([a-zA-Z0-9_]{2,32})$/;
  const usernameMatch = input.match(usernameRegex);
  if (usernameMatch && usernameMatch[1]) {
    return usernameMatch[1];
  }
  return null;
}

export function validateUrl(input: string): boolean {
  const urlRegex =
    /^(?:(?:(?:https?|ftp):)?\/\/)(?:\S+(?::\S*)?@)?(?:(?!(?:10|127)(?:\.\d{1,3}){3})(?!(?:169\.254|192\.168)(?:\.\d{1,3}){2})(?!172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})(?:[1-9]\d?|1\d\d|2[01]\d|22[0-3])(?:\.(?:1?\d{1,2}|2[0-4]\d|25[0-5])){2}(?:\.(?:[1-9]\d?|1\d\d|2[0-4]\d|25[0-4]))|(?:(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)(?:\.(?:[a-z\u00a1-\uffff0-9]-*)*[a-z\u00a1-\uffff0-9]+)*(?:\.(?:[a-z\u00a1-\uffff]{2,})))(?::\d{2,5})?(?:[/?#]\S*)?$/i;
  return urlRegex.test(input);
}
