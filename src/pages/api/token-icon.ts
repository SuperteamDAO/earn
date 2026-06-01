import type { NextApiRequest, NextApiResponse } from 'next';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

import logger from '@/lib/logger';
import { safeStringify } from '@/utils/safeStringify';

const MAX_ICON_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_REDIRECTS = 4;
const UPSTREAM_FETCH_TIMEOUT_MS = 5000;
const CACHE_CONTROL =
  'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800';

const IPV4_BLOCKED_RANGES: Array<[number, number]> = [
  [0x00000000, 8], // 0.0.0.0/8
  [0x0a000000, 8], // 10.0.0.0/8
  [0x64400000, 10], // 100.64.0.0/10
  [0x7f000000, 8], // 127.0.0.0/8
  [0xa9fe0000, 16], // 169.254.0.0/16
  [0xac100000, 12], // 172.16.0.0/12
  [0xc0000000, 24], // 192.0.0.0/24
  [0xc0000200, 24], // 192.0.2.0/24
  [0xc0a80000, 16], // 192.168.0.0/16
  [0xc6120000, 15], // 198.18.0.0/15
  [0xc6336400, 24], // 198.51.100.0/24
  [0xcb007100, 24], // 203.0.113.0/24
  [0xe0000000, 4], // 224.0.0.0/4
  [0xf0000000, 4], // 240.0.0.0/4
];

const IPV6_BLOCKED_RANGES: Array<[bigint, number]> = [
  [0n, 128], // ::/128
  [1n, 128], // ::1/128
  [0x0100n << 112n, 64], // 100::/64
  [0x20010db8n << 96n, 32], // 2001:db8::/32
  [0xfc00n << 112n, 7], // fc00::/7
  [0xfe80n << 112n, 10], // fe80::/10
  [0xff00n << 112n, 8], // ff00::/8
];

const stripIpv6Brackets = (hostname: string) =>
  hostname.startsWith('[') && hostname.endsWith(']')
    ? hostname.slice(1, -1)
    : hostname;

const parseIpv4 = (address: string) => {
  const parts = address.split('.');
  if (parts.length !== 4) return null;

  return parts.reduce<number | null>((result, part) => {
    const octet = Number(part);
    if (
      result === null ||
      !Number.isInteger(octet) ||
      octet < 0 ||
      octet > 255
    ) {
      return null;
    }

    return ((result << 8) + octet) >>> 0;
  }, 0);
};

const parseIpv6 = (address: string) => {
  const compressedParts = address.split('::');
  if (compressedParts.length > 2) return null;

  const [head = '', tail = ''] = compressedParts;
  const headParts = head ? head.split(':') : [];
  const tailParts = tail ? tail.split(':') : [];
  const missingParts = 8 - headParts.length - tailParts.length;

  if (missingParts < 0 || (!address.includes('::') && missingParts !== 0)) {
    return null;
  }

  const parts = [
    ...headParts,
    ...Array<string>(missingParts).fill('0'),
    ...tailParts,
  ];

  return parts.reduce<bigint | null>((result, part) => {
    if (result === null || !/^[0-9a-f]{1,4}$/i.test(part)) {
      return null;
    }

    return (result << 16n) + BigInt(`0x${part}`);
  }, 0n);
};

const isIpv4InRange = (address: number, [range, prefix]: [number, number]) => {
  const mask = (0xffffffff << (32 - prefix)) >>> 0;
  return (address & mask) === (range & mask);
};

const isIpv6InRange = (address: bigint, [range, prefix]: [bigint, number]) => {
  const mask = ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
  return (address & mask) === (range & mask);
};

const getIpv4FromMappedIpv6 = (address: bigint) => {
  const ipv4MappedPrefix = 0xffffn;
  if (address >> 32n !== ipv4MappedPrefix) return null;

  return Number(address & 0xffffffffn);
};

