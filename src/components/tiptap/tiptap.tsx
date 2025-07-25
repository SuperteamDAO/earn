import { type Editor, EditorContent } from '@tiptap/react';
import * as React from 'react';

import { cn } from '@/utils/cn';

import { Separator } from '../ui/separator';
import { LinkBubbleMenu } from './components/bubble-menu/link-bubble-menu';
import { MeasuredContainer } from './components/measured-container';
import { SectionFive } from './components/section/five';
import { SectionFour } from './components/section/four';
import { SectionOne } from './components/section/one';
import { SectionThree } from './components/section/three';
import { SectionTwo } from './components/section/two';
import {
  type MinimalTiptapEditorReturn,
  useMinimalTiptapEditor,
  type UseMinimalTiptapEditorProps,
} from './hooks/use-minimal-tiptap';

export interface MinimalTiptapProps
  extends Omit<UseMinimalTiptapEditorProps, 'onUpdate'> {
  value?: UseMinimalTiptapEditorProps['value'];
  onChange?: UseMinimalTiptapEditorProps['onUpdate'];
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
      'border-border shrink-0 overflow-x-auto border-b p-2',
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
    const { editor } = useMinimalTiptapEditor({
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
          'border-input focus-within:border-primary flex h-auto min-h-72 w-full flex-col rounded-md border shadow-xs',
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

export interface MinimalTiptapWithImageManagementProps
  extends MinimalTiptapProps {
  onGetImageManager?: (manager: {
    getPendingImageDeletions: () => string[];
    processPendingDeletions: () => Promise<void>;
    clearPendingDeletions: () => void;
  }) => void;
}

export const useMinimalTiptapWithImageManagement = (
  props: MinimalTiptapWithImageManagementProps,
) => {
  const {
    editor,
    getPendingImageDeletions,
    processPendingDeletions,
    clearPendingDeletions,
  } = useMinimalTiptapEditor({
    value: props.value,
    onUpdate: props.onChange,
    ...props,
  });

  React.useEffect(() => {
    if (props.onGetImageManager) {
      props.onGetImageManager({
        getPendingImageDeletions,
        processPendingDeletions,
        clearPendingDeletions,
      });
    }
  }, [
    props.onGetImageManager,
    getPendingImageDeletions,
    processPendingDeletions,
    clearPendingDeletions,
  ]);

  return {
    editor,
    getPendingImageDeletions,
    processPendingDeletions,
    clearPendingDeletions,
  };
};

export {
  type MinimalTiptapEditorReturn,
  useMinimalTiptapEditor,
  type UseMinimalTiptapEditorProps,
};
