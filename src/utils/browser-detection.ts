interface BrowserInfo {
  readonly name: string;
  readonly version: number;
}

const MINIMUM_VERSIONS = {
  chrome: 115,
  edge: 115,
  firefox: 127,
  safari: 16.8,
} as const;

function getBrowserInfo(userAgent: string): BrowserInfo | null {
  const ua = userAgent.toLowerCase();

  if (ua.includes('chrome') && !ua.includes('edg')) {
    const match = ua.match(/chrome\/(\d+)/);
    if (match?.[1]) {
      return { name: 'chrome', version: parseInt(match[1], 10) };
    }
  }

  if (ua.includes('edg')) {
    const match = ua.match(/edg\/(\d+)/);
    if (match?.[1]) {
      return { name: 'edge', version: parseInt(match[1], 10) };
    }
  }

  if (ua.includes('firefox')) {
    const match = ua.match(/firefox\/(\d+)/);
    if (match?.[1]) {
      return { name: 'firefox', version: parseInt(match[1], 10) };
    }
  }

  if (ua.includes('safari') && !ua.includes('chrome')) {
    const match = ua.match(/version\/(\d+(?:\.\d+)?)/);
    if (match?.[1]) {
      return { name: 'safari', version: parseFloat(match[1]) };
    }
  }

  return null;
}

export function isBrowserOutdated(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  const browserInfo = getBrowserInfo(navigator.userAgent);

  if (!browserInfo) {
    return true;
  }

  const minimumVersion =
    MINIMUM_VERSIONS[browserInfo.name as keyof typeof MINIMUM_VERSIONS];

  if (!minimumVersion) {
    return true;
  }

  return browserInfo.version < minimumVersion;
}
