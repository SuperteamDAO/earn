import { type BountyType } from '@prisma/client';

export const generateListingTitlePrompt = (
  description: string,
  type: BountyType,
): string => {
  let typeSpecificGuidance = '';

  if (type !== 'project') {
    typeSpecificGuidance = `
*   **Guidance for Bounty/Task (Type: ${type})**
    *   **Action-Oriented:** The title MUST start with a clear action verb describing the core task (e.g., Create a/an/the, Design a/an/the, Write a/an/the, Integrate, Develop, Build, Research, Analyze,..).
    *   **Grammar:** Keep the grammaer intact and accurate
    *   **Focus:** Concentrate on the specific deliverable or action required. Be very direct.
    *   *Example Bounty Titles:*
        *   Create a Landing Page Mockup
        *   Develop a Telegram Bot for Payouts
        *   Write a Blog Post about Web3 Wallets
        *   Integrate Stripe API for Subscriptions
        *   Design a Logo for E-commerce Site
        *   Optimize Database Queries for Performance
        *   Test Smart Contract Security Flaws
        *   Translate Documentation from English to Spanish`;
  } else {
    typeSpecificGuidance = `
*   **Guidance for Project/Role (Type: ${type})**
    *   **Role-Focused:** Use standard job titles (e.g., Developer, Designer, Artist, Manager, Engineer, Analyst).
    *   **Specificity:** Include seniority (Senior, Junior) or specialization (Backend, Full Stack, UI/UX, Data) if clearly stated or strongly implied.
    *   **Context:** Mentioning a specific company/project name is good if prominent in the description.
    *   *Example Project/Role Titles:*
        *   Backend Developer for API Integration
        *   Senior Full Stack Engineer - React & Node
        *   Arcium - Lead Comics Artist Needed
        *   Junior UI/UX Designer for Mobile App`;
  }

  // Construct the final prompt
  return `
You are an expert title generator. Your task is to analyze the following job description for a listing of type "${type}" and generate a concise, clear, and informative title based *strictly* on the provided text and guidelines.

**Core Guidelines for Title Generation:**
*   **Accuracy:** The title must accurately represent the main job role or task described.
*   **Conciseness:** Use the fewest words possible while maintaining clarity. Be direct. Avoid filler words.
*   **Length:** The title must be **no longer than 100 characters**.
*   **Clarity:** Clearly state the main job function (for projects) or the primary action/deliverable (for bounties).
*   **Inference:** Infer the title *only* from the provided description, keeping the listing type ("${type}") and its specific guidance in mind. Do not add information not present in the description.
*   **Grammar:** Ensure the grammar is accurate

${typeSpecificGuidance}

**Job Description:**
\`\`\`
${description}
\`\`\`

**Output Instructions:**
*   Generate *only* the job title.
*   Do NOT include prefixes like "Title:", quotation marks, explanations, or any text other than the generated title itself.
*   Ensure the output strictly adheres to all guidelines, especially the length limit and type-specific instructions.

**Generated Title:**
`; // The AI should output directly after this line.
};
