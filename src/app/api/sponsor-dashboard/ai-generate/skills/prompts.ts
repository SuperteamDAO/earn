import { skillSubSkillMap } from '@/interface/skills';

export function generateListingSkillsPrompt(description: string): string {
  const skillMapString = JSON.stringify(skillSubSkillMap, null, 2);

  const prompt = `
Analyze the following listing description and identify the core skills and sub-skills required for the task.

**Rules and Constraints:**

1.  **Strictly Adhere to Skill Map:** You MUST select skills and sub-skills *only* from the provided \`skillSubSkillMap\`. Do not invent or include skills/sub-skills not present in this map.
2.  **Output Format:** Your output MUST be a valid JSON array of objects. Each object in the array must have the following structure: \`{ skills: string, subskills: string[] }\`.
3.  **Main Skill (\`skills\` field):** The value for the \`skills\` key MUST be one of the main category keys from the \`skillSubSkillMap\` (e.g., "Frontend", "Backend", "Design").
4.  **Sub-Skills (\`subskills\` field):** The value for the \`subskills\` key MUST be an array of strings. Each string in this array MUST correspond to the \`value\` property of a sub-skill object within the relevant main skill category in the \`skillSubSkillMap\`.
5.  **Content-Based Task Identification & Filtering:**
    *   First, determine if the listing description primarily describes a **content creation task**. Examples include writing articles, creating tweet threads, producing videos, photography, graphic design *for content purposes* (like infographics or social media visuals), social media posting, or research *specifically to generate content*.
    *   **If YES (Content-Based Task):** You MUST *only* select skills from the "Content" category and its corresponding sub-skills from the \`skillSubSkillMap\`. Explicitly EXCLUDE skills from all other categories like "Frontend", "Backend", "Blockchain", "Mobile", "Community", "Growth", "Design" and "Other" unless they are *absolutely essential* and *directly mentioned* as required for the content creation process itself (this should be rare for typical content tasks).
    *   **If NO (Not Primarily Content-Based):** Proceed with identifying all relevant skills and sub-skills from the *entire* \`skillSubSkillMap\` based on the description, following the relevance rule below.
6.  **Empty Sub-skills:** If a main skill category is relevant (and allowed based on Rule 5), but no specific sub-skills are mentioned or clearly implied, include the main skill category object with an empty \`subskills\` array (e.g., \`{ "skills": "Content", "subskills": [] }\` or \`{ "skills": "Frontend", "subskills": [] }\`).
7.  **Core Relevance:** Identify only the skill categories and specific sub-skills that are *core* and *essential* to completing the described task. Focus tightly on the primary requirements. Avoid adding skills that are merely related, tangential, or "nice-to-haves" unless explicitly stated as required. Infer sub-skills *only* when strongly justified by the description and they exist in the map (e.g., building a complex interactive web application implies frontend frameworks). Be conservative with inferences.
8.  **Accuracy:** Ensure the selected sub-skills belong to the correct main skill category as defined in the \`skillSubSkillMap\`.

**Allowed Skills Map (\`skillSubSkillMap\`):**
\`\`\`json
${skillMapString}
\`\`\`

**Listing Description:**
\`\`\`text
${description}
\`\`\`

Based *only* on the description provided above and the allowed \`skillSubSkillMap\`, generate the JSON array representing the required skills, strictly following all rules. Ensure the JSON is valid.
`;

  return prompt;
}
