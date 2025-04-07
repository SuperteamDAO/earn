import {
  CaretDownIcon,
  ColumnSpacingIcon,
  RowSpacingIcon,
  TableIcon,
  TrashIcon,
} from '@radix-ui/react-icons';
import type { Editor } from '@tiptap/react';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';

import type { toggleVariants } from '@/components/ui/toggle';

import type { FormatAction } from '../../types';
import { ToolbarSection } from '../toolbar-section';

type TableAction =
  | 'insertTable'
  | 'deleteTable'
  | 'addRowAfter'
  | 'addRowBefore'
  | 'addColumnAfter'
  | 'addColumnBefore'
  | 'deleteColumn'
  | 'deleteRow';

interface TableElement extends FormatAction {
  value: TableAction;
}

const tableActions: TableElement[] = [
  {
    value: 'insertTable',
    label: 'Insert Table',
    icon: <TableIcon className="size-5" />,
    action: (editor) =>
      editor
        .chain()
        .focus()
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
    isActive: (editor) => editor.isActive('table'),
    canExecute: (editor) => editor.can().chain().focus().insertTable().run(),
    shortcuts: ['mod', 'alt', 'T'],
  },
  {
    value: 'deleteTable',
    label: 'Delete Table',
    icon: <TrashIcon className="size-5" />,
    action: (editor) => editor.chain().focus().deleteTable().run(),
    isActive: () => false,
    canExecute: (editor) => editor.can().chain().focus().deleteTable().run(),
    shortcuts: ['mod', 'shift', 'D'],
  },
  {
    value: 'addRowAfter',
    label: 'Add Row After',
    icon: <RowSpacingIcon className="size-5" />,
    action: (editor) => editor.chain().focus().addRowAfter().run(),
    isActive: () => false,
    canExecute: (editor) => editor.can().chain().focus().addRowAfter().run(),
    shortcuts: ['mod', 'shift', 'R'],
  },
  {
    value: 'addRowBefore',
    label: 'Add Row Before',
    icon: <RowSpacingIcon className="size-5" />,
    action: (editor) => editor.chain().focus().addRowBefore().run(),
    isActive: () => false,
    canExecute: (editor) => editor.can().chain().focus().addRowBefore().run(),
    shortcuts: ['mod', 'alt', 'R'],
  },
  {
    value: 'addColumnAfter',
    label: 'Add Column After',
    icon: <ColumnSpacingIcon className="size-5" />,
    action: (editor) => editor.chain().focus().addColumnAfter().run(),
    isActive: () => false,
    canExecute: (editor) => editor.can().chain().focus().addColumnAfter().run(),
    shortcuts: ['mod', 'shift', 'C'],
  },
  {
    value: 'addColumnBefore',
    label: 'Add Column Before',
    icon: <ColumnSpacingIcon className="size-5" />,
    action: (editor) => editor.chain().focus().addColumnBefore().run(),
    isActive: () => false,
    canExecute: (editor) =>
      editor.can().chain().focus().addColumnBefore().run(),
    shortcuts: ['mod', 'alt', 'C'],
  },
  {
    value: 'deleteColumn',
    label: 'Delete Column',
    icon: <ColumnSpacingIcon className="size-5" />,
    action: (editor) => editor.chain().focus().deleteColumn().run(),
    isActive: () => false,
    canExecute: (editor) => editor.can().chain().focus().deleteColumn().run(),
    shortcuts: ['mod', 'shift', 'X'],
  },
  {
    value: 'deleteRow',
    label: 'Delete Row',
    icon: <RowSpacingIcon className="size-5" />,
    action: (editor) => editor.chain().focus().deleteRow().run(),
    isActive: () => false,
    canExecute: (editor) => editor.can().chain().focus().deleteRow().run(),
    shortcuts: ['mod', 'shift', 'X'],
  },
];

interface SectionSixProps extends VariantProps<typeof toggleVariants> {
  editor: Editor;
  tableActions?: TableAction[];
  mainActionCount?: number;
}

export const SectionSix: React.FC<SectionSixProps> = ({
  editor,
  tableActions: activeActions = tableActions.map((action) => action.value),
  mainActionCount = 0,
  size,
  variant,
}) => {
  return (
    <ToolbarSection
      editor={editor}
      actions={tableActions}
      activeActions={activeActions}
      mainActionCount={mainActionCount}
      dropdownIcon={
        <>
          <TableIcon className="size-5" />
          <CaretDownIcon className="size-5" />
        </>
      }
      dropdownTooltip="Table operations"
      size={size}
      variant={variant}
    />
  );
};

SectionSix.displayName = 'SectionSix';
