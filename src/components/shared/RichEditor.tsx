import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  ChevronRight,
  ExternalLink,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Trash2,
} from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/utils';

interface RichEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
  error?: boolean;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  id,
  value,
  onChange,
  height = '10rem',
  placeholder = 'Write something...',
  error = false,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem,
      Placeholder.configure({
        placeholder,
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: value || undefined,
    editorProps: {
      attributes: {
        class: 'mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
    immediatelyRender: false,
  });

  useEffect(() => {
    if (editor && value && editor.getHTML() !== value) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="relative w-full">
      <FloatingToolbar editor={editor} editorClassname={`editor-${id}`} />
      <div
        className={cn(
          'w-full overflow-y-auto rounded-md border py-2 shadow-sm [&_*]:!text-[0.875rem]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-sm',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:text-slate-400',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:float-left',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:h-0',
          '[&_.ProseMirror_p.is-editor-empty:first-child::before]:pointer-events-none',
          height,
          error ? 'border border-destructive' : 'border-input',
          'focus-within:border focus-within:border-brand-purple',
          `editor-${id}`,
        )}
        id="reset-des"
        ref={editorRef}
      >
        <EditorContent editor={editor} className="mt-0 text-sm" />
      </div>
    </div>
  );
};

interface FloatingToolbarProps {
  editor: Editor;
  editorClassname: string;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  editor,
  editorClassname,
}) => {
  const [style, setStyle] = useState({ top: 0, left: 0, opacity: 0 });
  const [toolbarState, setToolbarState] = useState<
    'default' | 'link' | 'hidden'
  >('hidden');
  const [linkUrl, setLinkUrl] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbarPosition = useCallback(() => {
    const editorElement = document.getElementsByClassName(editorClassname)[0];
    if (!editorElement) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (toolbarState !== 'link') {
        setStyle((style) => ({ ...style, opacity: 0 }));
      }
      return;
    }

    if (!editorElement.contains(selection.anchorNode)) {
      setStyle((style) => ({ ...style, opacity: 0 }));
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    const editorRect = editorElement.getBoundingClientRect();
    const toolbarHeight = 30;
    const toolbarWidth = 200;
    const offset = 10;
    const mobileBreakpoint = 768;

    const isMobile = window.innerWidth <= mobileBreakpoint;

    let computedTop;
    if (isMobile) {
      computedTop =
        rect.bottom - editorRect.top + editorElement.scrollTop + offset;
    } else {
      computedTop =
        rect.top -
        editorRect.top +
        editorElement.scrollTop -
        toolbarHeight -
        offset;
    }

    let computedLeft =
      rect.left -
      editorRect.left +
      editorElement.scrollLeft +
      rect.width / 2 -
      toolbarWidth / 2;

    computedLeft = Math.max(
      0,
      Math.min(computedLeft, editorElement.clientWidth - toolbarWidth),
    );

    const viewportWidth = window.innerWidth;

    if (editorRect.left + computedLeft + toolbarWidth > viewportWidth) {
      computedLeft = viewportWidth - editorRect.left - toolbarWidth - offset;
    }

    setStyle({
      top: computedTop,
      left: Math.max(0, computedLeft),
      opacity: 1,
    });
    setToolbarState('default');
  }, [toolbarState, editorClassname]);

  useEffect(() => {
    if (!editor) return;
    const editorElement =
      document.getElementsByClassName(editorClassname)[0] || undefined;
    if (!editorElement) return;

    const handleSelectionChange = () => {
      setTimeout(updateToolbarPosition, 0);
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (
        toolbarRef.current &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        setToolbarState('hidden');
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setToolbarState('hidden');
      }
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('resize', updateToolbarPosition);
    editorElement?.addEventListener('scroll', updateToolbarPosition);
    editor.on('selectionUpdate', updateToolbarPosition);
    editor.on('transaction', updateToolbarPosition);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('resize', updateToolbarPosition);
      editorElement?.removeEventListener('scroll', updateToolbarPosition);
      editor.off('selectionUpdate', updateToolbarPosition);
      editor.off('transaction', updateToolbarPosition);
    };
  }, [updateToolbarPosition, editor]);

  const toolbarButtons = useMemo(
    () => [
      {
        ariaLabel: 'Bold',
        icon: <Bold className="h-4 w-4" />,
        isActive: () => editor.isActive('bold'),
        action: () => editor.chain().focus().toggleBold().run(),
      },
      {
        ariaLabel: 'Italic',
        icon: <Italic className="h-4 w-4" />,
        isActive: () => editor.isActive('italic'),
        action: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        ariaLabel: 'Ordered List',
        icon: <ListOrdered className="h-4 w-4" />,
        isActive: () => editor.isActive('orderedList'),
        action: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        ariaLabel: 'Unordered List',
        icon: <List className="h-4 w-4" />,
        isActive: () => editor.isActive('bulletList'),
        action: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        ariaLabel: 'Insert Link',
        icon: <LinkIcon className="h-4 w-4" />,
        isActive: () => editor.isActive('link'),
        action: () => {
          setToolbarState('link');
          let { href } = editor.getAttributes('link');
          if (!href) return setLinkUrl('');
          if (!href?.startsWith('http://') && !href?.startsWith('https://')) {
            href = 'https://' + href;
          }
          setLinkUrl(href || '');
        },
      },
    ],
    [editor],
  );

  const DefaultToolbar = useCallback(
    () => (
      <>
        {toolbarButtons.map((button, index) => (
          <Button
            key={index}
            variant="ghost"
            type="button"
            size="sm"
            className={cn(
              'h-full rounded-none border-l px-2',
              index === 0 && 'border-l-0',
              button.isActive() && 'bg-muted',
            )}
            onClick={button.action}
          >
            {button.icon}
          </Button>
        ))}
      </>
    ),
    [toolbarButtons],
  );

  function addLinkToEditor() {
    if (linkUrl) {
      let href = linkUrl;
      if (!href) return setLinkUrl('');
      if (!href?.startsWith('http://') && !href?.startsWith('https://')) {
        href = 'https://' + href;
      }
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
  }

  const LinkToolbar = useCallback(() => {
    return (
      <>
        <Input
          className="h-8 rounded-none border-0 text-sm focus-visible:ring-0"
          placeholder="https://..."
          value={linkUrl}
          onChange={(e) => setLinkUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addLinkToEditor();
              setToolbarState('default');
              setLinkUrl('');
            } else if (e.key === 'Escape') {
              e.preventDefault();
              setToolbarState('default');
              setLinkUrl('');
            }
          }}
        />
        {!!linkUrl && (
          <Button
            variant="ghost"
            type="button"
            className="h-11 rounded-none border-l px-2"
            onClick={() => {
              const { href } = editor.getAttributes('link');
              if (href) {
                window.open(href, '_blank');
              }
            }}
          >
            <ExternalLink className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="ghost"
          type="button"
          className="h-11 rounded-none border-l px-2"
          onClick={() => {
            editor.chain().focus().unsetLink().run();
            setToolbarState('default');
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          type="button"
          className="h-11 rounded-none border-l px-2 lg:hidden"
          onClick={() => {
            addLinkToEditor();
          }}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </>
    );
  }, [editor, linkUrl]);

  if (!editor || toolbarState === 'hidden') {
    return null;
  }

  return (
    <div
      ref={toolbarRef}
      className="absolute z-50"
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        opacity: style.opacity,
        transition: 'opacity 0.2s',
        pointerEvents: style.opacity === 0 ? 'none' : 'auto',
      }}
    >
      <div
        className={cn(
          'flex h-8 overflow-hidden rounded-md border bg-background shadow-md',
          'text-muted-foreground',
        )}
      >
        {toolbarState === 'default' && <DefaultToolbar />}
        {toolbarState === 'link' && <LinkToolbar />}
      </div>
    </div>
  );
};
