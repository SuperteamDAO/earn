import { type ReactNode, useState } from 'react';

import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';

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
  const [generatedResult, setGeneratedResult] = useState('');

  const handleFormSubmit = async (data: AiGenerateFormValues) => {
    setFormData(data);

    // Simulate API call to generate description
    // In a real app, you would call your AI service here
    setTimeout(() => {
      setGeneratedResult(`Superteam Earn, a marketplace for freelance gigs and bounties, is excited to announce a design-focused bounty exclusively for students and alumni of 10kdesigners. Earn is looking for designers to help inspire our next (potential) product feature: the Talent Leaderboard.
      
Scope of Work
Participants are tasked with strategizing and designing a Talent Leaderboard for Superteam Earn.

Deliverables:
 1. Figma file: A final, production-ready design of the Talent Leaderboard`);

      setStage('result');
    }, 1500);
  };

  const resetForm = () => {
    setStage('form');
    setFormData({
      companyDescription: '',
      scopeOfWork: '',
      rewards: '',
      requirements: '',
    });
    setGeneratedResult('');
  };

  return (
    <Dialog onOpenChange={(open) => !open && resetForm()}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-160">
        {stage === 'form' ? (
          <AiGenerateForm onSubmit={handleFormSubmit} initialData={formData} />
        ) : (
          <AiGenerateResult
            result={generatedResult}
            onInsert={() => {
              // Handle insert action
              console.log('Inserting result:', generatedResult);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
