export function isValidTwitterInput(input: string): boolean {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?(twitter\.com|x\.com)\/(@?[a-zA-Z0-9]{1,15})\/?$|^@?[a-zA-Z0-9]{1,15}$/;
  return regex.test(input);
}

export function isValidTelegramInput(input: string): boolean {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(@?[a-zA-Z0-9_]{5,32})\/?$|^@?[a-zA-Z0-9_]{5,32}$/;
  return regex.test(input);
}

export function isValidLinkedInInput(input: string): boolean {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/([a-zA-Z0-9\-]{5,30})\/?$|^[a-zA-Z0-9\-]{5,30}$/;
  return regex.test(input);
}

export function isValidGitHubInput(input: string): boolean {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9\-]{1,39})\/?$|^[a-zA-Z0-9\-]{1,39}$/;
  return regex.test(input);
}

export function isValidDiscordInput(input: string): boolean {
  const regex = /^(?:@?[a-zA-Z0-9_]{2,32}(?:#\d{4})?|[a-zA-Z0-9_]{2,32})$/;
  return regex.test(input);
}

export function isValidWebsiteUrl(input: string): boolean {
  const regex =
    /^(?:https?:\/\/)?(?:www\.)?[a-zA-Z0-9-]+(?:\.[a-zA-Z]{2,})+(?:\/[^\s]*)?$/;
  return regex.test(input);
}
