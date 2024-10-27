import { ChevronRightIcon } from '@chakra-ui/icons';
import { Box, HStack, IconButton, Input } from '@chakra-ui/react';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  BiBold,
  BiItalic,
  BiLink,
  BiLinkExternal,
  BiTrashAlt,
} from 'react-icons/bi';
import { FaListOl, FaListUl } from 'react-icons/fa6';

interface RichEditorProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  height?: string;
  placeholder?: string;
  isError?: boolean;
  maxHeight?: string;
}

export const RichEditor: React.FC<RichEditorProps> = ({
  id,
  value,
  onChange,
  height = '10rem',
  maxHeight = '10rem',
  placeholder = 'Write something...',
  isError = false,
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
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(html === '<p></p>' ? '' : html);
    },
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
    <Box pos="relative" w="full">
      <FloatingToolbar editor={editor} editorClassname={`editor-${id}`} />
      <Box
        className={`editor-${id}`}
        ref={editorRef}
        sx={{
          '.ProseMirror p.is-editor-empty:first-child::before': {
            color: 'var(--chakra-colors-gray-300)',
            content: 'attr(data-placeholder)',
            float: 'left',
            height: 0,
            pointerEvents: 'none',
          },
        }}
        overflowY="auto"
        w="full"
        h={height}
        maxH={maxHeight}
        py={2}
        borderWidth={isError ? '2px' : '1px'}
        borderColor={isError ? 'red.500' : 'brand.slate.300'}
        _focusWithin={{
          borderColor: 'brand.purple',
          borderWidth: '2px',
        }}
        id="reset-des"
        rounded="lg"
      >
        <EditorContent
          editor={editor}
          style={{
            height: '87%',
            marginTop: '0px !important',
          }}
        />
      </Box>
    </Box>
  );
};

interface FloatingToolbarProps {
  editor: Editor;
  editorClassname: string;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  editor,
  editorClassname: editorClassname,
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
        icon: <BiBold />,
        isActive: () => editor.isActive('bold'),
        action: () => editor.chain().focus().toggleBold().run(),
      },
      {
        ariaLabel: 'Italic',
        icon: <BiItalic />,
        isActive: () => editor.isActive('italic'),
        action: () => editor.chain().focus().toggleItalic().run(),
      },
      {
        ariaLabel: 'Ordered List',
        icon: <FaListOl />,
        isActive: () => editor.isActive('orderedList'),
        action: () => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        ariaLabel: 'Unordered List',
        icon: <FaListUl />,
        isActive: () => editor.isActive('bulletList'),
        action: () => editor.chain().focus().toggleBulletList().run(),
      },
      {
        ariaLabel: 'Insert Link',
        icon: <BiLink />,
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
          <IconButton
            key={index}
            h="full"
            color={button.isActive() ? 'brand.slate.900' : 'brand.slate.500'}
            bg={button.isActive() ? 'brand.slate.200' : 'white'}
            borderLeftWidth={index === 0 ? 0 : 1}
            borderLeftColor="brand.slate.300"
            borderRadius={0}
            aria-label={button.ariaLabel}
            icon={button.icon}
            onClick={button.action}
            size="sm"
          />
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
          w="full"
          h="full"
          fontSize={'sm'}
          border={'none'}
          _focusVisible={{ outline: 'none', border: 'none' }}
          _placeholder={{
            color: 'brand.slate.300',
          }}
          outline={'none'}
          autoFocus
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
          placeholder="https://..."
          size="sm"
          value={linkUrl}
        />
        {!!linkUrl && (
          <IconButton
            h="full"
            color={'brand.slate.500'}
            bg={'white'}
            borderLeftWidth={1}
            borderLeftColor="brand.slate.300"
            borderRadius={0}
            aria-label="Open Link"
            icon={<BiLinkExternal />}
            onClick={() => {
              const { href } = editor.getAttributes('link');
              if (href) {
                window.open(href, '_blank');
              }
            }}
            size="sm"
          />
        )}
        <IconButton
          h="full"
          color={'brand.slate.500'}
          bg={'white'}
          borderLeftWidth={1}
          borderLeftColor="brand.slate.300"
          borderRadius={0}
          aria-label="Remove Link"
          icon={<BiTrashAlt />}
          onClick={() => {
            editor.chain().focus().unsetLink().run();
            setToolbarState('default');
          }}
          size="sm"
        />
        <IconButton
          display={{ base: 'block', lg: 'none' }}
          h="full"
          color={'brand.slate.500'}
          bg={'white'}
          borderLeftWidth={1}
          borderLeftColor="brand.slate.300"
          borderRadius={0}
          aria-label="Open Link"
          icon={<ChevronRightIcon w={5} h={5} />}
          onClick={() => {
            addLinkToEditor();
          }}
          size="sm"
        />
      </>
    );
  }, [editor, linkUrl]);

  if (!editor || toolbarState === 'hidden') {
    return null;
  }

  return (
    <Box
      pos="absolute"
      zIndex={1000}
      pointerEvents={style.opacity === 0 ? 'none' : 'auto'}
      style={{
        top: `${style.top}px`,
        left: `${style.left}px`,
        opacity: style.opacity,
        transition: 'opacity 0.2s',
      }}
    >
      <HStack
        gap={0}
        overflow="hidden"
        h={8}
        color="brand.slate.500"
        bg="white"
        borderWidth={1}
        borderColor="brand.slate.300"
        borderRadius="md"
        shadow="md"
      >
        {toolbarState === 'default' && <DefaultToolbar />}
        {toolbarState === 'link' && <LinkToolbar />}
      </HStack>
    </Box>
  );
};
