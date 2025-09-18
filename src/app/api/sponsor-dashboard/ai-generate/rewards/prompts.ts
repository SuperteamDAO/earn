import { tokenList } from '@/constants/tokenList';

import {
  BONUS_REWARD_POSITION,
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  MAX_REWARD,
} from '@/features/listing-builder/constants';

import { type RewardInputSchema } from './route';

export function generateListingRewardsPrompt({
  description,
  token,
  tokenUsdValue,
  type,
}: RewardInputSchema): string {
  const targetTokenSymbol = token || 'USDC';
  const targetTokenName =
    tokenList.find((s) => s.tokenSymbol === targetTokenSymbol)?.tokenName ||
    'USDC';
  const targetTokenUsdValue = tokenUsdValue || 1;

  let prompt = `You are an expert data extraction AI. Analyze the provided listing description for a '${type}' listing and extract the reward details according to the rules below. Your goal is to generate a precise JSON object matching the specified schema.

## Input Data:

<listing-type>
${type}
</listing-type>

<input-description>
${description}
</input-description>

<target-token-details>
  <name>${targetTokenName}</name>
  <symbol>${targetTokenSymbol}</symbol>
  <usd-value>${targetTokenUsdValue}</usd-value>
</target-token-details>

## Extraction Rules & JSON Schema:

**Overall Goal:** Populate the following JSON structure based *strictly* on the rules and input data.

\`\`\`json
{
  "token": "string",
  "compensationType": "'fixed' | 'range' | 'variable'",
  "rewards": [ { "rank": "string", "amount": number } ],
  "maxBonusSpots": number | null,
  "minRewardAsk": number,
  "maxRewardAsk": number
}
\`\`\`

**1. Token (\`token: string\`):**
   *   MUST be the target token symbol: \`${targetTokenSymbol}\`. Absolutely refrain on use any other token symbol found in the description.

**2. Amount Conversion Logic (Apply wherever amounts are extracted):**
   *   All numeric amounts in the final JSON (\`rewards[].amount\`, \`minRewardAsk\`, \`maxRewardAsk\`) MUST be denominated in the target token: \`${targetTokenSymbol}\`.
   *   If an amount is found in the input text specified in USD (e.g., "$1000", "1000 dollars"):
      *   If the target token (\`${targetTokenSymbol}\`) is 'USDC' or similar 1:1 stablecoin, use the numeric USD value directly.
      *   If the target token is something other than 'USDC' or stable coin, convert the USD amount: \`amount_in_target_token = usd_amount / ${targetTokenUsdValue}\`.
   *   If an amount is found already specified in the target token (e.g., "500 ${targetTokenSymbol}"), use that numeric value directly.
   *   If an amount is found in a *different* token, try to find an associated USD value to convert; otherwise, ignore this conflicting amount. Prioritize USD or direct target token mentions.
   *   Round converted amounts reasonably (e.g., 2-4 decimal places). Ensure amounts are > 0.00 and <= ${MAX_REWARD}.

`;

  // --- Type-Specific Rules ---
  if (type !== 'project') {
    // Bounty/Hackathon Rules
    prompt += `
**3. Compensation Type (\`compensationType: 'fixed'\`):**
   *   For '${type}' listings, this MUST ALWAYS be \`'fixed'\`.

**4. Rewards Array (\`rewards: Array<{ rank: string, amount: number }>\`):**
   *   Extract reward amounts for podium positions (1st, 2nd, etc., up to ${MAX_PODIUMS}) and any explicitly mentioned "bonus" tier from the input text.
   *   Apply the **Amount Conversion Logic** (Rule 2) to each extracted amount.
   *   Create an array of objects, each with:
      *   \`rank\`: String for the rank ("1", "2", ..., "${BONUS_REWARD_POSITION}"). Podium ranks MUST be sequential starting from "1".
      *   \`amount\`: The final numeric reward amount in \`${targetTokenSymbol}\`.
   *   **Podium Priority:** You MUST prioritize extracting and including sequential podium ranks (1st, 2nd, etc.) if mentioned.
   *   **Bonus Rewards:** Only include a reward with \`rank: "${BONUS_REWARD_POSITION}"\` if the word "bonus" is explicitly associated with that reward amount in the text. A bonus reward alone without podium rewards is stritcly invalid.
   *   If no specific reward amounts are clearly mentioned for any rank, return an empty array \`[]\`.
   *   *Example (Input: "1st $500, 2nd $300", Target: SOL, SOL USD: 150):* \`[ { "rank": "1", "amount": 3.33 }, { "rank": "2", "amount": 2.00 } ]\`
   *   *Example (Input: "1st 1000 USDC, plus $100 bonus", Target: USDC):* \`[ { "rank": "1", "amount": 1000 }, { "rank": "${BONUS_REWARD_POSITION}", "amount": 100 } ]\`

**5. Bonus Spots (\`maxBonusSpots: number | null\`):**
   *   Identify the number of bonus spots/winners mentioned (0 to ${MAX_BONUS_SPOTS}).
   *   If bonus spots are mentioned AND a corresponding bonus reward amount was added to the \`rewards\` array (rank "${BONUS_REWARD_POSITION}"), set \`maxBonusSpots\` to the identified number.
   *   Otherwise, set \`maxBonusSpots\` to 0.
   *   Bonus Spot (rank "${BONUS_REWARD_POSITION}") is absolutely necessary for maxBonusSpots to have some value

**6. Range Fields (\`minRewardAsk\`, \`maxRewardAsk\`):**
   *   Set both \`minRewardAsk\` and \`maxRewardAsk\` to \`0\` for '${type}' listings.
`;
  } else {
    // Project Rules
    prompt += `
**3. Compensation Type (\`compensationType: 'fixed' | 'range' | 'variable'\`):**
   *   Determine based on the input text:
      *   \`'fixed'\`: A single specific amount is stated (e.g., "$2000", "10 SOL").
      *   \`'range'\`: A clear minimum and maximum are stated (e.g., "$1000-$1500", "5 to 8 SOL").
      *   \`'variable'\`: No amount/range specified, negotiation implied, or applicant provides a quote.
   *   Default to \`'fixed'\` if unclear but a single amount seems present. Default to \`'variable'\` if no amount/range is mentioned at all.

**4. Rewards Array (\`rewards: Array<{ rank: string, amount: number }>\`):**
   *   **If \`compensationType\` is 'fixed':**
      *   Extract the single fixed reward amount.
      *   Apply the **Amount Conversion Logic** (Rule 2) to get the final amount in \`${targetTokenSymbol}\`.
      *   The array MUST contain exactly one object: \`{ "rank": "1", "amount": <final_amount_in_target_token> }\`.
      *   If no fixed amount is found (e.g., type is variable/range), return an empty array \`[]\`.
      *   *Example (Input: "Pay is $2000", Target: SOL, SOL USD: 150):* \`[ { "rank": "1", "amount": 13.33 } ]\`
   *   **If \`compensationType\` is 'range' or 'variable':**
      *   The \`rewards\` array MUST be empty: \`[]\`.

**5. Range Fields (\`minRewardAsk: number\`, \`maxRewardAsk: number\`):**
   *   **If \`compensationType\` is 'range':**
      *   Extract *both* the minimum and maximum values of the reward range from the text.
      *   Apply the **Amount Conversion Logic** (Rule 2) *separately* to both the minimum and maximum values to get them in \`${targetTokenSymbol}\`.
      *   **CRITICAL:** You MUST populate BOTH \`minRewardAsk\` AND \`maxRewardAsk\` with the final numeric values in \`${targetTokenSymbol}\`. Both fields are mandatory for the 'range' type. \`maxRewardAsk\` must be greater than \`minRewardAsk\`.
      *   *Example (Input: "Range $1000-$1500", Target: SOL, SOL USD: 150):* \`minRewardAsk: 6.67\`, \`maxRewardAsk: 10.00\`
      *   *Example (Input: "Range 500-800 USDC", Target: USDC):* \`minRewardAsk: 500\`, \`maxRewardAsk: 800\`
   *   **If \`compensationType\` is 'fixed' or 'variable':**
      *   Set both \`minRewardAsk\` and \`maxRewardAsk\` to \`0\`.
`;
  }

  // --- Final Instructions & Output ---
  prompt += `

## Default Behavior (If No Valid Reward Info Found):

*   If the input lacks clear, parsable reward information matching the rules:
    *   Set \`token\` to \`${targetTokenSymbol}\`.
    *   Set \`compensationType\` to '${type === 'project' ? 'variable' : 'fixed'}'.
    *   Set \`rewards\` to \`[]\`.
    *   Set \`maxBonusSpots\` to 0.
    *   Set \`minRewardAsk\` and \`maxRewardAsk\` to \`0\`.

## Important Notes:

*   Ensure all calculations for amount conversions are accurate using the provided USD value (\`${targetTokenUsdValue}\`).
*   **Double-check:** If \`compensationType\` is 'range', ensure *both* \`minRewardAsk\` and \`maxRewardAsk\` have valid numeric values.
`;

  return prompt;
}
