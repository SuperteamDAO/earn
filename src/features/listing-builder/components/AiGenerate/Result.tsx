import { Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';

import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { MinimalTiptapEditor } from '@/components/tiptap';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

import { type TEligibilityQuestion } from '../../types/schema';

interface AiGenerateResultProps {
  description: string;
  isDescriptionLoading: boolean;
  eligibilityQuestions: TEligibilityQuestion[];
  isEligibilityQuestionsIdle: boolean;
  isEligibilityQuestionsError: boolean;
  isEligibilityQuestionsPending: boolean;
  onInsert: () => void;
  onBack: () => void;
}

export function AiGenerateResult({
  description,
  isDescriptionLoading,
  eligibilityQuestions,
  isEligibilityQuestionsIdle,
  isEligibilityQuestionsError,
  isEligibilityQuestionsPending,
  onInsert,
  onBack,
}: AiGenerateResultProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [description, eligibilityQuestions, isDescriptionLoading]);

  useEffect(() => {
    setTimeout(() => {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }, 1);
  }, [isDescriptionLoading]);

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
          <div className="mt-2 rounded-md border bg-white px-4 py-2">
            {isDescriptionLoading ? (
              <div className="minimal-tiptap-editor tiptap ProseMirror h-min w-full overflow-visible px-0! pb-7">
                <div className="tiptap ProseMirror listing-description mt-0! px-0!">
                  <MarkdownRenderer>{description}</MarkdownRenderer>
                </div>
              </div>
            ) : (
              <MinimalTiptapEditor
                key={isDescriptionLoading ? 1 : 0}
                value={description}
                immediatelyRender
                throttleDelay={0}
                output="html"
                editable={false}
                imageSetting={{
                  folderName: 'listing-description',
                  type: 'description',
                }}
                className="min-h-0 border-0 shadow-none"
                editorClassName="!px-0"
                toolbarClassName="hidden"
              />
            )}
          </div>
        </div>

        {!isEligibilityQuestionsIdle && (
          <div className="mt-4 space-y-3 text-sm text-slate-700">
            <h3 className="text-sm font-medium text-slate-600">Questions</h3>
            {isEligibilityQuestionsPending && (
              <span className="flex animate-pulse items-center justify-center gap-2 rounded-md bg-slate-100 py-4 text-sm text-slate-500">
                <Loader2 className="size-4 animate-spin" />
                <p>Generating Custom Questions</p>
              </span>
            )}
            {!isEligibilityQuestionsPending &&
              (isEligibilityQuestionsError ||
                eligibilityQuestions.length === 0) && (
                <>
                  <p className="w-full rounded-md bg-slate-100 py-4 text-center text-sm text-slate-600">
                    No extra custom questions needed :)
                  </p>
                </>
              )}
            {eligibilityQuestions.map((question) => (
              <div
                className="rounded-md border bg-white p-2"
                key={question.order}
              >
                <p>
                  {question.order}. {question.question}
                </p>
              </div>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </ScrollArea>

      <div className="flex flex-col items-center">
        <Button
          onClick={onInsert}
          className="w-full bg-indigo-500 hover:bg-indigo-600"
          disabled={isDescriptionLoading}
        >
          Insert
        </Button>
        <Button variant="link" onClick={onBack} disabled={isDescriptionLoading}>
          Go Back
        </Button>
      </div>
    </div>
  );
}
