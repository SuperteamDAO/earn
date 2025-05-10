import { Check, Copy } from 'lucide-react';

import { useClipboard } from '@/hooks/use-clipboard';
import { cn } from '@/utils/cn';

import { Tooltip, type TooltipProps } from './tooltip';

interface CopyButtonProps extends Omit<TooltipProps, 'content'> {
  text: string;
  timeout?: number;
  className?: string;
  content?: React.ReactNode;
  copiedContent?: React.ReactNode;
}

export function CopyButton({
  text,
  className,
  children,
  contentProps,
  content,
  copiedContent,
  ...props
}: CopyButtonProps) {
  const { onCopy, hasCopied } = useClipboard(text);

  return (
    <Tooltip
      disableOnClickClose
      contentProps={{
        className: cn('flex items-center gap-1', contentProps?.className),
        ...contentProps,
      }}
      content={
        <div className="relative">
          <div
            className={cn(
              'absolute left-2/4 flex -translate-x-2/4 items-center gap-1 transition-all duration-200 ease-in-out',
              hasCopied ? 'opacity-100' : 'opacity-0',
            )}
          >
            {copiedContent ? (
              copiedContent
            ) : (
              <>
                <Check className="h-3.5 w-3.5" />
                <span>Copied!</span>
              </>
            )}
          </div>
          <div
            className={cn(
              'flex items-center gap-1 transition-all duration-200 ease-in-out',
              hasCopied ? 'opacity-0' : 'opacity-100',
            )}
          >
            {content ? (
              content
            ) : (
              <>
                <Copy className="h-3 w-3" />
                <span>Click to copy</span>
              </>
            )}
          </div>
        </div>
      }
      {...props}
    >
      <div
        role="button"
        className={cn('relative inline-flex items-center', className)}
        onClick={onCopy}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onCopy();
          }
        }}
      >
        {children}
      </div>
    </Tooltip>
  );
}
