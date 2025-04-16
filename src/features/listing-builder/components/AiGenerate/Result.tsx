import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { type TEligibilityQuestion } from '../../types/schema';

interface AiGenerateResultProps {
  description: string;
  eligibilityQuestions: TEligibilityQuestion[];
  onInsert: () => void;
  onBack: () => void;
}

export function AiGenerateResult({
  description,
  eligibilityQuestions,
  onInsert,
  onBack,
}: AiGenerateResultProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">
          Use AI to generate your description
        </h2>
        <p className="font-medium text-gray-500">
          Answer a few short questions and we will generate your description for
          you
        </p>
      </div>

      <ScrollArea className="flex max-h-150 min-h-1 flex-col gap-y-4 overflow-y-auto">
        <div>
          <h3 className="text-sm font-medium text-slate-600">
            Generated Result
          </h3>
          <div className="mt-2 rounded-md border bg-white p-2 text-sm text-slate-700">
            <MarkdownRenderer>{description}</MarkdownRenderer>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <h3 className="text-sm font-medium text-slate-600">Questions</h3>
          {eligibilityQuestions.map((question) => (
            <div
              className="rounded-md border bg-white p-2"
              key={question.order}
            >
              <p className="">
                {question.order}. {question.question}
              </p>
            </div>
          ))}
        </div>
      </ScrollArea>

      <div className="flex flex-col items-center">
        <Button
          onClick={onInsert}
          className="w-full bg-indigo-500 hover:bg-indigo-600"
        >
          Insert
        </Button>
        <Button variant="link" className="" onClick={onBack}>
          Go Back
        </Button>
      </div>
    </div>
  );
}
