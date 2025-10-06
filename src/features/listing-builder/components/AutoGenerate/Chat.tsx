import { Cross2Icon } from '@radix-ui/react-icons';
import { type UIMessage } from 'ai';
import { ArrowLeft, ArrowUp, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';

import { MarkdownRenderer } from '@/components/shared/MarkdownRenderer';
import { Button } from '@/components/ui/button';
import { DialogClose } from '@/components/ui/dialog';
import styles from '@/styles/listing-description.module.css';

import { ProgressiveBlurOut } from './extras/ProgressiveBlurOut';
import { SparkleLoading } from './extras/SparkleLoading';
import { TextLightSweep } from './extras/TextLightSweep';

interface AutoGenerateChatProps {
  description: string;
  error: boolean;
  loading: boolean;
  input: string;
  setInput: (input: string) => void;
  handleRefine: () => void;
  handleBack: () => void;
  handleProceed: () => Promise<void>;
  scrollEl: HTMLDivElement | null;
  isLoading: boolean;
  isDisabled: boolean;
  isRefineDisabled: boolean;
  isThinking: boolean;
  isRefining: boolean;
  messages: UIMessage[];
}

export function AutoGenerateChat({
  description,
  error,
  input,
  setInput,
  handleRefine,
  handleBack,
  handleProceed,
  scrollEl,
  isLoading,
  isDisabled,
  isRefineDisabled,
  isThinking,
  isRefining,
  messages,
}: AutoGenerateChatProps) {
  const [isHovering, setIsHovering] = useState(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter') {
      if (e.metaKey || e.ctrlKey) {
        return;
      }
      if (e.shiftKey) {
        return;
      }
      e.preventDefault();
      if (!isRefineDisabled && !isDisabled) handleRefine();
    }
  };
  return (
    <div className="flex min-h-159 flex-col gap-y-4">
      <div className="sticky top-0 z-100 flex items-center justify-between bg-slate-50 p-4 py-2">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
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
        {isThinking && (
          <div className="mx-4 flex w-fit items-center gap-2 rounded-lg p-2 text-sm">
            <SparkleLoading className="max-h-5 w-fit" />
            <TextLightSweep
              text="Generating your listing…"
              className="text-primary-300 font-medium"
            />
          </div>
        )}
        {description && description.length > 0 && !isRefining && (
          <div className="m-4 mt-2 mb-0 rounded-md border bg-white px-4 py-0">
            <div
              className={`${styles.content} mt-3 w-full pb-7 [&_h2:first-child]:!mt-0`}
            >
              {[...messages]
                .filter((message) => message.role === 'assistant')
                .slice(-1)
                ?.map((message) => (
                  <div key={message.id}>
                    {message.parts
                      .filter((part) => part.type === 'text')
                      .map((part, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, filter: 'blur(4px)' }}
                          animate={{ opacity: 1, filter: 'blur(0px)' }}
                          exit={{ opacity: 0, filter: 'blur(4px)' }}
                          transition={{ duration: 0.4 }}
                        >
                          <MarkdownRenderer>{part.text}</MarkdownRenderer>
                        </motion.div>
                      ))}
                  </div>
                ))}
            </div>
          </div>
        )}
        {error && (
          <div className="m-2 rounded-md border bg-white px-4 py-2">
            <p className="w-full rounded-md bg-slate-100 py-4 text-center text-sm text-slate-600">
              {`Failed to generate description, please try again later`}
            </p>
          </div>
        )}
      </div>
      <div className="sticky bottom-0 z-10 mt-auto flex items-start justify-between gap-x-2 bg-white p-4 pb-2">
        <ProgressiveBlurOut scrollEl={scrollEl} className="absolute -top-22" />
        <div className="relative h-fit w-full">
          <TextareaAutosize
            placeholder="Ask for changes or refinements"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            maxRows={5}
            className="focus:border-primary min-h-10 w-full resize-none rounded-md border bg-white p-2 pr-7 text-sm placeholder:text-sm focus:outline-none"
          />
          {input.length > 0 && (
            <motion.div
              className="absolute right-2 bottom-3.5 flex h-6 items-center justify-center"
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.2, type: 'spring', bounce: 0 }}
            >
              <Button
                onClick={handleRefine}
                className="flex h-full items-center justify-center rounded-full bg-black px-1 text-white hover:bg-black/70"
                disabled={isRefineDisabled || isDisabled}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
              >
                {isDisabled ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    {isHovering && (
                      <span className="ml-2 block overflow-hidden text-xs whitespace-nowrap">
                        Refine
                      </span>
                    )}
                    <ArrowUp />
                  </>
                )}
              </Button>
            </motion.div>
          )}
        </div>
        {input.length === 0 && (
          <Button
            className="w-36 px-0"
            onClick={handleProceed}
            disabled={isLoading || isDisabled}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Proceed'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
