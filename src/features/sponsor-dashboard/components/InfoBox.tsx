import parse, { type HTMLReactParserOptions } from 'html-react-parser';

import { LinkTextParser } from '@/components/shared/LinkTextParser';
import styles from '@/styles/info-box.module.css';

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
    <p className="mt-1 text-xs font-semibold text-slate-400 uppercase">
      {label}
    </p>
    {isHtml ? (
      <div
        className={`h-full w-full text-sm font-medium break-words whitespace-normal text-slate-600 ${styles.richtext}`}
      >
        {parse(content || '-', options)}
      </div>
    ) : (
      <div className="break-words whitespace-normal">
        <LinkTextParser text={content || '-'} />
      </div>
    )}
  </div>
);
