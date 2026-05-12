import { Wand2 } from 'lucide-react';
import { useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface Props {
  show: boolean;
}

export function AiReviewBanner({ show }: Props) {
  const [open, setOpen] = useState(false);

  if (!show) return null;

  return (
    <>
      <div className="mb-6 flex w-full items-center gap-2 rounded-md border border-indigo-200 bg-indigo-50 px-4 py-2">
        <Wand2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
        <span className="text-sm font-medium text-indigo-600">
          AI-Assisted Review
        </span>
        <button
          type="button"
          className="ml-1 text-xs text-indigo-400 underline underline-offset-2 hover:text-indigo-600 focus:outline-none"
          onClick={() => setOpen(true)}
        >
          What does this mean?
        </button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>AI-Assisted Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm text-slate-600">
            <p>
              The sponsor used Earn&apos;s AI review tool to pre-sort
              submissions before selecting winners.
            </p>
            <p>
              The AI scored each submission on criteria match and quality, then
              grouped them into tiers. The sponsor reviewed from the top tier
              down.
            </p>
            <p>
              The sponsor still manually selected all winners. AI was a sorting
              aid, not the decision maker.
            </p>
            <div className="space-y-1.5 rounded-md border border-slate-100 bg-slate-50 p-3">
              <p className="font-medium text-slate-700">What the labels mean</p>
              <p>
                <span className="font-medium text-indigo-600">Shortlisted</span>{' '}
                — AI ranked this in the top ~10%
              </p>
              <p>
                <span className="font-medium text-blue-600">Mid Quality</span> —
                AI ranked this in the middle tier
              </p>
              <p>
                <span className="font-medium text-orange-600">Low Quality</span>{' '}
                — AI ranked this in the bottom 25%
              </p>
              <p>
                <span className="font-medium text-yellow-700">
                  Flagged for Review
                </span>{' '}
                — AI was uncertain, flagged for human review
              </p>
              <p>
                <span className="font-medium text-red-500">
                  Link Inaccessible
                </span>{' '}
                — AI could not open the submission link
              </p>
            </div>
            <p className="text-xs text-slate-400">
              AI can make mistakes. Labels reflect automated assessment at time
              of review and may not capture the full quality of a submission.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
