// #!/usr/bin/env bun
//
// import { createDeepSeek } from '@ai-sdk/deepseek';
// import { createOpenAI } from '@ai-sdk/openai';
// import { createXai } from '@ai-sdk/xai';
// import { generateObject } from 'ai';
// import { z } from 'zod';
//
// import { prisma } from './prisma';
//
// const defaultCriteria = [
//   'Ensure emojis are not overused.',
//   'Maintain proper formatting throughout.',
//   'Prioritize high readability in the content.',
//   'Explain concepts clearly so that someone new to crypto can easily understand, avoiding unexplained jargon.',
//   'Incorporate visuals such as images or videos to enhance engagement.',
//   'Include at least 5 tweets or more.',
//   'Include a call-to-action (CTA), such as a sponsor website link or a signup page, for better engagement.',
// ];
//
// // Minimum percentage of criteria that must be met for shortlisting
// const SHORTLIST_THRESHOLD = 60;
//
// // Define the schemas
// const criteriaSchema = z.object({
//   criteria: z
//     .array(z.string())
//     .describe('The extracted evaluation criteria points'),
//   isTwitterBounty: z
//     .boolean()
//     .describe(
//       'Indicates if this bounty requires creating tweets or Twitter content',
//     ),
// });
//
// const evaluationSchema = z.object({
//   label: z
//     .enum(['shortlisted', 'spam', 'not-shortlisted'])
//     .describe('The evaluation result label'),
//   reasoning: z.string().describe('Provide reason for selecting the label'),
// });
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
// export async function extractCriteria(description: string, title: string) {
//   try {
//     // Use Grok AI to extract criteria from the description
//     const { object } = await generateObject({
//       // model: openai('gpt-4o-mini', {
//       //   structuredOutputs: true,
//       // }),
//       model: xai('grok-2-1212'),
//       // model: deepseek('deepseek-chat'),
//       schema: criteriaSchema,
//       prompt: `
// Analyze the listing below for two tasks:
// 1. Determine if this bounty primarily involves creating tweets or Twitter content (including Twitter threads). Set isTwitterBounty to true only if the main deliverable involves Twitter content.
// 2. Extract explicit evaluation criteria points. If no criteria are found, return an empty array.
//   - These will used as instructions for another AI to evaluate submissions,
//   - Ensure clarity and precision.
//   - Look for whole description, not just explicitly mentioned criteria's
//   - Make sure the evaluation criteria are clear and useful for AI to review the submissions. Do not include any irrelevant information.
//   - Make sure to mention all required tags and hashtags asked in the description
//   - Do not include any criteria saying "submit on superteam earn" or similar
//   - Do not include any criteria saying "submit on twitter or x.com" or similar
//   - Make sure the points are instructing the AI on how to review and what to look for
//
// Title: ${title}
// Description:
// ${description}
//       `,
//     });
//
//     const filteredArray = object.criteria.filter(
//       (str) =>
//         !str.toLowerCase().includes('superteam earn') &&
//         !str.toLowerCase().includes('twitter') &&
//         !str.toLowerCase().includes('x.com'),
//     );
//     object.criteria = filteredArray;
//     return object;
//   } catch (error) {
//     console.error('Error extracting criteria:', error);
//     return { criteria: [], isTwitterBounty: false };
//   } finally {
//     await prisma.$disconnect();
//   }
// }
//
// export async function evaluateSubmission(
//   submissionId: string,
//   bountyTitle: string,
//   criteriaPoints: string[],
// ) {
//   try {
//     // Fetch the submission
//     const submission = await prisma.submission.findUnique({
//       where: {
//         id: submissionId,
//       },
//       select: {
//         link: true,
//         tweet: true,
//       },
//     });
//
//     if (!submission) {
//       throw new Error('Submission not found');
//     }
//
//     // Combine default and specific criteria
//     const allCriteria = [...criteriaPoints];
//
//     const prompt = `
// You are an expert submission evaluator. Analyze the submission against the given criteria and determine if it should be shortlisted, marked as spam, or not shortlisted.
//
// Submission Content:
// Tweet/Thread: ${submission.link || 'N/A'}
//
// Bounty Title: ${bountyTitle}
//
// Evaluation Criteria (${SHORTLIST_THRESHOLD}% must be met for shortlisting):
// ${allCriteria.map((criterion, index) => `${index + 1}. ${criterion}`).join('\n')}
//
// Instructions:
// 1. First, check if the submission is relevant to the bounty title and criteria:
//    - If the content is completely unrelated or appears to be spam, label as "spam"
//    - If relevant, continue with detailed evaluation
//
// 2. For relevant submissions:
//    - Evaluate how well each criterion is met
//    - Calculate the percentage of criteria that are adequately fulfilled
//    - If >= ${SHORTLIST_THRESHOLD}% of criteria are met, label as "shortlisted"
//    - If < ${SHORTLIST_THRESHOLD}% of criteria are met but content is relevant, label as "not-shortlisted"
//
// 3. Consider:
//    - Quality and relevance of content
//    - Adherence to specified format and requirements
//    - Overall effort and professionalism
//
// 4. Reasoning:
//    - Then Provide a brief reasoning for your decision.
//
// Determine the appropriate label now:
// `;
//
//     console.log('Prompt: \n', prompt);
//     // Use XAI to evaluate the submission
//     const { object } = await generateObject({
//       model: xai('grok-2-1212'),
//       schema: evaluationSchema,
//       prompt,
//     });
//
//     return object;
//   } catch (error) {
//     console.error('Error evaluating submission:', error);
//     // Default to not-shortlisted in case of errors
//     return {
//       label: 'not-shortlisted' as const,
//       reasoning: 'Error evaluating submission',
//     };
//   }
// }
//
// async function main() {
//   const args = process.argv.slice(2);
//   const slug = args[0];
//   console.log('slug', slug);
//   const submissionId = '697d85ab-a889-4ce9-ab57-9a3e0316df6d';
//   try {
//     // Fetch the listing description from the database
//     const listing = await prisma.bounties.findUnique({
//       where: {
//         slug,
//       },
//       select: {
//         description: true,
//         title: true,
//       },
//     });
//
//     if (!listing || !listing.description) {
//       throw new Error('Listing not found or has no description');
//     }
//
//     const criterias = await extractCriteria(listing.description, listing.title);
//     console.log(criterias.criteria);
//     console.log('Is Twitter Bounty:', criterias.isTwitterBounty);
//
//     if (!criterias.isTwitterBounty) throw new Error('Not a twitter bounty');
//
//     const evaluationResult = await evaluateSubmission(
//       submissionId,
//       listing.title,
//       criterias.criteria,
//     );
//     console.log('Evaluation Result:', evaluationResult.label);
//     console.log('Evaluation reason:', evaluationResult.reasoning);
//   } catch (err) {
//     console.log('error in main', err);
//   }
// }
// main();
//
// // async function testEval() {
// //   const prompt = `
// // tell me what this tweet is about
// // https://x.com/IRA_therabbit/status/1811062878130074085
// // `;
// //
// //   const twitter = new TwitterClient();
// //   const { text } = await generateText({
// //     model: xai('grok-2-1212'),
// //     prompt,
// //     tools: createAISDKTools(weather),
// //   });
// //
// //   console.log('text resp \n', text);
// // }
// // await testEval();
