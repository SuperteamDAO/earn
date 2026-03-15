interface SlugifyOptions {
  replacement?: string;
  remove?: RegExp;
  lower?: boolean;
  strict?: boolean;
  trim?: boolean;
  maxLength?: number;
}

const FALLBACK_CHAR_MAP: Record<string, string> = {
  ß: 'ss',
  Æ: 'AE',
  æ: 'ae',
  Ø: 'O',
  ø: 'o',
  Œ: 'OE',
  œ: 'oe',
  Ð: 'D',
  ð: 'd',
  Þ: 'TH',
  þ: 'th',
  Ł: 'L',
  ł: 'l',
  Đ: 'D',
  đ: 'd',
  Ħ: 'H',
  ħ: 'h',
  ƒ: 'f',
  ı: 'i',
  Ə: 'E',
  ə: 'e',
};

function replaceMappedCharacters(value: string) {
  return Array.from(value, (char) => FALLBACK_CHAR_MAP[char] ?? char).join('');
}

function escapeForRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function slugify(value: string, options: SlugifyOptions = {}) {
  const {
    replacement = '-',
    remove,
    lower = false,
    strict = false,
    trim = true,
    maxLength,
  } = options;

  const normalized = replaceMappedCharacters(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’]/g, '')
    .replace(/&/g, ' and ')
    .replace(/\s+/g, ' ');

  let nextValue = trim ? normalized.trim() : normalized;

  if (remove) {
    nextValue = nextValue.replace(remove, '');
  }

  nextValue = nextValue.replace(/[^A-Za-z0-9]+/g, replacement);

  if (strict) {
    const replacementPattern = new RegExp(escapeForRegExp(replacement), 'g');
    nextValue = nextValue
      .replace(
        new RegExp(`[^A-Za-z0-9${escapeForRegExp(replacement)}]+`, 'g'),
        '',
      )
      .replace(
        new RegExp(`${escapeForRegExp(replacement)}{2,}`, 'g'),
        replacement,
      );

    if (trim) {
      nextValue = nextValue
        .replace(new RegExp(`^${escapeForRegExp(replacement)}+`), '')
        .replace(new RegExp(`${escapeForRegExp(replacement)}+$`), '');
    } else {
      nextValue = nextValue.replace(replacementPattern, replacement);
    }
  } else {
    nextValue = nextValue.replace(
      new RegExp(`${escapeForRegExp(replacement)}{2,}`, 'g'),
      replacement,
    );

    if (trim) {
      nextValue = nextValue
        .replace(new RegExp(`^${escapeForRegExp(replacement)}+`), '')
        .replace(new RegExp(`${escapeForRegExp(replacement)}+$`), '');
    }
  }

  if (lower) {
    nextValue = nextValue.toLowerCase();
  }

  if (!maxLength || nextValue.length <= maxLength) {
    return nextValue;
  }

  const slicedValue = nextValue.slice(0, maxLength);
  return trim
    ? slicedValue.replace(new RegExp(`${escapeForRegExp(replacement)}+$`), '')
    : slicedValue;
}
