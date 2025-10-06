import { tokenList } from '@/constants/tokenList';

export const generateListingTokenPrompt = (info: string) => {
  const allowedTokenSymbols =
    tokenList.map((token) => token.tokenSymbol).join(', ') || 'USDC';
  const safeAllowedTokens = allowedTokenSymbols || 'USDC';

  return `
Analyze the following listing info to identify the reward token mentioned for payment or pricing.

Listing Info:
<reward-info>
${info}
</reward-info>

Allowed token symbols are: ${safeAllowedTokens}.

Your task is to determine which single token symbol from the allowed list is most clearly indicated in the description.
- If a specific token from the allowed list is mentioned, return that token's symbol.
- If multiple allowed tokens are mentioned, choose the one that seems most prominent or is directly associated with a price.
- If no token from the allowed list is mentioned, or if only unsupported tokens are mentioned, you MUST return null.

Return only the single token symbol corresponding to your analysis.
`;
};
