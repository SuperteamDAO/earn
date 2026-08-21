import { type GrantApplicationAi } from '@/features/grants/types';

type Review = NonNullable<GrantApplicationAi['review']>;

const labelText = (value?: string) => value?.replace(/_/g, ' ');

const compactText = (value?: string) =>
  value
    ?.replace(/\s+/g, ' ')
    .replace(/^[-*•]\s*/, '')
    .trim();

const normalizeNote = (value?: string) =>
  value
    ?.split('\n')
    .map((line) => line.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
    .join('\n')
    .trim();

const truncate = (value: string, maxLength: number) => {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 3)).trimEnd()}...`;
};

const addMissingRisksToShortNote = (note: string, risks?: string[]) => {
  const compactRisks = risks?.filter(Boolean);
  if (!compactRisks?.length) return note;

  const lowerNote = note.toLowerCase();
  const alreadyIncluded = compactRisks.every((risk) =>
    lowerNote.includes(risk.toLowerCase()),
  );

  if (alreadyIncluded) return note;

  const riskText = `Calibrated risk: ${compactRisks.join(' ')}`;
  const lines = note.split('\n');
  const reviewerCheckIndex = lines.findIndex((line) =>
    line.toLowerCase().startsWith('reviewer check:'),
  );

  if (reviewerCheckIndex >= 0) {
    lines[reviewerCheckIndex] = (lines[reviewerCheckIndex] ?? '').replace(
      /^reviewer check:\s*/i,
      `Reviewer check: ${riskText} `,
    );
    return lines.join('\n');
  }

  return `${note}\nReviewer check: ${riskText}`;
};

const appendBullet = (
  lines: string[],
  title: string,
  value?: string,
  maxLength = 220,
) => {
  const text = compactText(value);
  if (text) lines.push(`• ${title}: ${truncate(text, maxLength)}`);
};

const appendListBullet = (
  lines: string[],
  title: string,
  values?: string[],
  maxItems = 2,
) => {
  const items = values?.map(compactText).filter(Boolean) as
    | string[]
    | undefined;
  if (items?.length) {
    lines.push(`• ${title}: ${items.slice(0, maxItems).join('; ')}`);
  }
};

export const formatGrantApplicationAiReviewNotes = (
  review?: Review,
): string => {
  if (!review) return '';

  const shortNote = normalizeNote(review.shortNote);
  if (shortNote) {
    return addMissingRisksToShortNote(shortNote, review.risks);
  }

  const lines: string[] = [];
  const recommendation = labelText(
    review.recommendation || review.predictedLabel,
  );
  const predictedLabel = labelText(review.predictedLabel);
  const confidence = review.confidence ? `${review.confidence} confidence` : '';

  if (recommendation) {
    const details = [predictedLabel && `label: ${predictedLabel}`, confidence]
      .filter(Boolean)
      .join(', ');
    lines.push(
      `• AI recommendation: ${recommendation}${details ? ` (${details})` : ''}`,
    );
  }

  appendBullet(
    lines,
    'Why',
    review.decisionReason || review.reasoning || review.shortNote,
    260,
  );

  if (review.scores) {
    lines.push(
      `• Scores: PoW ${review.scores.pow}/10, activity ${review.scores.activity}/10, project ${review.scores.core}/10, feasibility ${review.scores.feasibility}/10, impact ${review.scores.impact}/10`,
    );
  }

  appendListBullet(lines, 'Reviewer risks', review.risks);

  if (review.solanaTechnical?.isSolanaTechnical) {
    appendBullet(
      lines,
      'Technical read',
      [
        review.solanaTechnical.summary,
        review.solanaTechnical.technicalCoherence !== 'not_applicable'
          ? `coherence: ${review.solanaTechnical.technicalCoherence}`
          : undefined,
      ]
        .filter(Boolean)
        .join(' '),
      220,
    );
    appendListBullet(
      lines,
      'Missing technical details',
      review.solanaTechnical.missingImplementationDetails,
    );
  }

  if (review.colosseum?.enabled && review.colosseum.summary) {
    appendBullet(lines, 'Colosseum context', review.colosseum.summary, 180);
  }

  return lines.join('\n');
};
