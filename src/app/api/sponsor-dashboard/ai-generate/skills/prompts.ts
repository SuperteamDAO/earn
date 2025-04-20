import { skillSubSkillMap } from '@/interface/skills';

export function generateListingSkillsPrompt(description: string): string {
  const skillMapString = JSON.stringify(skillSubSkillMap, null, 2);

  const prompt = `
Analyze the following listing description and identify all relevant skills and sub-skills required for the task.

**Rules and Constraints:**

1.  **Strictly Adhere to Skill Map:** You MUST select skills and sub-skills *only* from the provided \`skillSubSkillMap\`. Do not invent or include skills/sub-skills not present in this map.
2.  **Output Format:** Your output MUST be a valid JSON array of objects. Each object in the array must have the following structure: \`{ skills: string, subskills: string[] }\`.
3.  **Main Skill (\`skills\` field):** The value for the \`skills\` key MUST be one of the main category keys from the \`skillSubSkillMap\` (e.g., "Frontend", "Backend", "Design").
4.  **Sub-Skills (\`subskills\` field):** The value for the \`subskills\` key MUST be an array of strings. Each string in this array MUST correspond to the \`value\` property of a sub-skill object within the relevant main skill category in the \`skillSubSkillMap\`.
5.  **Empty Sub-skills:** If a main skill category is relevant based on the description, but no specific sub-skills are mentioned or clearly implied, include the main skill category object with an empty \`subskills\` array (e.g., \`{ "skills": "Community", "subskills": [] }\`).
6.  **Relevance:** Identify *all* skill categories and specific sub-skills that are reasonably required or strongly implied by the description. Avoid adding skills that are not relevant. Infer sub-skills where appropriate (e.g., if the description mentions building a complex web UI, infer relevant frontend frameworks even if not explicitly named, but *only* if they exist in the map).
7.  **Accuracy:** Ensure the selected sub-skills belong to the correct main skill category as defined in the \`skillSubSkillMap\`.

**Allowed Skills Map (\`skillSubSkillMap\`):**
\`\`\`json
${skillMapString}
\`\`\`

**Listing Description:**
\`\`\`text
${description}
\`\`\`

Based *only* on the description provided above and the allowed \`skillSubSkillMap\`, generate the JSON array representing the required skills.
`;

  return prompt;
}
