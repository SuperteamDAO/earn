import { AnimatePresence, motion } from 'motion/react';
import posthog, { type Survey } from 'posthog-js';
import { useEffect, useState } from 'react';

import BiCheck from '@/components/icons/BiCheck';
import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';

import { Rating } from '@/features/surveys/components/Rating';
import { getMatchingSurvey } from '@/features/surveys/utils/get-matching-survey';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const surveyId =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? '019ab633-f655-0000-0b82-5b7629cdb1c3'
    : '019ab637-908f-0000-1e83-712ec6a82ca7';

export function Survey({ open, setOpen }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [stage, setStage] = useState<'form' | 'final' | 'form_loading'>('form');
  const [survey, setSurvey] = useState<Survey | null>(null);

  const handleDone = async (selectedScore: number) => {
    setStage('form_loading');
    if (survey) {
      const scoreKey = `$survey_response_${survey.questions[0]?.id}`;

      posthog.capture('survey sent', {
        $survey_id: survey.id,
        [scoreKey]: selectedScore,
      });
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStage('final');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTimeout(() => {
      setStage?.('form');
    }, 500);
    setOpen(false);
  };

  const handleScoreChange = (newScore: number | null) => {
    setScore(newScore);
    if (newScore !== null && stage === 'form') {
      handleDone(newScore);
    }
  };

  useEffect(() => {
    posthog.getActiveMatchingSurveys((surveys) => {
      const survey = getMatchingSurvey(surveys, surveyId);
      setSurvey(survey);
    }, true);
  }, [posthog]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="max-w-160 p-0"
        unsetDefaultTransition
        hideCloseIcon
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <AnimateChangeInHeight duration={0.3}>
          <AnimatePresence mode="popLayout">
            {stage.includes('form') && (
              <motion.div
                key="form"
                exit={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                className="bg-slate-100 p-1"
              >
                <div className="bg-background rounded-lg border-[0.09375rem] border-dashed border-slate-300 p-5">
                  <DialogHeader>
                    <DialogHeader className="font-medium">
                      How likely are you to recommend other companies to use
                      Superteam Earn?
                    </DialogHeader>
                  </DialogHeader>
                  <Rating
                    value={score}
                    onChange={handleScoreChange}
                    scale={10}
                    className="mt-4"
                    lowerBoundLabel="Unlikely"
                    upperBoundLabel="Very Likely"
                  />
                </div>
              </motion.div>
            )}
            {stage === 'final' && (
              <motion.div
                key="final"
                initial={{ y: -50, opacity: 0, filter: 'blur(4px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                className="flex h-[20.875rem] flex-col items-center justify-center gap-6 bg-slate-100 p-6"
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
              >
                <div className="flex items-center justify-center rounded-full bg-indigo-100 p-1">
                  <BiCheck className="size-18 text-indigo-600" />
                </div>
                <p className="mb-4 text-lg font-medium text-slate-700">
                  Thank you for your feedback!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </AnimateChangeInHeight>
      </DialogContent>
    </Dialog>
  );
}
