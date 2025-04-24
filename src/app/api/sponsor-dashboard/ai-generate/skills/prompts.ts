import { skillSubSkillMap } from '@/interface/skills';

import { devSkills } from '@/features/talent/utils/skills';

export function generateListingSkillsPrompt(description: string): string {
  const skillMapString = JSON.stringify(skillSubSkillMap, null, 2);
  const devSkillsListString = JSON.stringify(devSkills);

  const prompt = `
### Task Overview
Analyze the provided listing description. Your primary goal is to identify the essential skills and sub-skills required to complete the task described.

### Core Objective
Extract only the skills and sub-skills that are central to the task, based *exclusively* on the provided \`skillSubSkillMap\`.

### Output Requirements
Produce a valid JSON array of objects as your final output. Each object in the array must strictly follow this structure: \`{ skills: string, subskills: string[] }\`.

---

### Detailed Rules and Constraints

1.  **Skill Map Exclusivity:** Select skills and sub-skills *only* from the provided \`skillSubSkillMap\`. Ensure no skills or sub-skills outside this map are included in your output.
2.  **JSON Structure Adherence:** Confirm your output is a valid JSON array where each object contains exactly two keys: \`skills\` (string) and \`subskills\` (array of strings).
3.  **Main Skill Validation:** Verify that the value for the \`skills\` key is always one of the main category keys listed in the \`skillSubSkillMap\` (e.g., "Frontend", "Backend", "Design").
4.  **Sub-Skill Validation:** Ensure every string within the \`subskills\` array corresponds precisely to a \`value\` property of a sub-skill object under the relevant main skill category in the \`skillSubSkillMap\`.
5.  **Content Task Identification and Filtering:**
    *   **Initial Assessment:** First, determine if the listing description's primary focus is a **content creation task**. Examples include writing articles, creating tweet threads, producing videos, photography, graphic design *for content purposes* (like infographics, social media visuals), social media posting, or research *specifically to generate content*.
    *   **If YES (Content-Based Task):**
        *   **Tweet Creation Specifics:** For tasks solely focused on writing/creating tweets or threads, restrict your skill selection *exclusively* to the "Content" category (likely 'Writing' and/or 'Social Media').
        *   **General Content Tasks:** For other content tasks, prioritize skills from the "Content" category. Carefully evaluate if any skills from other categories are *essential* and required for the content creation itself.
    *   **If NO (Not Primarily Content-Based):** Proceed to identify relevant skills and sub-skills from the *entire* \`skillSubSkillMap\`, applying the relevance rules below.
6.  **Empty Sub-skills Rule (CRITICAL):**
    *   **Permitted Cases:** Allow an empty \`subskills\` array (\`[]\`) *only* for the main skill categories designated as 'dev skills': ${devSkillsListString}.
    *   **Application:** If a 'dev skill' category is relevant (and allowed by Rule 5) but no specific sub-skills are mentioned or clearly implied, include the main skill object with an empty \`subskills\` array (Example: \`{ "skills": "Backend", "subskills": [] }\`).
    *   **Restricted Cases:** For **all other** main skill categories (e.g., 'Content', 'Design', 'Community', 'Growth', 'Other'), including the category requires identifying at least one specific, relevant sub-skill from the map. If no applicable sub-skill is found for these non-dev categories, *omit the category object entirely*. An empty \`subskills\` array for these categories is considered invalid output.
7.  **Strict Core Relevance & Task Type Filtering:** Apply extreme conservatism. Identify *only* skill categories and specific sub-skills that are *absolutely essential* and *central* to performing the described task.
    *   **Development Skills:** Reserve 'Frontend', 'Backend', 'Blockchain', or 'Mobile' categories strictly for tasks involving software development, coding, building technical components, fixing code-related bugs, technical documentation, or technical decisions. Avoid assigning these skills to tasks like product feedback, user testing (unless writing test code is involved).
    *   **Community & Growth Skills:** Apply strong conservatism. Include 'Community' or 'Growth' categories only when the task's primary focus clearly aligns with these roles (e.g., community management, moderation, marketing, business development) or when they are an *explicitly stated core requirement*. Refrain from adding them to simple, task-specific bounties unless directly required for *that specific bounty*.
    *   **General Principle:** Focus exclusively on the primary requirements mentioned. Refrain from adding skills that are merely related, tangential, or "nice-to-haves" unless explicitly stated as required. Infer sub-skills only when strongly justified by the description and they exist in the map. Maintain a conservative approach to inferences.
8.  **Accuracy Check:** Before finalizing, double-check that all selected sub-skills belong to their correct main skill category as defined in the \`skillSubSkillMap\`.

---

### Context: Allowed Skills Map (\`skillSubSkillMap\`)
\`\`\`json
${skillMapString}
\`\`\`

---

### Input: Listing Description
\`\`\`text
${description}
\`\`\`

---

### Final Instruction
Generate the JSON array representing the required skills based *only* on the provided description and the allowed \`skillSubSkillMap\`. Adhere strictly to ALL rules outlined above. Ensure the final output is valid JSON, conforms precisely to the specified format, respects all constraints (especially regarding empty subskill arrays and core task relevance), and accurately reflects the essential requirements of the listing.
`;

  return prompt;
}
