export function extractTwitterUsername(input: string) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(twitter\.com|x\.com)?\/?([@a-zA-Z0-9_]{1,15})\/?$/;
  const match = input.match(regex);

  return match ? match[2] : null;
}

export function extractTelegramUsername(input: string) {
  const regex =
    /(?:https?:\/\/)?(?:www\.)?(?:t\.me|telegram\.me)\/(@?[a-zA-Z0-9_]{5,32})\/?$/;
  const match = input.match(regex);

  return match ? match[1] : null;
}
