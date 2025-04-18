import {
  CaretDownIcon,
  CodeIcon,
  DividerHorizontalIcon,
  PlusIcon,
  QuoteIcon,
} from '@radix-ui/react-icons';
import type { Editor } from '@tiptap/react';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { GoTasklist } from 'react-icons/go';

import type { toggleVariants } from '@/components/ui/toggle';

import type { FormatAction } from '../../types';
import { ImageEditDialog } from '../image/image-edit-dialog';
import { LinkEditPopover } from '../link/link-edit-popover';
import { ToolbarSection } from '../toolbar-section';

type InsertElementAction =
  | 'codeBlock'
  | 'blockquote'
  | 'horizontalRule'
  | 'taskList';
interface InsertElement extends FormatAction {
  value: InsertElementAction;
}

const formatActions: InsertElement[] = [
  {
    value: 'codeBlock',
    label: 'Code block',
    icon: <CodeIcon className="size-5" />,
    action: (editor) => editor.chain().focus().toggleCodeBlock().run(),
    isActive: (editor) => editor.isActive('codeBlock'),
    canExecute: (editor) =>
      editor.can().chain().focus().toggleCodeBlock().run(),
    shortcuts: ['mod', 'alt', 'C'],
  },
  {
    value: 'blockquote',
    label: 'Blockquote',
    icon: <QuoteIcon className="size-5" />,
    action: (editor) => editor.chain().focus().toggleBlockquote().run(),
    isActive: (editor) => editor.isActive('blockquote'),
    canExecute: (editor) =>
      editor.can().chain().focus().toggleBlockquote().run(),
    shortcuts: ['mod', 'shift', 'B'],
  },
  {
    value: 'horizontalRule',
    label: 'Divider',
    icon: <DividerHorizontalIcon className="size-5" />,
    action: (editor) => editor.chain().focus().setHorizontalRule().run(),
    isActive: () => false,
    canExecute: (editor) =>
      editor.can().chain().focus().setHorizontalRule().run(),
    shortcuts: ['mod', 'alt', '-'],
  },
  {
    value: 'taskList',
    label: 'Task list',
    icon: <GoTasklist className="size-5" />,
    action: (editor) => editor.chain().focus().toggleTaskList().run(),
    isActive: (editor) => editor.isActive('taskList'),
    canExecute: (editor) => editor.can().chain().focus().toggleTaskList().run(),
    shortcuts: ['mod', 'shift', 'T'],
  },
];

interface SectionFiveProps extends VariantProps<typeof toggleVariants> {
  editor: Editor;
  activeActions?: InsertElementAction[];
  mainActionCount?: number;
}

export const SectionFive: React.FC<SectionFiveProps> = ({
  editor,
  activeActions = formatActions.map((action) => action.value),
  mainActionCount = 0,
  size,
  variant,
}) => {
  return (
    <>
      <LinkEditPopover editor={editor} size={size} variant={variant} />
      <ImageEditDialog editor={editor} size={size} variant={variant} />
      <ToolbarSection
        editor={editor}
        actions={formatActions}
        activeActions={activeActions}
        mainActionCount={mainActionCount}
        dropdownIcon={
          <>
            <PlusIcon className="size-5" />
            <CaretDownIcon className="size-5" />
          </>
        }
        dropdownTooltip="Insert elements"
        size={size}
        variant={variant}
      />
    </>
  );
};

SectionFive.displayName = 'SectionFive';
