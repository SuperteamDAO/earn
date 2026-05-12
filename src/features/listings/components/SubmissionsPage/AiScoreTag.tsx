import { Info } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export type PublicAiData = {
  commited: true;
  evaluation?: {
    criteriaScore?: number;
    qualityScore?: number;
    totalScore?: number;
    notes?: string;
  };
} | null;

type VisibleLabel =
  | 'Shortlisted'
  | 'Mid_Quality'
  | 'Low_Quality'
  | 'Needs_Review'
  | 'Inaccessible';

const VISIBLE: VisibleLabel[] = [
  'Shortlisted',
  'Mid_Quality',
  'Low_Quality',
  'Needs_Review',
  'Inaccessible',
];

const STYLES: Record<VisibleLabel, string> = {
  Shortlisted: 'bg-indigo-50 text-indigo-600',
  Mid_Quality: 'bg-blue-50 text-blue-600',
  Low_Quality: 'bg-orange-50 text-orange-600',
  Needs_Review: 'bg-yellow-50 text-yellow-700',
  Inaccessible: 'bg-red-50 text-red-500',
};

const TEXT: Record<VisibleLabel, string> = {
  Shortlisted: 'Shortlisted',
  Mid_Quality: 'Mid Quality',
  Low_Quality: 'Low Quality',
  Needs_Review: 'Flagged for Review',
  Inaccessible: 'Link Inaccessible',
};

interface Props {
  label: string;
  aiData: PublicAiData;
}

export function AiScoreTag({ label, aiData }: Props) {
  const [open, setOpen] = useState(false);

  if (!aiData?.commited || !VISIBLE.includes(label as VisibleLabel)) return null;

  const typed = label as VisibleLabel;
  const ev = aiData.evaluation;
  const hasScores =
    ev &&
    (ev.criteriaScore !== undefined ||
      ev.qualityScore !== undefined ||
      ev.totalScore !== undefined ||
      ev.notes);

  return (
    <>
      <div
        className={`inline-flex h-[1.2rem] w-fit items-center gap-1 rounded-full px-2 text-xs ${STYLES[typed]}`}
      >
        <span>{TEXT[typed]}</span>
        {hasScores && (
          <button
            type="button"
            className="flex items-center focus:outline-none"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpen(true);
            }}
          >
            <Info className="h-3 w-3" />
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>AI Review Scores</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Final Label</span>
              <span
                className={`inline-flex h-[1.2rem] items-center rounded-full px-2 text-xs ${STYLES[typed]}`}
              >
                {TEXT[typed]}
              </span>
            </div>
            {ev?.criteriaScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Criteria Score</span>
                <span className="font-medium text-slate-800">
                  {ev.criteriaScore}
                </span>
              </div>
            )}
            {ev?.qualityScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Quality Score</span>
                <span className="font-medium text-slate-800">
                  {ev.qualityScore}
                </span>
              </div>
            )}
            {ev?.totalScore !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Total Score</span>
                <span className="font-medium text-slate-800">
                  {ev.totalScore}
                </span>
              </div>
            )}
            {ev?.notes && (
              <div className="border-t pt-3">
                <p className="text-slate-500">AI Note</p>
                <p className="mt-1 text-slate-700">{ev.notes}</p>
              </div>
            )}
            <p className="pt-1 text-xs text-slate-400">
              AI can make mistakes. These scores reflect automated assessment
              only.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
