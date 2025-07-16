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
        // Only include the features we want
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
        // Disable other features
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

      // If editor is empty, return empty string
      if (!text.trim()) {
        onChange?.('');
        return;
      }

      onChange?.(editor.getHTML());
    },
    onCreate: ({ editor }) => {
      // Set initial content if provided
      if (value) {
        editor.commands.setContent(value);
      }
    },
  });

  // Handle content changes and enforce bullet point rules
  React.useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      const text = editor.getText().trim();

      if (text.length > 0) {
        // Check if we're in a list
        const isInList =
          editor.isActive('bulletList') || editor.isActive('orderedList');

        if (!isInList) {
          // If we have content but not in a list, convert to bullet list
          editor.commands.toggleBulletList();
        }
      }
    };

    editor.on('update', handleUpdate);

    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor, id]);

  // Handle Enter key to ensure new bullet points
  React.useEffect(() => {
    if (!editor) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        const text = editor.getText().trim();
        const isInList =
          editor.isActive('bulletList') || editor.isActive('orderedList');

        if (!isInList && text.length > 0) {
          // If not in a list but have content, prevent default and create a bullet list
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

  // Handle typing to auto-create bullet points
  React.useEffect(() => {
    if (!editor) return;

    const handleInput = () => {
      const { state } = editor;
      const { doc } = state;
      const text = doc.textContent.trim();

      if (text.length === 1) {
        // First character typed, ensure we're in a bullet list
        const isInList =
          editor.isActive('bulletList') || editor.isActive('orderedList');
        if (!isInList) {
          // Wrap the content in a bullet list
          editor.commands.toggleBulletList();
        }
      }
    };

    editor.on('update', handleInput);

    return () => {
      editor.off('update', handleInput);
    };
  }, [editor]);

  // Handle character limit enforcement
  React.useEffect(() => {
    if (!editor || !maxLength) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Stop arrow key events from bubbling up to prevent interference with submission navigation
      if (
        ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)
      ) {
        event.stopPropagation();
      }

      // Always allow deletion keys
      if (
        event.key === 'Backspace' ||
        event.key === 'Delete' ||
        event.ctrlKey ||
        event.metaKey ||
        event.altKey
      ) {
        return;
      }

      // For printable characters, check if they would exceed the limit
      if (event.key.length === 1) {
        const currentLength = editor.storage.characterCount.characters();
        if (currentLength >= maxLength) {
          event.preventDefault();
          return;
        }
      }
    };

    const handleBeforeInput = (event: InputEvent) => {
      // Allow deletion operations
      if (
        event.inputType === 'deleteContentBackward' ||
        event.inputType === 'deleteContentForward' ||
        event.inputType === 'deleteContent' ||
        event.inputType === 'deleteByCut'
      ) {
        return;
      }

      // For insertions, check character limit
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
        // Block paste if it would exceed the limit
        return;
      }
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
      <ScrollArea className="h-full w-full pr-3" type="always" key={id}>
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
            padding-left: 0px !important;
            padding-right: 0px !important;
            word-break: break-word;
            overflow-wrap: break-word;
            word-wrap: break-word; /* Fallback for older browsers */
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
          }

          .notes-rich-editor ol {
            list-style: decimal;
            padding-left: 1rem;
          }

          .notes-rich-editor li {
            display: list-item;
            margin: 0;
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
