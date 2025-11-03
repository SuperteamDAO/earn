import parse, { type HTMLReactParserOptions } from 'html-react-parser';
import { marked } from 'marked';
import { memo, useEffect, useState } from 'react';
const options: HTMLReactParserOptions = {
  replace: ({ name, children, attribs }: any) => {
    if (name === 'p' && (!children || children.length === 0)) {
      return <br />;
    }
    return { name, children, attribs };
  },
};
const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    const awaitedParse = async () => {
      setRawHtml(await marked.parse(children || '', { gfm: true }));
    };
    awaitedParse();
  }, [children]);

  return (
    <>
      {parse(
        rawHtml?.startsWith('"') ? JSON.parse(rawHtml || '') : (rawHtml ?? ''),
        options,
      )}
    </>
  );
};

export const MarkdownRenderer = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
