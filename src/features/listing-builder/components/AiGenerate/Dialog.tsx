import { useCompletion } from '@ai-sdk/react';
import { type ReactNode, useState } from 'react';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { api } from '@/lib/api';

import { type TEligibilityQuestion } from '../../types/schema';
import { AiGenerateForm } from './Form';
import { AiGenerateResult } from './Result';
import { type AiGenerateFormValues } from './schema';

interface AIDescriptionDialogProps {
  children: ReactNode;
}

export function AiGenerateDialog({ children }: AIDescriptionDialogProps) {
  const [stage, setStage] = useState<'form' | 'result'>('form');
  const [formData, setFormData] = useState<Partial<AiGenerateFormValues>>({
    companyDescription: '',
    scopeOfWork: '',
    rewards: '',
    requirements: '',
  });

  const [eligibilityQuestions, setEligibilityQuestions] = useState<
    TEligibilityQuestion[]
  >([]);
  const { complete: completeDescription, completion: description } =
    useCompletion({
      api: '/api/sponsor-dashboard/ai-generate-description',
      onResponse: () => {
        // Move to result stage as soon as we start getting a response
        setStage('result');
      },
      onError: (err) => {
        console.error('Error in completion:', err);
      },
    });

  const handleFormSubmit = async (data: AiGenerateFormValues) => {
    setFormData(data);

    const completedDescription = await completeDescription('', {
      body: {
        companyDescription: data.companyDescription,
        scopeOfWork: data.scopeOfWork,
        rewards: data.rewards,
        requirements: data.requirements,
      },
    });

    const eligibilityQuestionsResponse = await api.post<TEligibilityQuestion[]>(
      '/api/sponsor-dashboard/ai-generate-questions',
      {
        description: completedDescription,
      },
    );
    console.log(eligibilityQuestionsResponse);
    if (eligibilityQuestionsResponse.data) {
      setEligibilityQuestions(eligibilityQuestionsResponse.data);
    }
  };

  const resetForm = () => {
    setStage('form');
    setFormData({
      companyDescription: '',
      scopeOfWork: '',
      rewards: '',
      requirements: '',
    });
  };

  return (
    <Dialog onOpenChange={(open) => !open && resetForm()}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-160">
        {stage === 'form' ? (
          <AiGenerateForm onSubmit={handleFormSubmit} initialData={formData} />
        ) : (
          <AiGenerateResult
            description={description}
            eligibilityQuestions={eligibilityQuestions}
            onInsert={() => {
              // Handle insert action
              console.log('Inserting result:', description);
            }}
            onBack={() => setStage('form')}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
