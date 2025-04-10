import parse, { type HTMLReactParserOptions } from 'html-react-parser';

import { LinkTextParser } from '@/components/shared/LinkTextParser';
import { cn } from '@/utils/cn';

const options: HTMLReactParserOptions = {
  replace: ({ name, children, attribs }: any) => {
    if (name === 'p' && (!children || children.length === 0)) {
      return <br />;
    }
    return { name, children, attribs };
  },
};

export function parseHtml(content: string) {
  return parse(content || '', options);
}

export const InfoBox = ({
  label,
  content,
  isHtml = false,
  className,
  contentClassName,
}: {
  label?: string | null;
  content?: string | null;
  isHtml?: boolean;
  className?: string;
  contentClassName?: string;
}) => (
  <div className={cn('mb-4', className)}>
    {label && (
      <p className="mt-1 text-xs font-semibold uppercase text-slate-400">
        {label}
      </p>
    )}
    {isHtml ? (
      <div
        id="reset-des"
        className={cn('h-full w-full overflow-visible', contentClassName)}
      >
        {parse(content || '', options)}
      </div>
    ) : (
      <LinkTextParser text={content || ''} />
    )}
  </div>
);
