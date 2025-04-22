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
  inputReward,
  token,
  tokenUsdValue,
  type,
}: RewardInputSchema): string {
  let prompt = `Analyze the provided listing description for a '${type}' and extract the reward details according to the following rules, matching the specified JSON schema structure. Use the provided token information for calculations and output.

<input-description>
${description}
</input-description>
<input-reward>
${inputReward} // Additional context for rewards if provided separately
</input-reward>

<token-name>
${tokenList.find((s) => s.tokenSymbol === (token || 'USDC'))?.tokenName || 'USDC'}
</token-name>
<token-symbol>
${token || 'USDC'} // This is the TARGET token for the output amounts.
</token-symbol>
<token-amount-in-usd>
${tokenUsdValue || 1} // Use this value for USD-to-TARGET token conversion.
</token-amount-in-usd>


**Extraction Rules:**

1.  **Token (\`token: string\`):**
    *   The output token MUST be the one provided in <token-symbol>: \`${token || 'USDC'}\`. Do not infer a different token from the description if it contradicts this input.

2.  **Compensation Type (\`compensationType: 'fixed' | 'range' | 'variable'\`):**
    *   Determine the compensation type based on the description, input reward, and listing type ('${type}').`;

  if (type !== 'project') {
    // Bounty/Hackathon rules
    prompt += `
    *   For '${type}' type listings, the compensation type MUST ALWAYS be 'fixed'. Set it to 'fixed'.

3.  **Rewards Array (\`rewards: Array<{ rank: string, amount: number }>\`):**
    *   Extract the reward amounts mentioned for each podium position (1st, 2nd, etc.) and any bonus tier from the <input-description> and <input-reward>.
    *   **Amount Conversion:** Before adding an amount to the JSON:
        *   Check if the extracted amount from the text is specified in USD (e.g., "$1000", "1000 dollars", "1000 USD").
        *   If it's USD AND the target <token-symbol> ('${token || 'USDC'}') is NOT 'USDC' (or a similar 1:1 stablecoin), convert the USD amount to the target token: \`amount_in_target_token = usd_amount / ${tokenUsdValue || 1}\`. Round reasonably (e.g., 2-4 decimal places).
        *   If the amount in the text is already specified in the target <token-symbol> (e.g., "500 ${token || 'USDC'}"), use that numeric value directly.
        *   If the amount is in USD and the target <token-symbol> *is* 'USDC', use the numeric USD value directly.
        *   If the amount is specified in a *different* token than the target <token-symbol>, prioritize converting any associated USD value if available; otherwise, this might indicate an inconsistency to ignore or handle based on context (but the output amount *must* be in the target token).
    *   Create an array of objects. Each object represents a reward tier with the final amount denominated in '${token || 'USDC'}'.
    *   Each object MUST have:
        *   \`rank\`: String for the rank ("1", "2", ..., "${BONUS_REWARD_POSITION}"). Podium ranks MUST be sequential up to ${MAX_PODIUMS}.
        *   \`amount\`: The final numeric reward amount *in* '${token || 'USDC'}' (must be > 0.00 and <= ${MAX_REWARD}).
    *   If bonus rewards are mentioned with a specific amount, add an object with \`rank: "${BONUS_REWARD_POSITION}"\` and the corresponding converted/direct bonus \`amount\`.
    *   *Example (Input: "1st $500, 2nd $300", Target Token: SOL, SOL USD Value: 150):* \`[ { "rank": "1", "amount": 3.33 }, { "rank": "2", "amount": 2.00 } ]\`
    *   *Example (Input: "1st 1000 USDC, 2nd 500 USDC", Target Token: USDC):* \`[ { "rank": "1", "amount": 1000 }, { "rank": "2", "amount": 500 } ]\`
    *   *Example (Input: "Top prize 5 SOL", Target Token: SOL):* \`[ { "rank": "1", "amount": 5 } ]\`
    *   If no specific reward amounts are clearly mentioned, return an empty array \`[]\`.

4.  **Bonus Spots (\`maxBonusSpots: number | null\`):**
    *   Identify the number of bonus spots mentioned (0 to ${MAX_BONUS_SPOTS}).
    *   If bonus spots are mentioned AND a corresponding bonus reward amount is found (and added to \`rewards\` array per Rule 3), set \`maxBonusSpots\` to the identified number.
    *   If no bonus spots are mentioned or the number is unclear, set \`maxBonusSpots\` to 0.
    * **VERY IMPORTANT: WHILE CALCULATING REWARD AMOUNTS, DECIDE TO INCLUDE BONUS REWARDS ONLY IF BONUS WORD IS USED EXPLICITLY IN REWARDS**
    *   WHILE BONUS SPOTS ARE OPTIONAL, PODIUM SPOTS ARE COMPULSORY, YOU ABSOLUTELY MUST PRIORITIZE AND ADD PODIUM SPOTS
    *   Example of invalid bonus spot: \`[ { "rank": "${BONUS_REWARD_POSITION}", "amount": 5 } ]\` -  this is invalid since this has no podium ranks, and only bonus ranks

5.  **Range Fields (\`minRewardAsk\`, \`maxRewardAsk\`):**
    *   Not applicable to '${type}'. Omit or set to null.`;
  } else {
    // Project rules
    prompt += `
    *   For 'project' type listings, determine if compensation is 'fixed', 'range', or 'variable' based on <input-description> and <input-reward>.
    *   'fixed': A single amount is stated (e.g., "$2000", "10 SOL").
    *   'range': A minimum and maximum are stated (e.g., "$1000-$1500", "5-8 SOL").
    *   'variable': Applicant provides quote, negotiation implied, or no amount specified.
    *   Default to 'fixed' if unclear but an amount seems present, 'variable' if no amount/range is mentioned.

3.  **Rewards Array (\`rewards: Array<{ rank: string, amount: number }>\`):**
    *   **If Compensation Type is 'fixed':**
        *   Extract the single fixed reward amount from the text.
        *   **Amount Conversion:** Apply the same conversion logic as described for Bounties/Hackathons (Rule 3) to this single amount. Check if it's USD, convert to '${token || 'USDC'}' using ${tokenUsdValue || 1} if needed and target is not USDC. The final amount must be in '${token || 'USDC'}'.
        *   The array MUST contain exactly one object: \`{ "rank": "1", "amount": <final_amount_in_target_token> }\` (amount > 0.00, <= ${MAX_REWARD}).
        *   *Example (Input: "Pay is $2000", Target: SOL, SOL USD: 150):* \`[ { "rank": "1", "amount": 13.33 } ]\`
        *   *Example (Input: "Pay is 1000 USDC", Target: USDC):* \`[ { "rank": "1", "amount": 1000 } ]\`
        *   If no fixed amount is found, return an empty array \`[]\`.
    *   **If Compensation Type is 'range' or 'variable':** The \`rewards\` array MUST be empty: \`[]\`.

4.  **Bonus Spots (\`maxBonusSpots\`):**
    *   Not applicable to 'project'. Omit or set to null.

5.  **Range Fields (\`minRewardAsk: number | null\`, \`maxRewardAsk: number | null\`):**
    *   **If Compensation Type is 'range':**
        *   Extract the minimum and maximum values of the reward range from the text.
        *   **Amount Conversion:** Apply the conversion logic (Rule 3, Bounty/Hackathon) *separately* to both the minimum and maximum values if they are specified in USD and the target token is not USDC. The final \`minRewardAsk\` and \`maxRewardAsk\` must represent the range *in* '${token || 'USDC'}'.
        *   Set \`minRewardAsk\` and \`maxRewardAsk\` to the final numeric values in '${token || 'USDC'}' (min >= 0, max > min, max <= ${MAX_REWARD}).
        *   *Example (Input: "Range $1000-$1500", Target: SOL, SOL USD: 150):* \`minRewardAsk: 6.67\`, \`maxRewardAsk: 10.00\`
        *   *Example (Input: "Range 500-800 USDC", Target: USDC):* \`minRewardAsk: 500\`, \`maxRewardAsk: 800\`
        *   If compensation type is range then uou must absolutely fill both minRewardAsk and maxRewardAsk 
    *   **If Compensation Type is 'fixed' or 'variable':** Set \`minRewardAsk\` and \`maxRewardAsk\` to null.`;
  }

  // --- Default Behavior ---
  prompt += `

**Amount Calculation Summary:**
*   All numeric amounts in the final JSON (\`rewards[].amount\`, \`minRewardAsk\`, \`maxRewardAsk\`) MUST be denominated in the target token: '${token || 'USDC'}'.
*   Use the provided <token-amount-in-usd> (${tokenUsdValue || 1}) to convert any amounts specified in USD in the input text to the target token, *unless* the target token is 'USDC'.

**Default Behavior (If No Valid Reward Info Found):**
*   If the description/input lacks parsable reward info:
    *   Set \`token\` to '${token || 'USDC'}'.
    *   Set \`compensationType\` to '${type === 'project' ? 'variable' : 'fixed'}'. // Default project to variable if nothing found
    *   Set \`rewards\` to an empty array \`[]\`.
    *   If type is not 'project', set \`maxBonusSpots\` to 0.
    *   If type is 'project', ensure \`minRewardAsk\` and \`maxRewardAsk\` are null.

**Output Format:**
Return ONLY the JSON object matching the schema based on these rules. Do not include explanations or surrounding text.

**IMPORTANT**
*   Perform calculations accurately when converting USD amounts to the target token using the provided rate. Round results appropriately (e.g., 2-4 decimal places).
`;

  return prompt;
}
