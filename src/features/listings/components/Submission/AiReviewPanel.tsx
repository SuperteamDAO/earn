import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, CircleAlert } from 'lucide-react';
import { useState } from 'react';

import { cn } from '@/utils/cn';

import { type SubmissionReviewResult } from '@/app/api/submission/review-draft/route';

interface Props {
  review: SubmissionReviewResult;
  isPro?: boolean;
}

const signalConfig = {
  green: {
    icon: CheckCircle2,
    bg: 'bg-green-50',
    border: 'border-green-200',
    iconColor: 'text-green-600',
    badgeBg: 'bg-green-100',
    badgeText: 'text-green-700',
    label: 'Looking good',
  },
  yellow: {
    icon: CircleAlert,
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    iconColor: 'text-amber-500',
    badgeBg: 'bg-amber-100',
    badgeText: 'text-amber-700',
    label: 'Needs work',
  },
  red: {
    icon: AlertCircle,
    bg: 'bg-red-50',
    border: 'border-red-200',
    iconColor: 'text-red-500',
    badgeBg: 'bg-red-100',
    badgeText: 'text-red-700',
    label: 'Weak submission',
  },
};

export function AiReviewPanel({ review, isPro }: Props) {
  const [expanded, setExpanded] = useState(true);
  const config = signalConfig[review.signal];
  const Icon = config.icon;

  const hasFieldFeedback =
    review.fields?.link != null ||
    review.fields?.otherInfo != null ||
    (review.fields?.eligibility && review.fields.eligibility.length > 0);

  return (
    <div
      className={cn(
        'mt-2 rounded-lg border',
        config.border,
        config.bg,
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-center justify-between px-3 py-2.5"
      >
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4 shrink-0', config.iconColor)} />
          <span className="text-sm font-medium text-slate-700">
            AI Review
          </span>
          <span
            className={cn(
              'rounded-full px-2 py-0.5 text-xs font-semibold',
              config.badgeBg,
              config.badgeText,
            )}
          >
            {review.score}/100 · {config.label}
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-inherit px-3 pb-3 pt-2.5">
          <p className="text-sm text-slate-600">{review.summary}</p>

          {review.suggestions && review.suggestions.length > 0 && (
            <div className="mt-2.5">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Suggestions
              </p>
              <ul className="flex flex-col gap-1.5">
                {review.suggestions.map((s, i) => (
                  <li key={i} className="flex gap-2 text-sm text-slate-600">
                    <span className="mt-0.5 shrink-0 text-slate-400">•</span>
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {hasFieldFeedback && (
            <div className="mt-2.5">
              <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-400">
                Field Feedback
              </p>
              <div className="flex flex-col gap-1.5">
                {review.fields?.link != null && (
                  <FieldNote label="Submission Link" note={review.fields.link} />
                )}
                {review.fields?.otherInfo != null && (
                  <FieldNote label="Additional Info" note={review.fields.otherInfo} />
                )}
                {review.fields?.eligibility?.map((ef, i) => (
                  <FieldNote
                    key={i}
                    label={`Question ${ef.index + 1}`}
                    note={ef.feedback}
                  />
                ))}
              </div>
            </div>
          )}

          <p
            className={cn(
              'mt-3 text-xs text-slate-400',
              isPro && 'text-zinc-400',
            )}
          >
            AI review is advisory — you can still submit as-is.
          </p>
        </div>
      )}
    </div>
  );
}

function FieldNote({ label, note }: { label: string; note: string }) {
  return (
    <div className="rounded-md bg-white/70 px-2.5 py-1.5 text-sm">
      <span className="font-medium text-slate-600">{label}: </span>
      <span className="text-slate-500">{note}</span>
    </div>
  );
}
