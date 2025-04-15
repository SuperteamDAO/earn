import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AiGenerateResultProps {
  result: string;
  onInsert: () => void;
}

export function AiGenerateResult({ result, onInsert }: AiGenerateResultProps) {
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
            <div className="whitespace-pre-line">{result}</div>
          </div>
        </div>

        <div className="mt-4 space-y-3 text-sm text-slate-700">
          <h3 className="text-sm font-medium text-slate-600">Questions</h3>

          <div className="rounded-md border bg-white p-2">
            <p className="">1. Why are you the right fit for this job?</p>
          </div>

          <div className="rounded-md border bg-white p-2">
            <p className="">2. Who are you and why should we trust you?</p>
          </div>

          <div className="rounded-md border bg-white p-2">
            <p className="">3. Give 3 Examples of why you will not rug us</p>
          </div>
        </div>
      </ScrollArea>

      <Button
        onClick={onInsert}
        className="w-full bg-indigo-500 hover:bg-indigo-600"
      >
        Insert
      </Button>
    </div>
  );
}
