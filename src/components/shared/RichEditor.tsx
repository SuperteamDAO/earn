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

const RichComponent: React.FC = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TaskList,
      TaskItem,
      Placeholder.configure({
        placeholder: 'Write something...',
      }),
      Link.configure({
        openOnClick: false,
      }),
    ],
    content: '',
    editorProps: {
      attributes: {
        class:
          'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
  });

  if (!editor) {
    return null;
  }

  return (
    <Box pos="relative" w="full">
      <FloatingToolbar editor={editor} />
      <Box
        className="editor"
        overflowY="auto"
        w="full"
        h="500px"
        id="reset-des"
      >
        <EditorContent editor={editor} />
      </Box>
    </Box>
  );
};

export default RichComponent;

interface FloatingToolbarProps {
  editor: Editor;
}

const FloatingToolbar: React.FC<FloatingToolbarProps> = ({ editor }) => {
  const [style, setStyle] = useState({ top: 0, left: 0, opacity: 0 });
  const [toolbarState, setToolbarState] = useState<
    'default' | 'link' | 'hidden'
  >('hidden');
  const [linkUrl, setLinkUrl] = useState('');
  const toolbarRef = useRef<HTMLDivElement>(null);

  const updateToolbarPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      if (toolbarState !== 'link') {
        // Prevent hiding when in 'link' state
        setStyle((style) => ({ ...style, opacity: 0 }));
      }
      return;
    }

    const range = selection.getRangeAt(0);
    const rect = range.getBoundingClientRect();

    const editorElement = document.getElementById('reset-des');
    if (!editorElement) {
      return;
    }

    const editorRect = editorElement.getBoundingClientRect();

    const toolbarHeight = 40;
    const offset = 120;

    let computedTop =
      rect.top -
      editorRect.top +
      editorElement.scrollTop -
      toolbarHeight -
      offset;
    let computedLeft =
      rect.left - editorRect.left + editorElement.scrollLeft + rect.width / 2;

    const toolbarWidth = 200; // Approximate width of your toolbar
    const maxLeft = editorElement.clientWidth - toolbarWidth / 2;
    const minLeft = toolbarWidth / 2;

    if (computedLeft < minLeft) computedLeft = minLeft;
    if (computedLeft > maxLeft) computedLeft = maxLeft;

    if (computedTop < 0) computedTop = 0;

    setStyle({
      top: computedTop,
      left: computedLeft,
      opacity: 1,
    });
    setToolbarState('default');
  }, [toolbarState]);

  useEffect(() => {
    if (!editor) return;

    const editorElement = document.getElementById('reset-des');

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
          const { href } = editor.getAttributes('link');
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
              if (linkUrl) {
                editor
                  .chain()
                  .focus()
                  .extendMarkRange('link')
                  .setLink({ href: linkUrl })
                  .run();
              }
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
      top={`${style.top}px`}
      left={`${style.left}px`}
      opacity={style.opacity}
      transform="translateX(-50%)"
      transition="opacity 0.2s"
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
