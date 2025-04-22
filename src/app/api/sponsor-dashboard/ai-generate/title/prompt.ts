import { type BountyType } from '@prisma/client';
export const generateListingTitlePrompt = (
  description: string,
  type: BountyType,
): string => {
  let typeSpecificGuidance = '';
  if (type !== 'project') {
    typeSpecificGuidance = `
*   **Guidance for Bounty/Task:** Focus the title on the specific action or deliverable. Be very direct.
    *   *Example Bounty Titles:*
        *   Write a Twitter Thread about the AllDomains Experience
        *   Telegram Bot for Copperx Payout 🤖 - Build with AI
        *   Design a Logo for New Startup`;
  } else {
    typeSpecificGuidance = `
*   **Guidance for Project/Role:** Use standard job titles (e.g., Developer, Designer, Artist, Manager). Include seniority (Senior, Junior) or specialization (Backend, Full Stack, UI/UX) if clearly stated or strongly implied in the description. Mentioning a specific company/project name can be good if it's prominent.
    *   *Example Project/Role Titles:*
        *   Backend Developer for Integration work
        *   Senior Full Stack Developer
        *   Arcium - Comics Artist needed!
        *   UI/UX Designer for Mobile App`;
  }

  return `
Analyze the following job description for a listing of type "${type}" and generate a concise, clear, and informative title.

**Core Guidelines for Title Generation:**
*   **Accuracy:** The title must accurately represent the main job role or task described.
*   **Conciseness:** Use as few words as possible while maintaining clarity. Aim for directness.
*   **Length:** The title must be **no longer than 100 characters**.
*   **Clarity:** Clearly state the main job function or deliverable.
*   **Inference:** Infer the title *only* from the provided description, keeping the listing type ("${type}") in mind.

${typeSpecificGuidance}

**Job Description:**
\`\`\`
${description}
\`\`\`

**Output:**
Generate *only* the job title based *strictly* on the description and the guidelines above. Do not add introductory phrases like "Title:", explanations, or any text other than the generated title itself.
`;
};
