import parse, { type HTMLReactParserOptions } from 'html-react-parser';
import { ChevronDown } from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { useMediaQuery } from '@/hooks/use-media-query';
import { cn } from '@/utils/cn';

interface Props {
  description?: string;
}

export function DescriptionUI({ description }: Props) {
  const options: HTMLReactParserOptions = {
    replace: ({ name, children, attribs }: any) => {
      if (name === 'p' && (!children || children.length === 0)) {
        return <br />;
      }
      return { name, children, attribs };
    },
  };

  //to resolve a chain of hydration errors
  const [isMounted, setIsMounted] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [showCollapser, setShowCollapser] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isNotMD = useMediaQuery('(max-width: 767px)');

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const decideCollapser = useCallback(() => {
    if (descriptionRef) {
      const fiftyVH = window.innerHeight / 2;
      if (isNotMD && (descriptionRef.current?.clientHeight ?? 0) > fiftyVH) {
        setShowCollapser(true);
        setShowMore(false);
      }
    }
  }, [descriptionRef.current, isNotMD]);

  useEffect(() => {
    // Use a timeout to ensure the DOM has been updated
    const timer = setTimeout(() => {
      decideCollapser();
    }, 0);

    return () => clearTimeout(timer);
  }, [decideCollapser, isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <div
      className={cn(
        'w-full overflow-visible border-b border-slate-100 md:border-0',
        showMore && 'pb-4',
      )}
    >
      <div
        ref={descriptionRef}
        className="relative w-full overflow-visible rounded-xl bg-white"
      >
        <div
          className={cn(
            'transition-all duration-200',
            !showMore && 'h-[50vh] overflow-hidden',
          )}
        >
          <div className="minimal-tiptap-editor tiptap ProseMirror h-full w-full overflow-visible !px-0 pb-7">
            <div className="tiptap ProseMirror listing-description !mt-0 !px-0">
              {parse(
                description?.startsWith('"')
                  ? JSON.parse(description || '')
                  : (description ?? ''),
                options,
              )}
            </div>
          </div>
        </div>
        {showCollapser && (
          <Button
            className={cn(
              'absolute -bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border-slate-300 bg-white font-medium text-slate-500',
              showMore && '-bottom-8',
            )}
            onClick={() => setShowMore(!showMore)}
            size="sm"
            variant="outline"
          >
            Read {showMore ? 'Less' : 'More'}
            <ChevronDown
              className={`ml-2 h-5 w-5 text-slate-300 transition-transform duration-200 ${
                showMore ? 'rotate-180' : ''
              }`}
            />
          </Button>
        )}
      </div>
    </div>
  );
}
