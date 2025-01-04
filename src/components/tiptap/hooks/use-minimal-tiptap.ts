import { Placeholder } from '@tiptap/extension-placeholder';
import { TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { Underline } from '@tiptap/extension-underline';
import {
  type Content,
  type Editor,
  useEditor,
  type UseEditorOptions,
} from '@tiptap/react';
import { StarterKit } from '@tiptap/starter-kit';
import * as React from 'react';
import { toast } from 'sonner';

import { cn } from '@/utils/cn';
import { type EARN_IMAGE_FOLDER, uploadAndReplaceImage } from '@/utils/image';

import { CodeBlockLowlight } from '../extensions/code-block-lowlight/code-block-lowlight';
import { Color } from '../extensions/color';
import { FileHandler } from '../extensions/file-handler';
import { HorizontalRule } from '../extensions/horizontal-rule';
import { Image } from '../extensions/image';
import { Link } from '../extensions/link';
import { ResetMarksOnEnter } from '../extensions/reset-marks-on-enter';
import { Selection } from '../extensions/selection';
import { UnsetAllMarks } from '../extensions/unset-all-marks';
import { getOutput, reasonToText } from '../utils';
import { useThrottle } from './use-throttle';

interface ImageSetting {
  folderName: EARN_IMAGE_FOLDER;
  type: string;
}
export interface UseMinimalTiptapEditorProps extends UseEditorOptions {
  value?: Content;
  output?: 'html' | 'json' | 'text';
  placeholder?: string;
  editorClassName?: string;
  throttleDelay?: number;
  onUpdate?: (content: Content) => void;
  onBlur?: (content: Content) => void;
  imageSetting: ImageSetting;
}

const createExtensions = (placeholder: string, imageSetting: ImageSetting) => [
  StarterKit.configure({
    horizontalRule: false,
    codeBlock: false,
    paragraph: { HTMLAttributes: { class: 'text-node' } },
    heading: { HTMLAttributes: { class: 'heading-node' } },
    blockquote: { HTMLAttributes: { class: 'block-node' } },
    bulletList: { HTMLAttributes: { class: 'list-node' } },
    orderedList: { HTMLAttributes: { class: 'list-node' } },
    code: { HTMLAttributes: { class: 'inline', spellcheck: 'false' } },
    dropcursor: { width: 2, class: 'ProseMirror-dropcursor border' },
  }),
  Link,
  Underline,
  Image.configure({
    allowedMimeTypes: ['image/*'],
    maxFileSize: 5 * 1024 * 1024,
    allowBase64: true,
    uploadFn: async (file) => {
      const src = await uploadAndReplaceImage({
        newFile: file,
        folder: imageSetting.folderName,
        type: imageSetting.type as 'pfp' | 'sponsor',
      });
      // wait 3s to simulate upload
      // await new Promise((resolve) => setTimeout(resolve, 3000));

      // const src = await fileToBase64(file);

      // either return { id: string | number, src: string } or just src
      return src;
      // return { id: randomId(), src };
    },
    onImageRemoved({ id, src }) {
      console.log('Image removed', { id, src });
    },
    onValidationError(errors) {
      errors.forEach((error) => {
        const errorContent = reasonToText(error.reason);
        toast.error(errorContent.title, {
          position: 'bottom-right',
          description: errorContent.subTitle,
        });
      });
    },
    onActionSuccess({ action }) {
      const mapping = {
        copyImage: 'Copy Image',
        copyLink: 'Copy Link',
        download: 'Download',
      };
      toast.success(mapping[action], {
        position: 'bottom-right',
        description: 'Image action success',
      });
    },
    onActionError(error, { action }) {
      const mapping = {
        copyImage: 'Copy Image',
        copyLink: 'Copy Link',
        download: 'Download',
      };
      toast.error(`Failed to ${mapping[action]}`, {
        position: 'bottom-right',
        description: error.message,
      });
    },
  }),
  FileHandler.configure({
    allowBase64: true,
    allowedMimeTypes: ['image/*'],
    maxFileSize: 5 * 1024 * 1024,
    onDrop: (editor, files, pos) => {
      files.forEach(async (file) => {
        const src = await uploadAndReplaceImage({
          newFile: file,
          folder: imageSetting.folderName,
          type: imageSetting.type as 'pfp' | 'sponsor',
        });
        editor.commands.insertContentAt(pos, {
          type: 'image',
          attrs: { src },
        });
      });
    },
    onPaste: (editor, files) => {
      files.forEach(async (file) => {
        const src = await uploadAndReplaceImage({
          newFile: file,
          folder: imageSetting.folderName,
          type: imageSetting.type as 'pfp' | 'sponsor',
        });
        editor.commands.insertContent({
          type: 'image',
          attrs: { src },
        });
      });
    },
    onValidationError: (errors) => {
      errors.forEach((error) => {
        const errorContent = reasonToText(error.reason);
        toast.error(errorContent.title, {
          position: 'bottom-right',
          description: errorContent.subTitle,
        });
      });
    },
  }),
  Color,
  TextStyle,
  Selection,
  Typography,
  UnsetAllMarks,
  HorizontalRule,
  ResetMarksOnEnter,
  CodeBlockLowlight,
  Placeholder.configure({ placeholder: () => placeholder }),
];

export const useMinimalTiptapEditor = ({
  value,
  output = 'html',
  placeholder = '',
  editorClassName,
  throttleDelay = 0,
  onUpdate,
  onBlur,
  imageSetting,
  ...props
}: UseMinimalTiptapEditorProps) => {
  const throttledSetValue = useThrottle(
    (value: Content) => onUpdate?.(value),
    throttleDelay,
  );

  const handleUpdate = React.useCallback(
    (editor: Editor) => throttledSetValue(getOutput(editor, output)),
    [output, throttledSetValue],
  );

  const handleCreate = React.useCallback(
    (editor: Editor) => {
      if (value && editor.isEmpty) {
        editor.commands.setContent(value);
      }
    },
    [value],
  );

  const handleBlur = React.useCallback(
    (editor: Editor) => onBlur?.(getOutput(editor, output)),
    [output, onBlur],
  );

  const editor = useEditor({
    extensions: createExtensions(placeholder, imageSetting),
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: cn('focus:outline-none', editorClassName),
      },
    },
    onUpdate: ({ editor }) => handleUpdate(editor),
    onCreate: ({ editor }) => handleCreate(editor),
    onBlur: ({ editor }) => handleBlur(editor),
    ...props,
  });

  return editor;
};
