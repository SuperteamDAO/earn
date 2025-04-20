import { type BountyType } from '@prisma/client';

export function generateListingQuestionsPrompt(
  description: string,
  type: BountyType,
): string {
  let prompt = `Analyze the following listing description for a '${type}' on platform Superteam Earn. Your goal is to generate relevant custom questions for the application/submission form, following the specific rules for the listing type.

<listing-description>
${description}
</listing-description>

General Rules for Generated Questions:
- Questions should help fairly evaluate the applicant/submission based *only* on the description provided.
- Aim for questions that encourage demonstrating Proof-of-Work, creativity, confidence, or what makes the applicant/submission stand out.
- AVOID questions answerable with a simple 'Yes' or 'No'.
- AVOID questions whose answers are purely subjective opinions or cannot be verified without direct interaction (e.g., "Are you passionate about X?").
- Focus on question QUALITY, not quantity. Fewer high-quality questions are better than many low-quality ones.
- Keep the questions consise and short, avoid over complicating them.
- Keep the questions **under 175 characters**
`;

  if (type === 'bounty' || type === 'hackathon') {
    prompt += `
${type}-Specific Rules:
- Bounty submissions already have a required 'Submission Link' field and an optional 'Tweet Link' field.
- Custom questions are OPTIONAL for bounties.
- Critically evaluate if the provided description necessitates *any* custom questions beyond the default fields.
- If the Submission Link (and potentially Tweet Link) is sufficient to evaluate the work based on the description (e.g., simple tweet tasks, code submissions where the link shows everything), then output EMPTY ARRAY
- If custom questions ARE needed, generate a maximum of 2. They should focus on clarifying aspects of the *submitted work* itself (e.g., asking about methodology, rationale, specific choices made) that might not be obvious from the submission link alone.

Generate the custom questions (or return empty array):`;
  } else {
    prompt += `
Project-Specific Rules:
- Project applications are used to *select* a candidate *before* work begins. There are no default questions.
- Custom questions are MANDATORY for projects. You MUST generate at least one question.
- Generate relevant questions based *only* on the description to help the sponsor choose the best applicant for the job/freelance role.
- Since there are no default questions, we need to ask portfolio/proof of work in the question if the question fits the description
- Questions should probe the applicant's suitability, relevant experience, understanding of the requirements, proposed approach, or portfolio, as applicable based on the description.

Generate the mandatory custom questions:`;
  }

  return prompt;
}
