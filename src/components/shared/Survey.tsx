import { type Survey, type SurveyQuestion } from 'posthog-js';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';

function getMatchingSurvey(surveys: Survey[], id: string): Survey | null {
  const survey = surveys.find((survey) => survey.id === id);
  return survey || null;
}

export const SurveyModal = ({
  isOpen,
  onClose,
  surveyId,
}: {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
}) => {
  const { refetchUser } = useUser();
  const posthog = usePostHog();

  const [question, setQuestion] = useState<SurveyQuestion | undefined | null>(
    null,
  );
  const [response, setResponse] = useState<string | number>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (rate: number) => {
    setResponse(rate);
  };

  const handleChoiceSelection = (choice: string) => {
    setResponse(choice);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    posthog.capture('survey sent', {
      $survey_id: surveyId,
      $survey_response: response,
    });
    await api.post('/api/user/update-survey/', {
      surveyId,
    });
    await refetchUser();
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    posthog.getActiveMatchingSurveys((surveys) => {
      const surveyById = getMatchingSurvey(surveys, surveyId);
      setQuestion(surveyById?.questions[0]);
    }, true);
  }, [posthog]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-lg p-6"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        {!question ? (
          <div>
            <Skeleton className="mb-2 h-[18px]" />
            <Skeleton className="mb-5 h-[14px] w-[60%]" />
            <div className="mt-8 flex justify-center gap-1">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-[36px] w-[40px]" />
              ))}
            </div>
            <Skeleton className="mb-3 mt-8 h-10 rounded-md" />
          </div>
        ) : (
          <>
            <div>
              <p className="mb-2 text-lg font-semibold leading-[125%] text-slate-700">
                {question?.question}
              </p>
              <p className="mb-5 text-sm text-slate-500">
                {question?.description}
              </p>

              {question?.type === 'rating' && (
                <div>
                  <div className="mt-2 flex justify-center gap-4">
                    {[...Array(question.scale)].map((_, i) => (
                      <Button
                        key={i}
                        onClick={() => handleRating(i + 1)}
                        size="sm"
                        variant={response === i + 1 ? 'default' : 'outline'}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </div>
                  <div className="mt-0.5 flex flex-grow justify-between">
                    <p className="text-xs text-slate-400">
                      {question.lowerBoundLabel}
                    </p>
                    <p className="text-xs text-slate-400">
                      {question.upperBoundLabel}
                    </p>
                  </div>
                </div>
              )}

              {question?.type === 'single_choice' && (
                <RadioGroup
                  className="mb-3 flex flex-col gap-2"
                  onValueChange={handleChoiceSelection}
                  value={response !== undefined ? String(response) : undefined}
                >
                  {question.choices.map((choice, idx) => (
                    <div
                      key={idx}
                      className="flex items-center space-x-2 rounded-md p-2 hover:bg-slate-100"
                    >
                      <RadioGroupItem
                        value={choice}
                        id={`choice-${idx}`}
                        className="text-brand-purple"
                      />
                      <Label htmlFor={`choice-${idx}`} className="font-normal">
                        {choice}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}
            </div>

            <Button
              className="mt-4"
              disabled={!response || isSubmitting}
              onClick={handleSubmit}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};
