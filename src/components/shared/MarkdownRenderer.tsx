import React, { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const remarkPlugins = [remarkGfm];

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  return (
    <div className="minimal-tiptap-editor tiptap ProseMirror h-full w-full overflow-visible px-0! pb-7">
      <div className="tiptap ProseMirror listing-description mt-0! px-0!">
        <ReactMarkdown remarkPlugins={remarkPlugins}>{children}</ReactMarkdown>
      </div>
    </div>
  );
};

export const MarkdownRenderer = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
