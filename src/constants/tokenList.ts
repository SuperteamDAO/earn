export interface Token {
  tokenName: string;
  tokenSymbol: string;
  mintAddress: string;
  icon: string;
  decimals: number;
  coingeckoSymbol: string;
}

export const ANY_TOKEN: Token = {
  tokenName: 'Any',
  tokenSymbol: 'Any',
  mintAddress: 'any',
  icon: 'https://nearn.io/assets/anyTokens.svg',
  decimals: 6,
  coingeckoSymbol: 'usd-coin',
};

export const tokenList: Token[] = [
  {
    tokenName: 'USDC',
    tokenSymbol: 'USDC',
    mintAddress:
      '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/128x128/3408.png',
    decimals: 6,
    coingeckoSymbol: 'usd-coin',
  },
  {
    tokenName: 'NEAR',
    tokenSymbol: 'NEAR',
    mintAddress: 'native',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/6535.png',
    decimals: 24,
    coingeckoSymbol: 'near',
  },
  {
    tokenName: 'USDT',
    tokenSymbol: 'USDT',
    mintAddress: 'usdt.tether-token.near',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/825.png',
    decimals: 6,
    coingeckoSymbol: 'tether',
  },
  {
    tokenName: 'Aurora',
    tokenSymbol: 'AURORA',
    mintAddress: 'aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near',
    icon: 'https://s2.coinmarketcap.com/static/img/coins/64x64/14803.png',
    decimals: 18,
    coingeckoSymbol: 'aurora',
  },
  ANY_TOKEN,
];
