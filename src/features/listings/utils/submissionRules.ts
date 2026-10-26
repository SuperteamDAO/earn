import { URL_REGEX } from '@/constants/URL_REGEX';

import { tweetLinkRegex } from '@/features/social/utils/regex';
import {
  extractXHandle,
  INVALID_X_STATUS_LINK_MESSAGE,
  isHandleVerified,
  isXInternalStatusUrl,
  isXUrl,
} from '@/features/social/utils/x-verification';

export interface SubmissionFields {
  readonly link?: string;
  readonly tweet?: string;
  readonly otherInfo?: string;
  readonly eligibilityAnswers?: ReadonlyArray<{
    readonly question: string;
    readonly answer: string;
  }>;
}

export interface SubmissionListing {
  readonly type?: string | null;
  readonly eligibility?: unknown;
}

export interface SubmissionIssue {
  readonly path: ReadonlyArray<string | number>;
  readonly message: string;
}

interface Question {
  readonly question: string;
  readonly optional?: boolean | null;
  readonly isLink?: boolean | null;
  readonly type?: string | null;
}

const isQuestion = (value: unknown): value is Question =>
  typeof value === 'object' &&
  value !== null &&
  'question' in value &&
  typeof value.question === 'string';

// The sponsor's questions, as Earn stores them (a JSON column).
const questionsOf = (eligibility: unknown): Array<Question> =>
  Array.isArray(eligibility) ? eligibility.filter(isQuestion) : [];

// Earn's submission rules (submissionFormSchema), the same on the form and
// on the server: a link, X links only from verified accounts, and answers
// to the sponsor's required questions.
export function submissionIssues(
  listing: SubmissionListing,
  verifiedHandles: ReadonlyArray<string> | null | undefined,
  data: SubmissionFields,
): Array<SubmissionIssue> {
  const issues: Array<SubmissionIssue> = [];
  const add = (path: ReadonlyArray<string | number>, message: string) =>
    issues.push({ path, message });
  const verified = Array.isArray(verifiedHandles) ? [...verifiedHandles] : [];

  if (data.link && !URL_REGEX.test(data.link)) add(['link'], 'Invalid URL');
  if (
    data.tweet &&
    !(tweetLinkRegex.test(data.tweet) || isXInternalStatusUrl(data.tweet))
  ) {
    add(['tweet'], 'Invalid tweet link');
  }

  if (!data.link) add(['link'], 'Add a valid link to continue');

  if (listing.type === 'bounty' && data.tweet) {
    if (isXInternalStatusUrl(data.tweet)) {
      add(['tweet'], INVALID_X_STATUS_LINK_MESSAGE);
    }
  }
  if (listing.type === 'bounty' && data.link) {
    if (isXInternalStatusUrl(data.link)) {
      add(['link'], INVALID_X_STATUS_LINK_MESSAGE);
    }
  }

  for (const field of ['tweet', 'link'] as const) {
    const value = data[field];
    if (value && isXUrl(value) && !isXInternalStatusUrl(value)) {
      const handle = extractXHandle(value);
      if (handle && !isHandleVerified(handle, verified)) {
        add([field], 'We need to verify that you own this X account.');
      }
    }
  }

  const questions = questionsOf(listing.eligibility);
  if (questions.length > 0) {
    if (!data.eligibilityAnswers || data.eligibilityAnswers.length === 0) {
      add(
        ['eligibilityAnswers'],
        'Eligibility answers are required for this listing',
      );
    } else {
      questions.forEach((question, index) => {
        const byQuestion = data.eligibilityAnswers?.find(
          (entry) => entry.question === question.question,
        );
        const byIndex = data.eligibilityAnswers?.[index];
        const answer = (byQuestion?.answer ?? byIndex?.answer)?.trim();
        if (!question.optional && !answer) {
          add(['eligibilityAnswers', index, 'answer'], 'Required');
        }
        if (
          answer &&
          (question.isLink || question.type === 'link') &&
          !URL_REGEX.test(answer)
        ) {
          add(
            ['eligibilityAnswers', index, 'answer'],
            'Please enter a valid URL',
          );
        }
      });
    }
  }
  return issues;
}
