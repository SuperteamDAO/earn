import { type AiGenerateFormValues } from '@/features/listing-builder/components/AiGenerate/schema';
import {
  MAX_BONUS_SPOTS,
  MAX_PODIUMS,
} from '@/features/listing-builder/constants';

const descriptionPromptBounty = (values: AiGenerateFormValues) => `
You need to make drafts for bounties that get listed on Superteam Earn (https://earn.superteam.fun/). Superteam Earn is a freelancer marketplace where sponsors (crypto companies) list competitive tasks (bounties) with defined scopes of work. Talent submits their work directly on the platform to win rewards.

These listings are public-facing, need to be detailed yet succinct (typically 200-400 words), and written directly to the point. Avoid marketing lingo. Use H2 format for section headers.

You will be given the following information provided by the sponsor:

<company-description>
${values.companyDescription}
</company-description>

<scope-of-work>
${values.scopeOfWork}
</scope-of-work>

<rewards>
${values.rewards}
</rewards>

<submission-requirements-and-judging-criterias>
${values.requirements}
</submission-requirements-and-judging-criterias>

**Drafting Instructions:**

Create a bounty listing draft using the information above. Structure the draft using the following sections **in this order** as a primary guide:

## About the Company
*   Use the content from <company-description>.

## Scope of Work
*   Use the content from <scope-of-work>.

## Submission Requirements
*   Use the content specifically for submission requirements from <submission-requirements-and-judging-criterias> Clearly list what needs to be submitted.

## Judging Criteria
*   **Infer** criteria from the <scope-of-work>
 and <submission-requirements-and-judging-criterias>. if possible (e.g., completeness, correctness, creativity mentioned in scope).
*   **If specific criteria cannot be inferred**, state something clear and generic like: "Submissions will be judged based on quality, adherence to the scope of work, and fulfillment of all submission requirements."
*   **Omit this section only if** it feels entirely irrelevant based on the inputs.

## Resources
*   Include any specific links, documentation, or resources mentioned in the <scope-of-work> or <submission-requirements-and-judging-criterias>.
*   **If no specific resources are mentioned**, you may omit this section or, if contextually appropriate, add a placeholder like "Relevant documentation links will be provided to selected participants" (use sparingly).

## Reward Structure
*   Use the content from <rewards>. Clearly state the reward amounts and how they are distributed.
*   If the rewards is given in natural language, it should be calculated accordingly and displayed properly.
*   Structure the compensation properly
*   RULES FOR REWARD:
*   max ${MAX_PODIUMS} podium spots are allowed
*   max ${MAX_BONUS_SPOTS} bonus spots are allowed
*   all bonus spots will the same reward, it is forbidden for bonus spots to have different rewards
*   podiums spots are strictly sequential starting from 1st and ending on ${MAX_PODIUMS}th

**Important Considerations:**

*   **Prioritize Provided Info:** Ensure all relevant details from the input variables are included in the appropriate sections.
*   **Adapt Structure Flexibly:** While the section order above is preferred, slightly adapt the structure *only if necessary* to best present the *provided information*. Do not invent information beyond what's given or reasonably inferred for Judging Criteria/Resources.
*   **Maintain Tone and Length:** Keep the language professional, direct, and within the 200-400 word target.
*   **The Output should only contain the description directly, absolutely avoid adding any greeting, or anything other than final output**
*   **IF Any of the info given by the sponsor is in a calculatable/inferable format, i.e natural language that hints to calculate/infer the specific field, you are supposed to do the calculation and show a proper output
`;

const descriptionPromptProject = (values: AiGenerateFormValues) => `
You need to make drafts for freelancer opportunities that get listed on Superteam Earn (https://earn.superteam.fun/). Superteam Earn is a freelancer marketplace where sponsors (crypto companies) list freelance gigs (projects) where multiple people apply and only one gets selected, and only the selected person does the work.

These listings are public-facing, need to be detailed yet succinct (typically 150-300 words), and written directly to the point. Avoid marketing lingo. Use H2 format for section headers.

You will be given the following information provided by the sponsor:

<company-description>
${values.companyDescription}
</company-description>

<scope-of-work>
${values.scopeOfWork}
</scope-of-work>

<compensation>
${values.rewards}
</compensation>

<evaluation-criteria-or-qualifications>
${values.requirements}
</evaluation-criteria-or-qualifications>

**Drafting Instructions:**

Create a project listing draft using the information above. Structure the draft using the following sections **in this order** as a primary guide:

## About the Company
*   Use the content from <company-description>.

## Project Scope / Responsibilities
*   Use the content from <scope-of-work>.

## Requirements
*   Use the content from <evaluation-criteria-or-qualifications>. Clearly list what the sponsor is looking for in the given role.

## Judging Criteria
*   **Infer** criteria from the <scope-of-work> and <evaluation-criteria-or-qualifications> if possible (e.g., completeness, correctness, creativity mentioned in scope).
*   **If specific criteria cannot be inferred**, state something clear and generic like: "Submissions will be judged based on quality, adherence to the scope of work, and fulfillment of all submission requirements."
*   **Omit this section only if** it feels entirely irrelevant based on the inputs.

## Compensation Structure
*   Use the content from <compensation>. Clearly state the compensation and how they are distributed.
*   If the compensation is given in natural language, it should be calculated accordingly and displayed properly.
*   Structure the compensation properly
*   RULES FOR COMPENSATION 
*   project compensation is of three types, fixed, range and variable
*   fixed compensation means fixed amount, and the applicant cannot change this
*   range means a minimum and maximum amount is given and the applicant has to choose an amount between this range
*   variable means the amount is fully quotable by the applicant, the applicant has to give a quote while filling the application

**Important Considerations:**

*   **Prioritize Provided Info:** Ensure all relevant details from the input variables are included in the appropriate sections.
*   **Adapt Structure Flexibly:** While the section order above is preferred, slightly adapt the structure *only if necessary* to best present the *provided information*. Do not invent information beyond what's given or reasonably inferred for Judging Criteria/Resources.
*   **Maintain Tone and Length:** Keep the language professional, direct, and within the 150-300 word target.
*   **The Output should only contain the description directly, absolutely avoid adding any greeting, or anything other than final output**
*   **IF Any of the info given by the sponsor is in a calculatable/inferable format, i.e natural language that hints to calculate/infer the specific field, you are supposed to do the calculation and show a proper output
`;

