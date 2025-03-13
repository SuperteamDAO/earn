import { CaretDownIcon, LetterCaseCapitalizeIcon } from '@radix-ui/react-icons';
import type { Level } from '@tiptap/extension-heading';
import type { Editor } from '@tiptap/react';
import type { VariantProps } from 'class-variance-authority';
import type { JSX } from 'react';
import * as React from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { toggleVariants } from '@/components/ui/toggle';
import { cn } from '@/utils/cn';

import type { FormatAction } from '../../types';
import { ShortcutKey } from '../shortcut-key';
import { ToolbarButton } from '../toolbar-button';

interface TextStyle
  extends Omit<
    FormatAction,
    'value' | 'icon' | 'action' | 'isActive' | 'canExecute'
  > {
  element: keyof JSX.IntrinsicElements;
  level?: Level;
  className: string;
}

const formatActions: TextStyle[] = [
  {
    label: 'Normal Text',
    element: 'span',
    className: 'grow',
    shortcuts: ['mod', 'alt', '0'],
  },
  {
    label: 'Heading 1',
    element: 'h1',
    level: 1,
    className: 'm-0 grow text-3xl font-extrabold',
    shortcuts: ['mod', 'alt', '1'],
  },
  {
    label: 'Heading 2',
    element: 'h2',
    level: 2,
    className: 'm-0 grow text-xl font-bold',
    shortcuts: ['mod', 'alt', '2'],
  },
  {
    label: 'Heading 3',
    element: 'h3',
    level: 3,
    className: 'm-0 grow text-lg font-semibold',
    shortcuts: ['mod', 'alt', '3'],
  },
];

interface SectionOneProps extends VariantProps<typeof toggleVariants> {
  editor: Editor;
  activeLevels?: Level[];
}

export const SectionOne: React.FC<SectionOneProps> = React.memo(
  ({ editor, activeLevels = [1, 2, 3], size, variant }) => {
    const filteredActions = React.useMemo(
      () =>
        formatActions.filter(
          (action) => !action.level || activeLevels.includes(action.level),
        ),
      [activeLevels],
    );

    const handleStyleChange = React.useCallback(
      (level?: Level) => {
        if (level) {
          editor.chain().focus().toggleHeading({ level }).run();
        } else {
          editor.chain().focus().setParagraph().run();
        }
      },
      [editor],
    );

    const renderMenuItem = React.useCallback(
      ({ label, element: Element, level, className, shortcuts }: TextStyle) => (
        <DropdownMenuItem
          key={label}
          onClick={() => handleStyleChange(level)}
          className={cn('flex flex-row items-center justify-between gap-4', {
            'bg-accent': level
              ? editor.isActive('heading', { level })
              : editor.isActive('paragraph'),
          })}
          aria-label={label}
        >
          <Element className={className}>{label}</Element>
          <ShortcutKey keys={shortcuts} />
        </DropdownMenuItem>
      ),
      [editor, handleStyleChange],
    );

    return (
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <ToolbarButton
            isActive={editor.isActive('heading')}
            tooltip="Text styles"
            aria-label="Text styles"
            pressed={editor.isActive('heading')}
            className="w-12"
            disabled={editor.isActive('codeBlock')}
            size={size}
            variant={variant}
          >
            <LetterCaseCapitalizeIcon className="size-5" />
            <CaretDownIcon className="size-5" />
          </ToolbarButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="z-[75] w-full">
          {filteredActions.map(renderMenuItem)}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  },
);

SectionOne.displayName = 'SectionOne';
