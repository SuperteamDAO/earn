// Legacy helpers for code not yet on the Tokens service
// (src/server/tokens.ts).
import { prisma } from '@/prisma';
import { normalizeTokenIcon } from '@/server/tokens';

interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  sortOrder: number;
  isActive: boolean;
  isVerifiedOnJupiter: boolean;
}

const TOKEN_ICON_PROXY_PATH = '/api/token-icon';

const tokenSelect = {
  tokenName: true,
  tokenSymbol: true,
  mintAddress: true,
  icon: true,
  decimals: true,
  sortOrder: true,
  isActive: true,
  isVerifiedOnJupiter: true,
} as const;

const normalizeTokenRecord = <T extends Token>(token: T): T => ({
  ...token,
  icon: normalizeTokenIcon(token.icon),
});

async function getTokenBySymbol(
  tokenSymbol?: string | null,
  options?: {
    includeInactive?: boolean;
  },
): Promise<Token | null> {
  if (!tokenSymbol) return null;

  const token = await prisma.tokenMetadata.findFirst({
    where: {
      tokenSymbol,
      ...(options?.includeInactive ? {} : { isActive: true }),
    },
    select: tokenSelect,
  });

  return token ? normalizeTokenRecord(token) : null;
}

export async function getTokenIcon(
  symbol?: string | null,
  options?: {
    format?: 'png';
  },
): Promise<string | null> {
  const token = await getTokenBySymbol(symbol, { includeInactive: true });
  const icon = token?.icon;

  if (!icon || options?.format !== 'png') {
    return icon ?? null;
  }

  if (!icon.startsWith(`${TOKEN_ICON_PROXY_PATH}?`)) {
    return icon;
  }

  const proxyUrl = new URL(icon, 'https://superteam.fun');
  proxyUrl.searchParams.set('format', 'png');
  return `${proxyUrl.pathname}${proxyUrl.search}`;
}