const isPrivateIp = (hostname: string) => {
  const address = stripIpv6Brackets(hostname);
  const ipVersion = isIP(address);

  if (ipVersion === 4) {
    const ipv4 = parseIpv4(address);
    return (
      ipv4 !== null &&
      IPV4_BLOCKED_RANGES.some((range) => isIpv4InRange(ipv4, range))
    );
  }

  if (ipVersion === 6) {
    const ipv6 = parseIpv6(address);
    if (ipv6 === null) return false;

    const mappedIpv4 = getIpv4FromMappedIpv6(ipv6);
    if (
      mappedIpv4 !== null &&
      IPV4_BLOCKED_RANGES.some((range) => isIpv4InRange(mappedIpv4, range))
    ) {
      return true;
    }

    return IPV6_BLOCKED_RANGES.some((range) => isIpv6InRange(ipv6, range));
  }

  return false;
};

const isPrivateHost = (hostname: string) => {
  const normalizedHostname = hostname.toLowerCase();
  return (
    normalizedHostname === 'localhost' ||
    normalizedHostname.endsWith('.localhost') ||
    isPrivateIp(hostname)
  );
};

const hasPrivateResolvedAddress = async (hostname: string) => {
  if (isIP(stripIpv6Brackets(hostname))) {
    return isPrivateIp(hostname);
  }

  const addresses = await lookup(hostname, { all: true });
  return addresses.some(({ address }) => isPrivateIp(address));
};

const isValidRemoteIconUrl = async (url: URL) => {
  if (!['https:', 'http:'].includes(url.protocol)) {
    return false;
  }

  if (url.username || url.password) {
    return false;
  }

  if (isPrivateHost(url.hostname)) {
    return false;
  }

  return !(await hasPrivateResolvedAddress(url.hostname));
};

const fetchIcon = async (initialUrl: URL, signal: AbortSignal) => {
  let currentUrl = initialUrl;

  for (let redirectCount = 0; redirectCount <= MAX_REDIRECTS; redirectCount++) {
    if (!(await isValidRemoteIconUrl(currentUrl))) {
      return null;
    }

    const response = await fetch(currentUrl, {
      redirect: 'manual',
      signal,
      headers: {
        Accept:
          'image/avif,image/webp,image/png,image/jpeg,image/svg+xml,image/*',
      },
    });

    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return response;
    }

    const location = response.headers.get('location');
    if (!location) {
      return response;
    }

    currentUrl = new URL(location, currentUrl);
  }

  return null;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end();
  }

  const rawUrl = typeof req.query.url === 'string' ? req.query.url : '';

  let iconUrl: URL;
  try {
    iconUrl = new URL(rawUrl);
  } catch {
    return res.status(400).end();
  }

  if (!['https:', 'http:'].includes(iconUrl.protocol)) {
    return res.status(400).end();
  }

  if (!(await isValidRemoteIconUrl(iconUrl))) {
    return res.status(400).end();
  }

  const abortController = new AbortController();
  const timeout = setTimeout(
    () => abortController.abort(),
    UPSTREAM_FETCH_TIMEOUT_MS,
  );

  try {
    const iconResponse = await fetchIcon(iconUrl, abortController.signal);

    if (!iconResponse) {
      return res.status(400).end();
    }

    if (!iconResponse.ok) {
      return res.status(404).end();
    }

    const contentType = iconResponse.headers.get('content-type') || '';
    if (!contentType.toLowerCase().startsWith('image/')) {
      return res.status(415).end();
    }

    const contentLength = Number(iconResponse.headers.get('content-length'));
    if (contentLength > MAX_ICON_SIZE_BYTES) {
      return res.status(413).end();
    }

    const icon = Buffer.from(await iconResponse.arrayBuffer());
    if (icon.byteLength > MAX_ICON_SIZE_BYTES) {
      return res.status(413).end();
    }

    res.setHeader('Cache-Control', CACHE_CONTROL);
    res.setHeader('Content-Type', contentType);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return res.status(200).send(icon);
  } catch (error) {
    logger.error(`Failed to proxy token icon: ${safeStringify(error)}`);
    return res.status(502).end();
  } finally {
    clearTimeout(timeout);
  }
}
