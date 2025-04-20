import { type BountyType } from '@prisma/client';

import { tokenList } from '@/constants/tokenList';

import {
  BONUS_REWARD_POSITION, // Assuming this is a string like "bonus" or similar
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
  MAX_REWARD,
} from '@/features/listing-builder/constants';

export function generateListingRewardsPrompt(
  description: string,
  type: BountyType,
): string {
  const allowedSymbols = tokenList.map((token) => token.tokenSymbol);
  const allowedSymbolsString = allowedSymbols.join(', ');

  let prompt = `Analyze the provided listing description for a '${type}' and extract the reward details according to the following rules, matching the specified JSON schema structure.

<input-description>
${description}
</input-description>

**Extraction Rules:**

1.  **Token (\`token: string\`):**
    *   Identify the reward token symbol mentioned.
    *   The token symbol MUST be one of: ${allowedSymbolsString}.
    *   Default to 'USDC' if no valid token is found or mentioned.

2.  **Compensation Type (\`compensationType: 'fixed' | 'range' | 'variable'\`):**
    *   Determine the compensation type based on the description and listing type ('${type}').`;

  if (type !== 'project') {
    // Bounty/Hackathon rules
    prompt += `
    *   For '${type}' type listings, the compensation type MUST ALWAYS be 'fixed'. Set it to 'fixed'.

3.  **Rewards Array (\`rewards: Array<{ rank: string, amount: number }>\`):**
    *   Extract the reward amounts for each mentioned podium position (1st, 2nd, etc.).
    *   Create an array of objects. Each object in the array represents a single reward tier.
    *   Each object MUST have two fields:
        *   \`rank\`: A string representing the rank (e.g., "1", "2", "3"). Podium ranks MUST be sequential starting from "1" up to a maximum of ${MAX_PODIUMS} positions.
        *   \`amount\`: The numeric reward amount for that rank (must be > 0.00 and <= ${MAX_REWARD}).
    *   If bonus rewards are mentioned with a specific amount (see rule 4), add an object to the array with \`rank: "${BONUS_REWARD_POSITION}"\` and the corresponding bonus \`amount\`.
    *   *Example (3 winners):* \`[ { "rank": "1", "amount": 500 }, { "rank": "2", "amount": 300 }, { "rank": "3", "amount": 200 } ]\`
    *   *Example (2 winners + bonus):* \`[ { "rank": "1", "amount": 1000 }, { "rank": "2", "amount": 500 }, { "rank": "${BONUS_REWARD_POSITION}", "amount": 50 } ]\`
    *   If no specific reward amounts are clearly mentioned for podiums or bonuses, return an empty array \`[]\`.

4.  **Bonus Spots (\`maxBonusSpots: number | null\`):**
    *   Identify the number of bonus spots or winners mentioned, separate from the main podiums.
    *   This value must be a whole number between 0 and ${MAX_BONUS_SPOTS}.
    *   If bonus spots are mentioned AND a corresponding bonus reward amount is found, ensure an object with \`rank: "${BONUS_REWARD_POSITION}"\` exists in the \`rewards\` array (Rule 3).
    *   If no bonus spots are mentioned or the number is unclear, set \`maxBonusSpots\` to 0.

5.  **Range Fields (\`minRewardAsk\`, \`maxRewardAsk\`):**
    *   These fields are NOT applicable to '${type}' listings. Do not extract or return them (they should be omitted or null based on schema defaults).`;
  } else {
    // Project rules
    prompt += `
    *   For 'project' type listings, determine if compensation is 'fixed', 'range', or 'variable'.
    *   'fixed': Single, non-negotiable amount.
    *   'range': Minimum and maximum amount mentioned.
    *   'variable': Negotiation implied or applicant quotes price.
    *   Default to 'fixed' if unclear.

3.  **Rewards Array (\`rewards: Array<{ rank: string, amount: number }>\`):**
    *   **If Compensation Type is 'fixed':** Extract the single fixed reward amount. The array MUST contain exactly one object: \`{ "rank": "1", "amount": <fixed_amount> }\`, where the amount is positive and <= ${MAX_REWARD}. *Example:* \`[ { "rank": "1", "amount": 2300 } ]\`. If no fixed amount is found, return an empty array \`[]\`.
    *   **If Compensation Type is 'range' or 'variable':** The \`rewards\` array MUST be empty: \`[]\`.

4.  **Bonus Spots (\`maxBonusSpots\`):**
    *   This field is NOT applicable to 'project' listings. Do not extract or return it.

5.  **Range Fields (\`minRewardAsk: number | null\`, \`maxRewardAsk: number | null\`):**
    *   **If Compensation Type is 'range':** Extract the minimum and maximum values of the reward range (min >= 0, max <= ${MAX_REWARD}). If only one bound is found, extract it and leave the other null (as per schema default). If no range values found, leave both null.
    *   **If Compensation Type is 'fixed' or 'variable':** Do not extract range values (leave as null/default).`;
  }

  // --- Default Behavior ---
  prompt += `

**Default Behavior (If No Valid Reward Info Found):**
*   If the description lacks parsable reward info (token, amounts, type, range, bonuses):
    *   Set \`token\` to 'USDC'.
    *   Set \`compensationType\` to 'fixed'.
    *   Set \`rewards\` to an empty array \`[]\`.
    *   If type is not 'project', set \`maxBonusSpots\` to 0.
    *   If type is 'project', ensure \`minRewardAsk\` and \`maxRewardAsk\` are null/default.

**Output Format:**
Return ONLY the JSON object matching the schema based on these rules. Do not include explanations or surrounding text.`;

  return prompt;
}
