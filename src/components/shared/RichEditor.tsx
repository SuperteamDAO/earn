import { Box, ButtonGroup, IconButton } from '@chakra-ui/react';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';
import { type Editor, EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import React, { useCallback, useEffect, useState } from 'react';
import { BiBold, BiItalic } from 'react-icons/bi';
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

  const updateToolbarPosition = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
      setStyle((style) => ({ ...style, opacity: 0 }));
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
  }, []);
  useEffect(() => {
    if (!editor) return;

    const editorElement = document.getElementById('reset-des');

    const handleSelectionChange = () => {
      setTimeout(updateToolbarPosition, 0);
    };

    document.addEventListener('selectionchange', handleSelectionChange);
    window.addEventListener('resize', updateToolbarPosition);
    editorElement?.addEventListener('scroll', updateToolbarPosition);
    editor.on('selectionUpdate', updateToolbarPosition);
    editor.on('transaction', updateToolbarPosition);

    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange);
      window.removeEventListener('resize', updateToolbarPosition);
      editorElement?.removeEventListener('scroll', updateToolbarPosition);
      editor.off('selectionUpdate', updateToolbarPosition);
      editor.off('transaction', updateToolbarPosition);
    };
  }, [updateToolbarPosition, editor]);

  if (!editor) {
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
      <ButtonGroup
        color="brand.slate.500"
        bg="white"
        borderColor="brand.slate.500"
        borderRadius="md"
        shadow="md"
        isAttached
        size="sm"
        variant="outline"
      >
        <IconButton
          color={editor.isActive('bold') ? 'white' : 'brand.slate.500'}
          bg={editor.isActive('bold') ? 'brand.slate.500' : 'white'}
          borderColor="brand.slate.500"
          aria-label="Bold"
          icon={<BiBold />}
          onClick={() => editor.chain().focus().toggleBold().run()}
        />

        <IconButton
          color={editor.isActive('italic') ? 'white' : 'brand.slate.500'}
          bg={editor.isActive('italic') ? 'brand.slate.500' : 'white'}
          borderColor="brand.slate.500"
          aria-label="Italic"
          icon={<BiItalic />}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        />
        <IconButton
          color={editor.isActive('orderedList') ? 'white' : 'brand.slate.500'}
          bg={editor.isActive('orderedList') ? 'brand.slate.500' : 'white'}
          borderColor="brand.slate.500"
          aria-label="Ordered List"
          icon={<FaListOl />}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        />

        <IconButton
          color={editor.isActive('bulletList') ? 'white' : 'brand.slate.500'}
          bg={editor.isActive('bulletList') ? 'brand.slate.500' : 'white'}
          borderColor="brand.slate.500"
          aria-label="Unordered List"
          icon={<FaListUl />}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        />
      </ButtonGroup>
    </Box>
  );
};
