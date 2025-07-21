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
import {
  deleteFromCld,
  type EARN_IMAGE_FOLDER,
  uploadAndReplaceImage,
} from '@/utils/image';

import { CodeBlockLowlight } from '../extensions/code-block-lowlight/code-block-lowlight';
import { Color } from '../extensions/color';
import { FileHandler } from '../extensions/file-handler';
import { HorizontalRule } from '../extensions/horizontal-rule';
import { Image } from '../extensions/image';
import { ImageCleanup } from '../extensions/image/components/image-cleanup';
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

export interface MinimalTiptapEditorReturn {
  editor: Editor | null;
  getPendingImageDeletions: () => string[];
  processPendingDeletions: () => Promise<void>;
  clearPendingDeletions: () => void;
}

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
}: UseMinimalTiptapEditorProps): MinimalTiptapEditorReturn => {
  const throttledSetValue = useThrottle(
    (value: Content) => onUpdate?.(value),
    throttleDelay,
  );

  const trackedImagesRef = React.useRef(new Set<string>());
  const pendingDeletionsRef = React.useRef(new Set<string>());

  const imageManager = React.useMemo(() => {
    const manager = {
      getPendingDeletions: () => Array.from(pendingDeletionsRef.current),
      processPendingDeletions: async () => {
        console.log(
          'Processing pending deletions',
          pendingDeletionsRef.current,
        );
        const deletionPromises = Array.from(pendingDeletionsRef.current).map(
          async (src) => {
            try {
              await deleteFromCld(src);
              trackedImagesRef.current.delete(src);
              console.log('Successfully deleted image:', src);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          },
        );
        await Promise.all(deletionPromises);
        pendingDeletionsRef.current.clear();
      },
      clearPendingDeletions: () => {
        pendingDeletionsRef.current.clear();
      },
    };

    if (typeof window !== 'undefined') {
      console.log('Setting up global window functions');
      window.__processImageCleanup = manager.processPendingDeletions;
      window.__clearImageCleanup = manager.clearPendingDeletions;
    }

    return manager;
  }, []);

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

  const extensions = React.useMemo(() => {
    return [
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
          trackedImagesRef.current.add(src);
          pendingDeletionsRef.current.delete(src);
          return src;
        },
        onImageRemoved({ id, src }) {
          console.log('Image removed', { id, src });
          if (src && trackedImagesRef.current.has(src)) {
            pendingDeletionsRef.current.add(src);
            console.log('Image marked for deletion:', src);
            console.log(
              'Current pending deletions:',
              pendingDeletionsRef.current,
            );
          }
        },
        onImageRestored: async ({ id, src }) => {
          console.log('Image restored', { id, src });

          if (pendingDeletionsRef.current.has(src)) {
            pendingDeletionsRef.current.delete(src);
            console.log('Image unmarked for deletion:', src);
            return;
          }

          if (!trackedImagesRef.current.has(src)) {
            try {
              const response = await fetch(src, { method: 'HEAD' });
              if (!response.ok) {
                console.warn('Restored image URL is broken:', src);
                toast.warning('Image Restored but Broken', {
                  position: 'bottom-right',
                  description:
                    'The restored image is no longer available. Please re-upload it.',
                });
              }
            } catch (error) {
              console.warn(
                'Failed to validate restored image URL:',
                src,
                error,
              );
              toast.warning('Image Validation Failed', {
                position: 'bottom-right',
                description:
                  'Unable to verify if the restored image is still available.',
              });
            }
          }
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
            trackedImagesRef.current.add(src);
            pendingDeletionsRef.current.delete(src);
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
            trackedImagesRef.current.add(src);
            pendingDeletionsRef.current.delete(src);
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
      ImageCleanup.configure({
        onCleanup: (src) => {
          if (trackedImagesRef.current.has(src)) {
            pendingDeletionsRef.current.add(src);
            console.log('Image marked for cleanup deletion:', src);
          }
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
  }, [placeholder, imageSetting.folderName, imageSetting.type]);

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        autocomplete: 'off',
        autocorrect: 'off',
        autocapitalize: 'off',
        class: cn('focus:outline-hidden', editorClassName),
      },
    },
    onUpdate: ({ editor }) => handleUpdate(editor),
    onCreate: ({ editor }) => handleCreate(editor),
    onBlur: ({ editor }) => handleBlur(editor),
    ...props,
  });

  return {
    editor,
    getPendingImageDeletions: imageManager.getPendingDeletions,
    processPendingDeletions: imageManager.processPendingDeletions,
    clearPendingDeletions: imageManager.clearPendingDeletions,
  };
};