const descriptionPromptHackathon = (values: AiGenerateFormValues) => `
You need to make drafts for hackathon side-tracks that get listed on Superteam Earn (https://earn.superteam.fun/). Superteam Earn hosts specific tracks or challenges sponsored by different companies as part of a larger hackathon. Participants build and submit their work based on the track's scope to compete for rewards.

This specific track is part of the "${
  values.hackathonName || 'Unnamed Hackathon'
}".

These listings are public-facing, need to be detailed yet succinct (typically 200-400 words), and written directly to the point. Avoid marketing lingo. Use H2 format for section headers.

You will be given the following information provided by the track sponsor:

<hackathon-name>
${values.hackathonName || 'Unnamed Hackathon'}
</hackathon-name>

<company-description>
${values.companyDescription}
</company-description>

<company-description>
${values.companyDescription}
</company-description>

<scope-of-work>
${values.scopeOfWork}
</scope-of-work>

<rewards>
${values.rewards}
</rewards>

<submission-requirements-and-judging-criterias>
${values.requirements}
</submission-requirements-and-judging-criterias>

**Drafting Instructions:**

Create a hackathon track listing draft using the information above. Structure the draft using the following sections **in this order** as a primary guide:

## About the Sponsor
*   Use the content from <company-description>. Briefly introduce the company sponsoring this specific track and mention the <hackathon-name>.

## Hackathon Track Scope
*   Use the content from <scope-of-work>. Clearly define the challenge, goals, and expected outcomes for this track within the <hackathon-name>.

## Submission Requirements
*   Use the content from <submission-requirements-and-judging-criterias>. Clearly list what needs to be submitted for this track (e.g., code repository link, demo video, presentation slides).

## Judging Criteria
*   **Infer** criteria from the <scope-of-work> and <submission-requirements-and-judging-criterias> if possible (e.g., technical implementation, innovation, alignment with the track theme, completeness).
*   **If specific criteria cannot be inferred**, state something clear and generic like: "Submissions will be judged based on quality, adherence to the track scope, fulfillment of all submission requirements, and overall execution."
*   **Omit this section only if** it feels entirely irrelevant based on the inputs.

## Resources
*   Include any specific links, documentation, APIs, or resources mentioned in the <scope-of-work> or <submission-requirements-and-judging-criterias> relevant to this track.
*   **If no specific resources are mentioned**, you may omit this section or, if contextually appropriate, add a placeholder like "Relevant documentation and links will be provided upon hackathon start."

## Reward Structure
*   Use the content from <rewards>. Clearly state the reward amounts for this track and how they are distributed (e.g., 1st place, 2nd place, pool prize).
*   If the rewards is given in natural language, it should be calculated accordingly and displayed properly.
*   Structure the compensation properly
*   Structure the compensation properly
*   RULES FOR REWARD:
*   max ${MAX_PODIUMS} podium spots are allowed
*   max ${MAX_BONUS_SPOTS} bonus spots are allowed
*   all bonus spots will the same reward, it is forbidden for bonus spots to have different rewards
*   podiums spots are strictly sequential starting from 1st and ending on ${MAX_PODIUMS}th

**Important Considerations:**

*   **Context is Key:** Remember this is a *track* within the larger "${
  values.hackathonName || 'hackathon'
}". Frame the content accordingly.
*   **Prioritize Provided Info:** Ensure all relevant details from the input variables are included in the appropriate sections.
*   **Adapt Structure Flexibly:** While the section order above is preferred, slightly adapt the structure *only if necessary* to best present the *provided information*. Do not invent information beyond what's given or reasonably inferred for Judging Criteria/Resources.
*   **Maintain Tone and Length:** Keep the language professional, direct, encouraging for hackathon participants, and within the 200-400 word target.
*   **The Output should only contain the description directly, absolutely avoid adding any greeting, or anything other than final output**
*   **IF Any of the info given by the sponsor is in a calculatable/inferable format, i.e natural language that hints to calculate/infer the specific field, you are supposed to do the calculation and show a proper output
`;

export const getDescriptionPrompt = (values: AiGenerateFormValues) => {
  switch (values.type) {
    case 'bounty':
      return descriptionPromptBounty(values);
    case 'project':
      return descriptionPromptProject(values);
    case 'hackathon':
      return descriptionPromptHackathon(values);
  }
};
