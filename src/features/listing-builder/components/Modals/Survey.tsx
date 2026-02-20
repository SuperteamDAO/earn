import { Loader, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import posthog, { type Survey } from 'posthog-js';
import { useEffect, useState } from 'react';

import BiCheck from '@/components/icons/BiCheck';
import { AnimateChangeInHeight } from '@/components/shared/AnimateChangeInHeight';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

import { Rating } from '@/features/surveys/components/Rating';
import { getMatchingSurvey } from '@/features/surveys/utils/get-matching-survey';

interface Props {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const surveyId =
  process.env.NEXT_PUBLIC_VERCEL_ENV === 'production'
    ? '0197eaf7-673f-0000-7880-4194601272e7'
    : '0197ea95-a533-0000-dc94-0ee7420bf670';

export function Survey({ open, setOpen }: Props) {
  const [score, setScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [stage, setStage] = useState<'form' | 'final' | 'form_loading'>('form');
  const [survey, setSurvey] = useState<Survey | null>(null);

  const handleDone = async () => {
    setStage('form_loading');
    try {
      if (survey) {
        const scoreKey = `$survey_response_${survey.questions[0]?.id}`;
        const feedbackKey = `$survey_response_${survey.questions[1]?.id}`;
        posthog.capture('survey sent', {
          $survey_id: survey.id,
          [scoreKey]: score,
          [feedbackKey]: feedback,
        });
      }
    } catch (error) {
      console.error('Error in handleDone:', error);
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
    setStage('final');
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setTimeout(() => {
      setStage?.('form');
    }, 500);
    setOpen(false);
  };

  useEffect(() => {
    try {
      posthog.getActiveMatchingSurveys((surveys) => {
        try {
          const survey = getMatchingSurvey(surveys, surveyId);
          setSurvey(survey);
        } catch (err) {
          console.error('Error processing survey data:', err);
          setSurvey(null);
        }
      }, true);
    } catch (error) {
      console.error('Error fetching survey:', error);
      setSurvey(null);
    }
  }, [posthog]);

  return (
    <Dialog open={open} onOpenChange={setOpen} modal={false}>
      <DialogContent
        classNames={{
          overlay: 'hidden',
        }}
        unsetDefaultPosition
        unsetDefaultTransition
        hideCloseIcon
        className="data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-right-full right-4 bottom-4 max-w-[22.5rem] translate-x-0 translate-y-0 overflow-hidden p-0 duration-300"
      >
        <AnimateChangeInHeight duration={0.3}>
          <AnimatePresence mode="popLayout">
            {stage.includes('form') && (
              <motion.div
                key="form"
                exit={{ y: 20, opacity: 0, filter: 'blur(4px)' }}
                transition={{ type: 'spring', bounce: 0, duration: 0.5 }}
                className="bg-slate-50 p-1"
              >
                <div className="bg-background relative rounded-lg border-[0.09375rem] border-dashed border-slate-300 p-5">
                  <button
                    type="button"
                    aria-label="Close survey"
                    onClick={() => setOpen(false)}
                    className="text-muted-foreground hover:text-foreground absolute top-3 right-3 rounded-sm p-1 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <DialogHeader>
                    <DialogHeader className="font-medium">
                      Publishing Experience
                    </DialogHeader>
                    <DialogDescription className="text-slate-700">
                      Let us know how easy or difficult it was to add your
                      listing. Your feedback helps us improve!
                    </DialogDescription>
                  </DialogHeader>
                  <Rating
                    value={score}
                    onChange={setScore}
                    scale={5}
                    className="mt-4"
                    lowerBoundLabel="Difficult"
                    upperBoundLabel="Easy"
                  />
                  <AnimatePresence mode="popLayout">
                    {score && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="mt-4 space-y-2 text-sm text-slate-700">
                          <p>
                            Additional Feedback{' '}
                            <span className="text-xs text-slate-500">
                              (optional)
                            </span>
                          </p>
                          <Textarea
                            className="resize-none text-sm text-slate-800 placeholder:text-sm placeholder:text-slate-400"
                            placeholder="Tell us more"
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                          />
                        </div>
                        <DialogFooter className="mt-4 flex">
                          <Button
                            size="sm"
                            className="w-26"
                            onClick={handleDone}
                          >
                            <AnimatePresence mode="popLayout" initial={false}>
                              <motion.span
                                key={stage}
                                initial={{ y: -25, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                exit={{ y: 25, opacity: 0 }}
                                transition={{
                                  type: 'spring',
                                  bounce: 0,
                                  duration: 0.3,
                                }}
                              >
                                {stage === 'form_loading' ? (
                                  <Loader className="animate-spin" />
                                ) : (
                                  'Done'
                                )}
                              </motion.span>
                            </AnimatePresence>
                          </Button>
                        </DialogFooter>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
            {stage === 'final' && (
              <motion.div
                key="final"
                initial={{ y: -50, opacity: 0, filter: 'blur(4px)' }}
                animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
                className="flex h-[22.25rem] flex-col items-center justify-center gap-6 bg-slate-100 p-6"
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
