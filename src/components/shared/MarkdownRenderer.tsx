import parse, { Element, type HTMLReactParserOptions } from 'html-react-parser';
import { marked } from 'marked';
import { memo, useEffect, useState } from 'react';
const options: HTMLReactParserOptions = {
  // Empty paragraphs become line breaks; everything else stays as parsed.
  replace: (node) => {
    if (node instanceof Element && node.name === 'p' && !node.children.length) {
      return <br />;
    }
    return undefined;
  },
};
const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    const awaitedParse = async () => {
      setRawHtml(await marked.parse(children || '', { gfm: true }));
    };
    void awaitedParse();
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
