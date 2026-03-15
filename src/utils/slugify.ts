interface SlugifyOptions {
  lower?: boolean;
  maxLength?: number;
}

function trimTrailingDelimiter(value: string) {
  return value.replace(/-+$/g, '');
}

export function slugify(value: string, options: SlugifyOptions = {}) {
  const { lower = true, maxLength } = options;
  const normalized = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ');

  const cased = lower ? normalized.toLowerCase() : normalized;
  const collapsed = cased
    .trim()
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!maxLength || collapsed.length <= maxLength) {
    return collapsed;
  }

  return trimTrailingDelimiter(collapsed.slice(0, maxLength));
}
