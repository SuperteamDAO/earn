import CharacterCount from '@tiptap/extension-character-count';
import Placeholder from '@tiptap/extension-placeholder';
import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import * as React from 'react';

import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils/cn';

export interface NotesRichEditorProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  maxLength?: number;
  id?: string;
}

const useNotesEditor = ({
  value,
  onChange,
  placeholder = 'Start typing to create a bullet point...',
  maxLength,
  id,
}: {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
  id?: string;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: {
          HTMLAttributes: {
            class: 'list-disc list-inside space-y-1',
          },
        },
        orderedList: {
          HTMLAttributes: {
            class: 'list-decimal list-inside space-y-1',
          },
        },
        heading: false,
        horizontalRule: false,
        codeBlock: false,
        blockquote: false,
        code: false,
        strike: false,
        hardBreak: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({
        placeholder,
      }),
      CharacterCount.configure({
        limit: maxLength,
      }),
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'notes-rich-editor focus:outline-none',
      },
    },

    onUpdate: ({ editor }) => {
      const text = editor.getText();

      if (!text.trim()) {
        onChange?.('');
        return;
      }

      onChange?.(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      if (value) {
        editor.commands.setContent(value);
      }
    },
  });

  React.useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const text = editor.getText().trim();

      if (text.length > 0) {
        const isInList =
          editor.isActive('bulletList') || editor.isActive('orderedList');

        if (!isInList) {
          editor.commands.toggleBulletList();
        }
      }
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, id]);

  React.useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const text = editor.getText().trim();
        const isInList =
          editor.isActive('bulletList') || editor.isActive('orderedList');

        if (!isInList && text.length > 0) {
          event.preventDefault();
          editor.commands.toggleBulletList();
          return;
        }
      }
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
    };
  }, [editor]);

  React.useEffect(() => {
    if (!editor) return;

    const handleInput = () => {
      const { state } = editor;
      const { doc } = state;
      const text = doc.textContent.trim();

      if (text.length === 1) {
        const isInList =
          editor.isActive('bulletList') || editor.isActive('orderedList');
        if (!isInList) {
          editor.commands.toggleBulletList();
        }
      }
    };

    editor.on('update', handleInput);

    return () => {
      editor.off('update', handleInput);
    };
  }, [editor]);

  React.useEffect(() => {
    if (!editor || !maxLength) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
      ) {
        event.stopPropagation();
      }

      if (
        event.key === 'Backspace' ||
        event.key === 'Delete' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      if (event.key.length === 1) {
        const currentLength = editor.storage.characterCount.characters();
        if (currentLength >= maxLength) {
          event.preventDefault();
          return;
        }
      }
    };

    const handleBeforeInput = (event: InputEvent) => {
      if (
        event.inputType === 'deleteContentBackward' ||
        event.inputType === 'deleteContentForward' ||
        event.inputType === 'deleteContent' ||
        event.inputType === 'deleteByCut'
      ) {
        return;
      }

      const newContent = event.data || '';
      const currentLength = editor.storage.characterCount.characters();
      if (newContent && currentLength + newContent.length > maxLength) {
        event.preventDefault();
      }
    };

    const handlePaste = (event: ClipboardEvent) => {
      event.preventDefault();
      let pastedText = event.clipboardData?.getData('text') || '';
      if (!pastedText) return;

      pastedText = pastedText
        .split('\n')
        .map((line) => line.trim())
        .filter((line) => line.length > 0)
        .join('\n');

      const currentLength = editor.storage.characterCount.characters();
      if (currentLength + pastedText.length > maxLength) {
        return;
      }

      requestAnimationFrame(() => {
        editor.commands.insertContent(pastedText);
        setTimeout(() => {
          const text = editor.getText().trim();
          if (
            text.length > 0 &&
            !editor.isActive('bulletList') &&
            !editor.isActive('orderedList')
          ) {
            editor.commands.toggleBulletList();
          }
        }, 0);
      });
    };

    const editorElement = editor.view.dom;
    editorElement.addEventListener('keydown', handleKeyDown);
    editorElement.addEventListener('beforeinput', handleBeforeInput);
    editorElement.addEventListener('paste', handlePaste);

    return () => {
      editorElement.removeEventListener('keydown', handleKeyDown);
      editorElement.removeEventListener('beforeinput', handleBeforeInput);
      editorElement.removeEventListener('paste', handlePaste);
    };
  }, [editor, maxLength]);

  return editor;
};

export const NotesRichEditor: React.FC<NotesRichEditorProps> = ({
  value,
  onChange,
  placeholder,
  className,
  disabled,
  maxLength,
  id,
}) => {
  const editor = useNotesEditor({
    value,
    onChange,
    placeholder,
    maxLength,
    id,
  });

  React.useEffect(() => {
    if (editor && disabled !== undefined) {
      editor.setEditable(!disabled);
    }
  }, [editor, disabled]);

  if (!editor) {
    return null;
  }

  return (
    <div className="h-full w-full" key={id}>
      <ScrollArea className="h-full w-full" type="always" key={id}>
        <EditorContent
          key={id}
          editor={editor}
          className={cn(
            'h-full',
            {
              'pointer-events-none opacity-50': disabled,
            },
            className,
          )}
        />
        <style jsx global>{`
          .notes-rich-editor {
            outline: none;
            height: 100%;
            display: flex;
            flex-direction: column;
            min-height: 25rem !important;
            max-height: 25rem;
            padding-left: 0rem !important;
            padding-right: 0px !important;
            word-break: break-word;
            overflow-wrap: break-word;
            word-wrap: break-word;
            overflow-x: hidden;
            max-width: 100%;
            box-sizing: border-box;
          }

          .notes-rich-editor p.is-editor-empty:first-child::before {
            color: var(--color-slate-400);
          }

          .notes-rich-editor ul {
            list-style: disc;
            padding-left: 1rem;
            padding-bottom: 0.5rem;
          }
          .notes-rich-editor ul.list-inside {
            padding-right: 0.5rem;
          }

          .notes-rich-editor ol {
            list-style: decimal;
            padding-left: 1rem;
            padding-bottom: 0.5rem;
          }
          .notes-rich-editor ol.list-inside {
            padding-right: 0.5rem;
          }

          /* Safari-specific fix for list marker containment */
          @supports (-webkit-hyphens: none) {
            .notes-rich-editor ul {
              list-style: disc inside;
            }
            .notes-rich-editor ol {
              list-style: decimal inside;
              padding-left: 0rem;
            }
          }

          .notes-rich-editor li {
            display: list-item;
            margin: 0;
          }

          .notes-rich-editor ol > li {
            margin: 0 0 0.5rem 0;
          }

          .notes-rich-editor ol ul {
            padding-bottom: 0rem;
          }

          .notes-rich-editor ol > li:last-child {
            margin-bottom: 0;
          }

          .notes-rich-editor p {
            margin: 0;
          }

          .notes-rich-editor strong {
            font-weight: 600;
          }

          .notes-rich-editor em {
            font-style: italic;
          }
        `}</style>
      </ScrollArea>
    </div>
  );
};
