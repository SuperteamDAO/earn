type TokenSearchable = {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  sortOrder?: number;
};

type JupiterTokenSearchable = {
  name: string;
  symbol?: string | null;
  id: string;
};

export const normalizeTokenSearchValue = (value?: string | null) =>
  value?.trim().toLowerCase() ?? '';

export const getTokenSearchRank = ({
  query,
  name,
  symbol,
  mintAddress,
  sortOrder,
}: {
  query: string;
  name: string;
  symbol?: string | null;
  mintAddress: string;
  sortOrder?: number;
}) => {
  const normalizedQuery = normalizeTokenSearchValue(query);
  const normalizedName = normalizeTokenSearchValue(name);
  const normalizedSymbol = normalizeTokenSearchValue(symbol);
  const normalizedMintAddress = normalizeTokenSearchValue(mintAddress);

  if (!normalizedQuery) return sortOrder ?? 0;

  if (normalizedSymbol === normalizedQuery) return 0;
  if (normalizedName === normalizedQuery) return 1;
  if (normalizedSymbol.startsWith(normalizedQuery)) return 2;
  if (normalizedName.startsWith(normalizedQuery)) return 3;
  if (normalizedSymbol.includes(normalizedQuery)) return 4;
  if (normalizedName.includes(normalizedQuery)) return 5;
  if (normalizedMintAddress === normalizedQuery) return 6;
  if (normalizedMintAddress.startsWith(normalizedQuery)) return 7;
  if (normalizedMintAddress.includes(normalizedQuery)) return 8;

  return 9;
};

export const sortTokenSearchResults = <T extends TokenSearchable>(
  tokens: T[],
  query: string,
) =>
  [...tokens].sort((firstToken, secondToken) => {
    const rankDelta =
      getTokenSearchRank({
        query,
        name: firstToken.tokenName,
        symbol: firstToken.tokenSymbol,
        mintAddress: firstToken.mintAddress,
        sortOrder: firstToken.sortOrder,
      }) -
      getTokenSearchRank({
        query,
        name: secondToken.tokenName,
        symbol: secondToken.tokenSymbol,
        mintAddress: secondToken.mintAddress,
        sortOrder: secondToken.sortOrder,
      });

    if (rankDelta !== 0) return rankDelta;

    const sortOrderDelta =
      (firstToken.sortOrder ?? 0) - (secondToken.sortOrder ?? 0);
    if (sortOrderDelta !== 0) return sortOrderDelta;

    return firstToken.tokenSymbol.localeCompare(secondToken.tokenSymbol);
  });

export const sortJupiterTokenSearchResults = <T extends JupiterTokenSearchable>(
  tokens: T[],
  query: string,
) =>
  [...tokens].sort((firstToken, secondToken) => {
    const rankDelta =
      getTokenSearchRank({
        query,
        name: firstToken.name,
        symbol: firstToken.symbol,
        mintAddress: firstToken.id,
      }) -
      getTokenSearchRank({
        query,
        name: secondToken.name,
        symbol: secondToken.symbol,
        mintAddress: secondToken.id,
      });

    if (rankDelta !== 0) return rankDelta;

    return normalizeTokenSearchValue(firstToken.symbol).localeCompare(
      normalizeTokenSearchValue(secondToken.symbol),
    );
  });
