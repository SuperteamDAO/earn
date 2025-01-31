// #!/usr/bin/env bun
//
// import { createDeepSeek } from '@ai-sdk/deepseek';
// import { createOpenAI } from '@ai-sdk/openai';
// import { createXai } from '@ai-sdk/xai';
// import { generateObject, type LanguageModel, type LanguageModelV1 } from 'ai';
// import { z } from 'zod';
//
// import { eligibilityQuestionSchema } from './features/listing-builder/types/schema';
// import { prisma } from './prisma';
//
// type ModelName = 'deepseekV3' | 'gpt4o' | 'grok2';
//
// // model: openai('gpt-4o-mini', {
// //   structuredOutputs: true,
// // }),
// // model: xai('grok-2-1212'),
// // model: deepseek('deepseek-chat'),
// function modalUse(model: ModelName) {
//   switch (model) {
//     case 'grok2':
//       return xai('grok-2-1212');
//     case 'gpt4o':
//       return openai('gpt-4o-mini', {
//         structuredOutputs: true,
//       });
//     case 'deepseekV3':
//       return deepseek('deepseek-chat');
//   }
// }
//
// type CostsPerMillion = {
//   [key in ModelName]: {
//     input: number;
//     output: number;
//   };
// };
//
// function calculateCost(
//   inputTokens: number,
//   outputTokens: number,
//   modelName: ModelName,
// ): number {
//   const costsPerMillion: CostsPerMillion = {
//     deepseekV3: {
//       input: 0.14,
//       output: 0.28,
//     },
//     gpt4o: {
//       input: 1.25,
//       output: 10,
//     },
//     grok2: {
//       input: 2,
//       output: 10,
//     },
//   };
//   if (!costsPerMillion[modelName]) {
//     throw new Error('Invalid model name');
//   }
//
//   const modelCosts = costsPerMillion[modelName];
//
//   const inputCost = (inputTokens / 1_000_000) * modelCosts.input;
//   const outputCost = (outputTokens / 1_000_000) * modelCosts.output;
//
//   return inputCost + outputCost;
// }
//
// const xai = createXai({
//   apiKey: process.env.XAI_API_KEY,
// });
// const deepseek = createDeepSeek({
//   apiKey: process.env.DEEPSEEK_API_KEY ?? '',
// });
// const openai = createOpenAI({
//   apiKey: process.env.OPENAI_API_KEY ?? '',
// });
//
// let totalInputTokens = 0;
// let totalOutputTokens = 0;
//
// // Define the schemas
// const criteriaSchema = z.object({
//   required_criteria: z
//     .array(z.string())
//     .describe(`Contains the criterias that are required for shortlisting`),
//   preferred_criteria: z
//     .array(z.string())
//     .describe(
//       'Contains the criterias that are preffered but not necessary for shortlisting',
//     ),
// });
//
// const criteriaSystemPrompt = `
// You are an advanced job-listing analysis and criteria extraction engine.
// Your primary goal is to read the sponsor's job listing details and produce two sets of succinct, high-quality criteria:
//
// 1. required_criteria:
//    - Skills or qualifications that are absolutely necessary for a candidate to avoid being disqualified or flagged as spam.
//    - Often implied by words like "must have," "must be able to," "required," or "essential."
//
// 2. preferred_criteria:
//    - Skills or qualifications that are beneficial or nice-to-have but not strictly mandatory.
//    - Often implied by words like "preferred," "nice to have," "bonus," or "ideal."
//
// ### Key Points:
// 1. **Relevance & Actionability**:
//    - Another AI system will later use these criteria to judge candidate applications (both their mandatory answers and optional "anything else" field).
//    - Therefore, your criteria must be directly actionable and tied to real requirements inferred from the listing or custom questions.
//
// 2. **Integrating Custom Questions**:
//    - The listing may include custom questions (e.g., "What's your GitHub profile?" or “Describe your experience with X”).
//    - If a question suggests a crucial skill (e.g., needing to showcase open-source work) or a strong plus (e.g., a personal blog link), incorporate that into required_criteria or preferred_criteria appropriately.
//
// 3. **Clarity & Brevity**:
//    - Keep each criterion short, clearly worded, and grammatically correct.
//    - Avoid large paragraphs—just bullet-like statements.
//
// 4. **No Over-Inflation or Fiction**:
//    - Only include criteria that logically follow from the job title, description, sponsor context, and custom questions.
//    - If the listing is ambiguous about a requirement, consider it "preferred" rather than "required."
//
// 5. **Edge Cases**:
//    - If no requirements or preferences are clearly specified, return empty lists (or minimal items).
//    - If the sponsor text is extremely short or vague, do the best you can without inventing demands.
//
// Your final output should be two arrays:
// - **required_criteria**: string[]
// - **preferred_criteria**: string[]
//
// Focus on **quality** and **usability** of the criteria themselves.
// `;
//
// function criteriaUserPrompt({
//   title,
//   description,
//   sponsorName,
//   sponsorBio,
//   customQuestions,
// }: {
//   title: string;
//   description: string;
//   sponsorName: string;
//   sponsorBio: string | null;
//   customQuestions: Array<{
//     order: number;
//     question: string;
//     type: 'text' | 'link';
//   }>;
// }) {
//   // Format the custom questions in a readable way:
//   const questionsList = customQuestions
//     .map((q) => `  - [${q.type.toUpperCase()}]: ${q.question}`)
//     .join('\n');
//
//   return `
// Below is a sponsor's job listing. Please produce high-quality, actionable criteria under two categories:
// "required_criteria" and "preferred_criteria."
// Remember:
// - These criteria will be used by another AI to evaluate whether applications are spam or worth shortlisting.
// - The custom questions below may imply additional must-have or nice-to-have requirements.
// - Provide concise, clear statements in each criteria array.
//
// ---
// Sponsor Name: ${sponsorName}
// ${sponsorBio ? `Sponsor Bio: ${sponsorBio}` : ''}
//
// Job Title: ${title}
//
// Job Description:
// ${description}
//
// Custom Questions:
// ${questionsList}
//
// ---
// **Instructions Recap**:
// 1. Identify any explicitly mandated qualifications or strongly implied requirements as "required_criteria."
// 2. Identify any beneficial but optional abilities or experience as "preferred_criteria."
// 3. If a custom question clearly indicates a required skill or link, include it appropriately.
// 4. Do not fabricate requirements not implied by the listing.
// 5. Keep each criterion grammatically correct and to-the-point.
//
// Now, based on all the info above, produce two arrays:
// - required_criteria
// - preferred_criteria
//
// Thank you for ensuring clarity and accuracy.
// `;
// }
//
// async function extractCriteria(
//   prompt: string,
//   languageModel: LanguageModel | LanguageModelV1,
// ) {
//   try {
//     const { object, usage } = await generateObject({
//       // model: openai('gpt-4o-mini', {
//       //   structuredOutputs: true,
//       // }),
//       // model: xai('grok-2-1212'),
//       // model: deepseek('deepseek-chat'),
//       model: languageModel,
//       schema: criteriaSchema,
//       system: criteriaSystemPrompt,
//       prompt,
//     });
//     totalInputTokens += usage.promptTokens;
//     totalOutputTokens += usage.completionTokens;
//
//     // const filteredRequiredArray = object.required_criteria.filter(
//     //   (str) =>
//     //     !str.toLowerCase().includes('superteam earn') &&
//     //     !str.toLowerCase().includes('twitter') &&
//     //     !str.toLowerCase().includes('x.com'),
//     // );
//     // object.required_criteria = filteredRequiredArray;
//     return object;
//   } catch (error) {
//     console.error('Error extracting criteria:', error);
//     return {
//       required_criteria: [],
//       preferred_criteria: [],
//     };
//   }
// }
// const evaluationSchema = z.object({
//   label: z
//     .enum(['shortlisted', 'spam', 'not-shortlisted'])
//     .describe('The evaluation result label'),
//   reasoning: z
//     .string()
//     .describe('Provide reason for selecting the label in less than 50 words'),
//   confidenceScore: z
//     .number()
//     .describe(
//       'Confidence score for your review, minimum 0 and maximum 10, 0 decimals',
//     ),
// });
//
// type EvaluationResult = z.infer<typeof evaluationSchema> & {
//   submissionId: string;
//   submitterName: string;
//   submissionStatus: string;
//   submissionLabel: string;
// };
//
// const evaluationSystemPrompt = `
// You are an advanced evaluator for job applications. Your task is to read:
//
// 1) A set of criteria (divided into required_criteria and preferred_criteria).
// 2) The candidate’s application answers to both required questions and the optional “anything else” field.
//
// From these inputs, produce a final evaluation in the form:
//
// {
//   "label": "shortlisted" | "spam" | "not-shortlisted",
//   "reasoning": "< 50 words to justify your decision>",
//   "confidenceScore": <integer 0-10>
// }
//
// ### Decision Rules:
//
// 1. **Required Criteria**:
//    - If the candidate’s answers clearly fail to meet the mandatory requirements or are obviously off-topic/nonsensical, classify as "spam"
//    - If the answers are coherent yet do not fulfill major required skills/experiences, lean toward "not-shortlisted."
//
// 2. **Preferred Criteria**:
//    - Check if the candidate provides evidence of the "nice-to-have" skills. This can tip the scale toward "shortlisted" if required criteria are also reasonably met.
//
// 3. **Spam Indicators**:
//    - Completely off-topic or nonsensical answers,
//    - Repetitive filler text,
//    - No response to crucial required questions,
//    - Malicious or irrelevant links,
//    - Clear mismatch with the role described.
//
// 4. **Shortlisting Conditions**:
//    - If the candidate convincingly meets all or nearly all required criteria and addresses them clearly,
//    - If the candidate’s "anything else" field adds relevant, high-value info,
//    - If the answers match sponsor’s custom questions in a meaningful way.
//
// 5. **Not-Shortlisted** vs. **Spam**:
//    - "not-shortlisted" is for coherent, non-spam candidates who simply don’t match the criteria well enough.
//    - "spam" is for blatantly off-topic or nonsense applications.
//
// 6. **Reasoning** (under 50 words):
//    - Summarize your core rationale briefly. Avoid repeating the entire application details.
//
// 7. **Confidence Score** (0–10, integer):
//    - Reflects your certainty. Higher scores if the classification is unambiguous. Lower if borderline.
//
// Adhere to these rules strictly and output only the final JSON, with no extra commentary or fields.
// `;
//
// function createEvaluationUserPrompt({
//   requiredCriteria,
//   preferredCriteria,
//   candidateAnswers,
//   anythingElse,
// }: {
//   requiredCriteria: string[];
//   preferredCriteria: string[];
//   candidateAnswers: Array<{
//     question: string;
//     answer: string;
//   }>;
//   anythingElse: string;
// }) {
//   // Format the criteria arrays:
//   const requiredCriteriaList = requiredCriteria.length
//     ? requiredCriteria.map((c) => `- ${c}`).join('\n')
//     : 'No required criteria found';
//
//   const preferredCriteriaList = preferredCriteria.length
//     ? preferredCriteria.map((c) => `- ${c}`).join('\n')
//     : 'No preferred criteria found';
//
//   // Format the candidate answers:
//   const answersSection = candidateAnswers
//     .map(
//       (item, index) =>
//         `(${index + 1}) Question: ${item.question}\n    Answer: ${item.answer}`,
//     )
//     .join('\n\n');
//
//   return `
// Below are the evaluation inputs:
//
// ## Criteria
// Required Criteria:
// ${requiredCriteriaList}
//
// Preferred Criteria:
// ${preferredCriteriaList}
//
// ## Candidate's Answers
// ${answersSection}
//
// ## "Anything Else" Response
// ${anythingElse}
//
// ---
// ### Instructions Recap:
//
// 1. You have the "required_criteria" and "preferred_criteria" above.
// 2. Classify this application as:
//    - "shortlisted" if the candidate meets or exceeds the mandatory requirements, and the answers are coherent.
//    - "spam" if answers are off-topic, nonsensical, or clearly fail basic criteria.
//    - "not-shortlisted" if it's coherent but not strong enough to be shortlisted.
// 3. Provide a brief "reasoning" (under 50 words) explaining your decision.
// 4. Provide a "confidenceScore" (integer from 0 to 10) indicating how certain you are.
//
// Return a valid JSON object with:
// {
//   "label": "shortlisted" | "spam" | "not-shortlisted",
//   "reasoning": "< 50 words>",
//   "confidenceScore": <integer 0-10>
// }
// `.trim();
// }
//
// async function evaluateApplication(
//   prompt: string,
//   languageModel: LanguageModel | LanguageModelV1,
// ): Promise<z.infer<typeof evaluationSchema>> {
//   try {
//     const { object, usage } = await generateObject({
//       // model: openai('gpt-4o-mini', {
//       //   structuredOutputs: true,
//       // }),
//       // model: xai('grok-2-1212'),
//       // model: deepseek('deepseek-chat'),
//       model: languageModel,
//       schema: evaluationSchema,
//       system: evaluationSystemPrompt,
//       prompt,
//     });
//
//     totalInputTokens += usage.promptTokens;
//     totalOutputTokens += usage.completionTokens;
//     // const filteredRequiredArray = object.required_criteria.filter(
//     //   (str) =>
//     //     !str.toLowerCase().includes('superteam earn') &&
//     //     !str.toLowerCase().includes('twitter') &&
//     //     !str.toLowerCase().includes('x.com'),
//     // );
//     // object.required_criteria = filteredRequiredArray;
//     return object;
//   } catch (error) {
//     console.error('Error extracting criteria:', error);
//     return {
//       label: 'not-shortlisted',
//       reasoning: '',
//       confidenceScore: 0,
//     };
//   }
// }
//
// async function main() {
//   const args = process.argv.slice(2);
//   const slug = args[0];
//   console.log('slug', slug);
//
//   const timings: number[] = [];
//   const model: ModelName = 'grok2';
//   const modelLLM = modalUse(model);
//
//   const startAll = performance.now();
//   try {
//     const listing = await prisma.bounties.findUnique({
//       where: {
//         slug,
//       },
//       select: {
//         description: true,
//         title: true,
//         eligibility: true,
//         sponsor: {
//           select: {
//             name: true,
//             bio: true,
//           },
//         },
//         Submission: {
//           select: {
//             eligibilityAnswers: true,
//             otherInfo: true,
//             id: true,
//             label: true,
//             status: true,
//             user: {
//               select: {
//                 firstName: true,
//                 lastName: true,
//               },
//             },
//           },
//         },
//       },
//     });
//
//     if (!listing || !listing.description) {
//       throw new Error('Listing not found or has no description');
//     }
//
//     const criteriaStart = performance.now();
//     const criteriaContextPrompt = criteriaUserPrompt({
//       title: listing.title,
//       description: listing.description,
//       sponsorName: listing.sponsor.name,
//       sponsorBio: listing.sponsor.bio,
//       customQuestions:
//         z.array(eligibilityQuestionSchema).safeParse(listing.eligibility)
//           .data || [],
//     });
//
//     const criterias = await extractCriteria(criteriaContextPrompt, modelLLM);
//     const criteriaEnd = performance.now();
//     const criteriaTime = criteriaEnd - criteriaStart;
//     console.log(criterias);
//
//     const results: EvaluationResult[] = [];
//     for (const submission of listing.Submission) {
//       const submissionStart = performance.now();
//       const evaluationContext = createEvaluationUserPrompt({
//         requiredCriteria: criterias.required_criteria,
//         preferredCriteria: criterias.preferred_criteria,
//         anythingElse: submission.otherInfo || '',
//         candidateAnswers: submission.eligibilityAnswers as any,
//       });
//       const submissionResult = await evaluateApplication(
//         evaluationContext,
//         modelLLM,
//       );
//       console.log(
//         'submission result for ',
//         (submission.user.firstName || '') + (submission.user.lastName || ''),
//       );
//       console.log(submissionResult);
//       const submissionEnd = performance.now();
//       const submissionTotaltTime = submissionEnd - submissionStart;
//       console.log(
//         'time taken for submission evaluation',
//         submissionTotaltTime.toFixed(2),
//       );
//       timings.push(submissionTotaltTime);
//       results.push({
//         submissionId: submission.id,
//         submitterName:
//           (submission.user.firstName || '') +
//             (submission.user.lastName || '') || '',
//         submissionLabel: submission.label,
//         submissionStatus: submission.status,
//         ...submissionResult,
//       });
//     }
//     const endAll = performance.now();
//
//     const totalTime = endAll - startAll;
//     const averageTime =
//       timings.reduce((sum, time) => sum + time, 0) / timings.length;
//
//     console.log('\n\n\n');
//     console.log('EVALUATION');
//
//     console.log('total submissions', listing.Submission.length);
//     const evaluationShortlisted = evaluateShortlisteds(results);
//     console.log('evaluation Shortlisted - ', evaluationShortlisted);
//
//     const predictedShortlisted = results.filter(
//       (s) => s.label === 'shortlisted',
//     );
//     const correctShortlisted = predictedShortlisted.filter(
//       (s) => s.submissionLabel === 'Shortlisted',
//     );
//     const actualShortlisted = results.filter(
//       (s) => s.submissionLabel === 'Shortlisted',
//     );
//     // const falseNegatives = results.filter(
//     //   (s) => s.submissionLabel === 'Shortlisted' && s.label !== 'shortlisted',
//     // );
//     // const shortlistedAccuracy = calculateAccuracy(
//     //   correctShortlisted.length,
//     //   predictedShortlisted.length,
//     // );
//     // const missRate = calculateAccuracy(
//     //   falseNegatives.length,
//     //   actualShortlisted.length,
//     // );
//     console.log('predicted shortlisted count', predictedShortlisted.length);
//     console.log(
//       'predicted  shortlited names',
//       predictedShortlisted.map((s) => s.submitterName),
//     );
//     console.log('correctly shortlisted count', correctShortlisted.length);
//     console.log(
//       'correctly shortlited names',
//       correctShortlisted.map((s) => s.submitterName),
//     );
//     console.log('actual shortlisted count', actualShortlisted.length);
//     console.log(
//       'actual shortlited names',
//       actualShortlisted.map((s) => s.submitterName),
//     );
//     // console.log('missRate count', falseNegatives.length);
//     // console.log(
//     //   'missRate names',
//     //   falseNegatives.map((s) => s.submitterName),
//     // );
//     //
//     // console.log('shortlited accuracy', shortlistedAccuracy);
//     // console.log('missRate percentage', missRate);
//     console.log('\n\n\n');
//     const evaluationSpams = evaluateSpams(results);
//     console.log('evaluation spams - ', evaluationSpams);
//
//     const predictedSpam = results.filter((s) => s.label === 'spam');
//     const correctSpamm = predictedSpam.filter(
//       (s) => s.submissionLabel === 'Spam',
//     );
//     const actualSpam = results.filter(
//       (r) => r.submissionLabel === 'spam' || r.submissionStatus === 'Rejected',
//     );
//     // const spamAccuracy = calculateAccuracy(
//     //   predictedSpam.length,
//     //   actualSpam.length,
//     // );
//     console.log('predicted spam count', predictedSpam.length);
//     console.log(
//       'predicted spam names',
//       predictedSpam.map((s) => s.submitterName),
//     );
//     console.log('correctly spam count', correctSpamm.length);
//     console.log(
//       'correctly spam names',
//       correctSpamm.map((s) => s.submitterName),
//     );
//     console.log('actual spam count', actualSpam.length);
//     console.log(
//       'actual spam names',
//       actualSpam.map((s) => s.submitterName),
//     );
//     // console.log('spam accuracy', spamAccuracy);
//     //
//     // console.log('\n\n\n');
//     // const notShortlisted = results.filter((s) => s.label === 'not-shortlisted');
//     // console.log('not shortlisted count', notShortlisted.length);
//     // console.log(
//     //   'not shortlisted names',
//     //   notShortlisted.map((s) => s.submitterName),
//     // );
//
//     console.log('\n\n\n');
//     console.log('PERFORMANCE');
//     console.log('Criteria Generation Time ', criteriaTime.toFixed(2));
//     console.log('Total time for everything ', totalTime.toFixed(2));
//     console.log('Avg Time for submission evaluation', averageTime.toFixed(2));
//
//     console.log('\n\n\n');
//     console.log('TOTAL COST');
//
//     const cost = calculateCost(totalInputTokens, totalOutputTokens, model);
//     console.log('IN USD - $', cost);
//   } catch (err) {
//     console.log('error in main', err);
//   }
// }
// await main();
//
// function calculateAccuracy(
//   correctPredictions: number,
//   totalPredictions: number,
// ): number {
//   if (totalPredictions === 0) {
//     return 0; // Avoid division by zero
//   }
//   return (correctPredictions / totalPredictions) * 100; // Returns accuracy as a percentage
// }
//
// function evaluateShortlisteds(results: EvaluationResult[]) {
//   const TP = results.filter(
//     (s) => s.label === 'shortlisted' && s.submissionLabel === 'Shortlisted',
//   ).length;
//   const FP = results.filter(
//     (s) => s.label === 'shortlisted' && s.submissionLabel !== 'Shortlisted',
//   ).length;
//   const FN = results.filter(
//     (s) => s.submissionLabel === 'Shortlisted' && s.label !== 'shortlisted',
//   ).length;
//
//   const precision = TP / (TP + FP || 1); // Avoid division by zero
//   const recall = TP / (TP + FN || 1);
//   const f1 = (2 * (precision * recall)) / (precision + recall || 1);
//
//   return {
//     precision: precision * 100,
//     recall: recall * 100,
//     f1Score: f1 * 100,
//   };
// }
//
// function evaluateSpams(results: EvaluationResult[]) {
//   const actualSpam = results.filter((s) => s.submissionLabel === 'Spam');
//   const TP = actualSpam.filter((s) => s.label === 'spam').length;
//   const FP = results.filter(
//     (s) => s.label === 'spam' && !actualSpam.includes(s),
//   ).length;
//   const FN = actualSpam.filter((s) => s.label !== 'spam').length;
//
//   const precision = TP / (TP + FP || 1); // Avoid division by zero
//   const recall = TP / (TP + FN || 1);
//   const f1 = (2 * (precision * recall)) / (precision + recall || 1);
//
//   return {
//     precision: precision * 100,
//     recall: recall * 100,
//     f1Score: f1 * 100,
//   };
// }
