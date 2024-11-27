import { type Content, type Editor, EditorContent } from '@tiptap/react';
import * as React from 'react';

import { Separator } from '@/components/ui/separator';
import { cn } from '@/utils';

import { LinkBubbleMenu } from './components/bubble-menu/link-bubble-menu';
import { MeasuredContainer } from './components/measured-container';
import { SectionFive } from './components/section/five';
import { SectionFour } from './components/section/four';
import { SectionOne } from './components/section/one';
import { SectionThree } from './components/section/three';
import { SectionTwo } from './components/section/two';
import {
  useMinimalTiptapEditor,
  type UseMinimalTiptapEditorProps,
} from './hooks/use-minimal-tiptap';

export interface MinimalTiptapProps
  extends Omit<UseMinimalTiptapEditorProps, 'onUpdate'> {
  value?: Content;
  onChange?: (value: Content) => void;
  className?: string;
  editorContentClassName?: string;
  toolbarClassName?: string;
}

const Toolbar = ({
  editor,
  className,
}: {
  editor: Editor;
  className?: string;
}) => (
  <div
    className={cn(
      'shrink-0 overflow-x-auto border-b border-border p-2',
      className,
    )}
  >
    <div className="flex w-max items-center gap-px">
      <SectionOne editor={editor} activeLevels={[1, 2, 3, 4, 5, 6]} />

      <Separator orientation="vertical" className="mx-2 h-7" />

      <SectionTwo
        editor={editor}
        activeActions={[
          'bold',
          'italic',
          'underline',
          'strikethrough',
          'code',
          'clearFormatting',
        ]}
        mainActionCount={5}
      />

      <Separator orientation="vertical" className="mx-2 h-7" />

      <SectionThree editor={editor} />

      <Separator orientation="vertical" className="mx-2 h-7" />

      <SectionFour
        editor={editor}
        activeActions={['orderedList', 'bulletList']}
        mainActionCount={2}
      />

      <Separator orientation="vertical" className="mx-2 h-7" />

      <SectionFive
        editor={editor}
        activeActions={['codeBlock', 'blockquote', 'horizontalRule']}
        mainActionCount={0}
      />
    </div>
  </div>
);

export const MinimalTiptapEditor = React.forwardRef<
  HTMLDivElement,
  MinimalTiptapProps
>(
  (
    {
      value,
      onChange,
      className,
      editorContentClassName,
      toolbarClassName,
      ...props
    },
    ref,
  ) => {
    const editor = useMinimalTiptapEditor({
      value,
      onUpdate: onChange,
      ...props,
    });

    if (!editor) {
      return null;
    }

    return (
      <MeasuredContainer
        as="div"
        name="editor"
        ref={ref}
        className={cn(
          'flex h-auto min-h-72 w-full flex-col rounded-md border border-input shadow-sm focus-within:border-primary',
          className,
        )}
      >
        <Toolbar editor={editor} className={toolbarClassName} />
        <EditorContent
          editor={editor}
          className={cn('minimal-tiptap-editor', editorContentClassName)}
        />
        <LinkBubbleMenu editor={editor} />
      </MeasuredContainer>
    );
  },
);

MinimalTiptapEditor.displayName = 'MinimalTiptapEditor';

export default MinimalTiptapEditor;
