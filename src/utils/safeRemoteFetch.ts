import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';

const DEFAULT_MAX_REDIRECTS = 3;
const DEFAULT_TIMEOUT_MS = 5000;
const DEFAULT_MAX_RESPONSE_BYTES = 1024 * 1024;
const ALLOWED_PORTS = new Set(['', '80', '443']);

const IPV4_BLOCKED_RANGES: Array<[number, number]> = [
  [0x00000000, 8],
  [0x0a000000, 8],
  [0x64400000, 10],
  [0x7f000000, 8],
  [0xa9fe0000, 16],
  [0xac100000, 12],
  [0xc0000000, 24],
  [0xc0000200, 24],
  [0xc0a80000, 16],
  [0xc6120000, 15],
  [0xc6336400, 24],
  [0xcb007100, 24],
  [0xe0000000, 4],
  [0xf0000000, 4],
];

const IPV6_BLOCKED_RANGES: Array<[bigint, number]> = [
  [0n, 128],
  [1n, 128],
  [0x0100n << 112n, 64],
  [0x20010db8n << 96n, 32],
  [0xfc00n << 112n, 7],
  [0xfe80n << 112n, 10],
  [0xff00n << 112n, 8],
];

type SafeFetchOptions = {
  headers?: HeadersInit;
  maxRedirects?: number;
  timeoutMs?: number;
  maxResponseBytes?: number;
};

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

export const isSafeRemoteUrl = async (url: URL) => {
  if (!['https:', 'http:'].includes(url.protocol)) {
    return false;
  }

  if (url.username || url.password) {
    return false;
  }

  if (!ALLOWED_PORTS.has(url.port)) {
    return false;
  }

  if (isPrivateHost(url.hostname)) {
    return false;
  }

  return !(await hasPrivateResolvedAddress(url.hostname));
};

const readBoundedResponseBody = async (
  response: Response,
  maxResponseBytes: number,
) => {
  if (!response.body) return null;

  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (!value) continue;

    totalBytes += value.byteLength;
    if (totalBytes > maxResponseBytes) {
      await reader.cancel();
      throw new Error('Response is too large');
    }

    chunks.push(value);
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;

  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }

  return body;
};

export const safeRemoteFetch = async (
  input: string | URL,
  options: SafeFetchOptions = {},
) => {
  const {
    headers,
    maxRedirects = DEFAULT_MAX_REDIRECTS,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    maxResponseBytes = DEFAULT_MAX_RESPONSE_BYTES,
  } = options;

  let currentUrl = new URL(input);
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), timeoutMs);

  try {
    for (
      let redirectCount = 0;
      redirectCount <= maxRedirects;
      redirectCount++
    ) {
      if (!(await isSafeRemoteUrl(currentUrl))) {
        throw new Error('URL is not allowed');
      }

      const response = await fetch(currentUrl, {
        headers,
        redirect: 'manual',
        signal: abortController.signal,
      });

      const contentLength = Number(response.headers.get('content-length'));
      if (contentLength > maxResponseBytes) {
        throw new Error('Response is too large');
      }

      if (![301, 302, 303, 307, 308].includes(response.status)) {
        const body = await readBoundedResponseBody(response, maxResponseBytes);

        return new Response(body, {
          headers: response.headers,
          status: response.status,
          statusText: response.statusText,
        });
      }

      const location = response.headers.get('location');
      if (!location) return response;

      currentUrl = new URL(location, currentUrl);
    }

    throw new Error('Too many redirects');
  } finally {
    clearTimeout(timeout);
  }
};
