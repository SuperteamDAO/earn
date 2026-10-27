import parse, { Element, type HTMLReactParserOptions } from 'html-react-parser';
import { marked } from 'marked';
import { memo, useEffect, useState } from 'react';
const options: HTMLReactParserOptions = {
  replace: (domNode) => {
    if (!(domNode instanceof Element)) return;
    const { name, children, attribs } = domNode;
    if (name === 'p' && (!children || children.length === 0)) {
      return <br />;
    }
    return { name, children, attribs };
  },
};
const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const [rawHtml, setRawHtml] = useState('');
  useEffect(() => {
    let cancelled = false;
    const awaitedParse = async () => {
      const html = await marked.parse(children || '', { gfm: true });
      if (!cancelled) setRawHtml(html);
    };
    awaitedParse();
    return () => {
      cancelled = true;
    };
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
