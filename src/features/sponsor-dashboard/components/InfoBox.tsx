import parse, { type HTMLReactParserOptions } from 'html-react-parser';

import { LinkTextParser } from '@/components/shared/LinkTextParser';

const options: HTMLReactParserOptions = {
  replace: ({ name, children, attribs }: any) => {
    if (name === 'p' && (!children || children.length === 0)) {
      return <br />;
    }
    return { name, children, attribs };
  },
};

export const InfoBox = ({
  label,
  content,
  isHtml = false,
}: {
  label: string;
  content?: string | null;
  isHtml?: boolean;
}) => (
  <div className="mb-4">
    <p className="mt-1 text-xs font-semibold uppercase text-slate-400">
      {label}
    </p>
    {isHtml ? (
      <div
        className="h-full w-full overflow-visible text-sm font-medium text-slate-600"
        id="richtext"
      >
        {parse(content || '', options)}
      </div>
    ) : (
      <LinkTextParser text={content || ''} />
    )}
  </div>
);
