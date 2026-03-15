interface CookieOptions {
  expires?: number | Date;
  path?: string;
  sameSite?: 'lax' | 'strict' | 'none';
  secure?: boolean;
}

function isBrowser() {
  return typeof document !== 'undefined';
}

function encode(value: string) {
  return encodeURIComponent(value);
}

function decode(value: string) {
  return decodeURIComponent(value);
}

export function getCookie(name: string): string | undefined {
  if (!isBrowser()) {
    return undefined;
  }

  const encodedName = `${encode(name)}=`;
  const cookie = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(encodedName));

  if (!cookie) {
    return undefined;
  }

  return decode(cookie.slice(encodedName.length));
}

export function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  if (!isBrowser()) {
    return;
  }

  const parts = [`${encode(name)}=${encode(value)}`];

  if (options.expires !== undefined) {
    const expiresAt =
      typeof options.expires === 'number'
        ? new Date(Date.now() + options.expires * 24 * 60 * 60 * 1000)
        : options.expires;

    parts.push(`Expires=${expiresAt.toUTCString()}`);
  }

  if (options.path) {
    parts.push(`Path=${options.path}`);
  }

  if (options.sameSite) {
    parts.push(`SameSite=${options.sameSite}`);
  }

  if (options.secure) {
    parts.push('Secure');
  }

  document.cookie = parts.join('; ');
}

export function removeCookie(name: string, options: CookieOptions = {}) {
  setCookie(name, '', {
    ...options,
    expires: new Date(0),
  });
}
