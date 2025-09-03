import { Cross2Icon } from '@radix-ui/react-icons';
import { ArrowLeft, ArrowUp, LoaderCircle } from 'lucide-react';
import TextareaAutosize from 'react-textarea-autosize';

import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import styles from '@/styles/listing-description.module.css';

interface AutoGenerateChatProps {
  description: string;
  error: boolean;
  loading: boolean;
  input: string;
  setInput: (input: string) => void;
  handleRefine: () => void;
  handleBack: () => void;
}

export function AutoGenerateChat({
  description,
  error,
  input,
  setInput,
  handleRefine,
  handleBack,
}: AutoGenerateChatProps) {
  return (
    <div className="flex min-h-159 flex-col gap-y-4">
      <div className="flex items-start justify-between bg-slate-50 p-4 pb-2">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="!size-6 rounded-full bg-slate-50 px-0 text-xs text-slate-400"
            onClick={handleBack}
          >
            <ArrowLeft className="size-4! text-slate-400" />
          </Button>
          <h2 className="text-xl font-semibold text-slate-600">
            Generated Listing
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <DialogClose asChild>
            <Button variant="ghost" size="icon">
              <Cross2Icon className="h-4 w-4 text-slate-400" />
            </Button>
          </DialogClose>
        </div>
      </div>
      <div className="flex-1">
        <div className="m-4 mt-2 rounded-md border bg-white px-4 py-2">
          {!description || description.length === 0 ? (
            <div className="flex animate-pulse items-center gap-2 py-2 text-sm">
              <LoaderCircle className="h-4 w-4 animate-spin" />
              <span className="text-gray-500">Thinking…</span>
            </div>
          ) : (
            <div className={`${styles.content} mt-4 w-full pb-7`}>
              <MarkdownRenderer>{description}</MarkdownRenderer>
            </div>
          )}
          {error && (
            <p className="w-full rounded-md bg-slate-100 py-4 text-center text-sm text-slate-600">
              {`Failed to generate description, please try again later`}
            </p>
          )}
        </div>
      </div>
      <div className="sticky bottom-0 mt-auto flex items-start justify-between gap-x-2 border-t bg-white p-4 pb-2">
        <div className="relative h-fit w-full">
          <TextareaAutosize
            placeholder="Ask for changes or refinements"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="focus:border-primary min-h-10 w-full resize-none rounded-md border bg-white p-2 pr-7 text-sm placeholder:text-sm focus:outline-none"
          />
          <Button
            onClick={handleRefine}
            size="icon"
            className="absolute right-2 bottom-3.5 size-6! rounded-full bg-black text-white hover:bg-black/70"
          >
            <ArrowUp />
          </Button>
        </div>
        <Button className="px-8">Create</Button>
      </div>
    </div>
  );
}
