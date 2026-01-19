/* eslint-disable react-hooks/immutability */
import { TextStyle } from '@tiptap/extension-text-style';
import { Typography } from '@tiptap/extension-typography';
import { Placeholder } from '@tiptap/extensions';
import {
  type Content,
  type Editor,
  useEditor,
  type UseEditorOptions,
} from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import * as React from 'react';
import { toast } from 'sonner';

import { api } from '@/lib/api';
import {
  compressImage,
  detectFormat,
  extractPublicIdFromUrl,
  type ImageSource,
  type SignedUploadParams,
  UPLOAD_CONFIGS,
  validateImageBuffer,
} from '@/lib/image-upload/client';
import { cn } from '@/utils/cn';

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

declare global {
  interface Window {
    __processImageCleanup?: () => Promise<void>;
    __clearImageCleanup?: () => void;
    __processOrphanedImageCleanup?: (
      originalDescription: string,
    ) => Promise<void>;
  }
}

interface ImageSetting {
  source: ImageSource;
}

async function uploadImageToCloudinary(
  file: File,
  source: ImageSource,
): Promise<string> {
  const config = UPLOAD_CONFIGS[source];

  const buffer = await file.arrayBuffer();
  const validation = validateImageBuffer(buffer, file.type);

  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image');
  }

  let processedFile: File;
  try {
    processedFile = await compressImage(file, {
      maxWidth: config.maxWidth,
      maxHeight: config.maxHeight,
      quality: config.quality / 100,
      format: 'image/webp',
    });
  } catch {
    processedFile = file;
  }

  const processedBuffer = await processedFile.arrayBuffer();
  const detectedFormat = detectFormat(processedBuffer);

  if (!detectedFormat) {
    throw new Error('Failed to detect format after compression');
  }

  const mimeType = `image/${detectedFormat}` as
    | 'image/jpeg'
    | 'image/png'
    | 'image/webp';

  const signResponse = await api.post<SignedUploadParams>('/api/image/sign', {
    source,
    contentType: mimeType,
    contentLength: processedFile.size,
  });

  const signedParams = signResponse.data;

  const formData = new FormData();
  formData.append('file', processedFile);
  formData.append('signature', signedParams.signature);
  formData.append('timestamp', signedParams.timestamp.toString());
  formData.append('folder', signedParams.folder);
  formData.append('api_key', signedParams.apiKey);

  if (signedParams.publicId) {
    formData.append('public_id', signedParams.publicId);
  }

  if (signedParams.eager) {
    formData.append('eager', signedParams.eager);
  }

  const uploadUrl = `https://api.cloudinary.com/v1_1/${signedParams.cloudName}/image/upload`;

  const uploadResponse = await fetch(uploadUrl, {
    method: 'POST',
    body: formData,
  });

  if (!uploadResponse.ok) {
    const errorData = await uploadResponse.json();
    throw new Error(errorData.error?.message || 'Upload failed');
  }

  const result = await uploadResponse.json();

  return result.secure_url;
}

async function deleteImageFromCloudinary(
  imageUrl: string,
  source: ImageSource,
): Promise<void> {
  const publicId = extractPublicIdFromUrl(imageUrl);
  if (!publicId) return;

  try {
    await api.delete('/api/image/delete', {
      data: { publicId, source },
    });
  } catch (err) {
    console.warn('Failed to delete image:', err);
  }
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
  processOrphanedImageCleanup: (originalDescription: string) => Promise<void>;
}

const extractImageUrls = (htmlContent: string): Set<string> => {
  const urls = new Set<string>();
  const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imgRegex.exec(htmlContent)) !== null) {
    const src = match[1];
    if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
      urls.add(src);
    }
  }

  return urls;
};

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
        const pendingCount = pendingDeletionsRef.current.size;
        console.log(
          `Processing pending deletions: ${pendingCount} images`,
          Array.from(pendingDeletionsRef.current),
        );

        if (pendingCount === 0) {
          console.log('No images to delete');
          return;
        }

        const deletionPromises = Array.from(pendingDeletionsRef.current).map(
          async (src) => {
            try {
              await deleteImageFromCloudinary(src, imageSetting.source);
              trackedImagesRef.current.delete(src);
              console.log('Successfully deleted image:', src);
            } catch (error) {
              console.error('Error deleting image:', error);
            }
          },
        );
        await Promise.all(deletionPromises);
        pendingDeletionsRef.current.clear();
        console.log('Cleanup completed');
      },
      clearPendingDeletions: () => {
        pendingDeletionsRef.current.clear();
      },
      processOrphanedImageCleanup: async (originalDescription: string) => {
        const originalImageUrls = extractImageUrls(originalDescription);
        const orphanedImages = Array.from(trackedImagesRef.current).filter(
          (src) => !originalImageUrls.has(src),
        );

        console.log(
          `Processing orphaned image cleanup: ${orphanedImages.length} images`,
          orphanedImages,
        );
        console.log('Original images:', Array.from(originalImageUrls));
        console.log('Tracked images:', Array.from(trackedImagesRef.current));

        if (orphanedImages.length === 0) {
          console.log('No orphaned images to delete');
          return;
        }

        const deletionPromises = orphanedImages.map(async (src) => {
          try {
            await deleteImageFromCloudinary(src, imageSetting.source);
            trackedImagesRef.current.delete(src);
            console.log('Successfully deleted orphaned image:', src);
          } catch (error) {
            console.error('Error deleting orphaned image:', error);
          }
        });

        await Promise.all(deletionPromises);
        console.log('Orphaned image cleanup completed');
      },
    };

    if (typeof window !== 'undefined') {
      console.log('Setting up global window functions');
      window.__processImageCleanup = manager.processPendingDeletions;
      window.__clearImageCleanup = manager.clearPendingDeletions;
      window.__processOrphanedImageCleanup =
        manager.processOrphanedImageCleanup;
    }

    return manager;
  }, [imageSetting.source]);

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
        link: false,
      }),
      Link,
      Image.configure({
        allowedMimeTypes: ['image/*'],
        maxFileSize: 5 * 1024 * 1024,
        allowBase64: true,
        uploadFn: async (file) => {
          const src = await uploadImageToCloudinary(file, imageSetting.source);
          trackedImagesRef.current.add(src);
          pendingDeletionsRef.current.delete(src);
          return src;
        },
        onImageRemoved({ id, src }) {
          console.log('Image removed', { id, src });
          console.log('Is tracked?', trackedImagesRef.current.has(src));
          console.log('Tracked images:', Array.from(trackedImagesRef.current));
          if (src && trackedImagesRef.current.has(src)) {
            pendingDeletionsRef.current.add(src);
            console.log('Image marked for deletion:', src);
            console.log(
              'Current pending deletions:',
              pendingDeletionsRef.current,
            );
          } else {
            console.log('Image not tracked, not adding to pending deletions');
          }
        },
        onImageRestored: async ({ id, src }) => {
          console.log('Image restored', { id, src });

          if (pendingDeletionsRef.current.has(src)) {
            pendingDeletionsRef.current.delete(src);
            console.log('Image unmarked for deletion:', src);
          }

          trackedImagesRef.current.add(src);
          console.log('Image re-added to tracking:', src);

          if (!src.includes('cloudinary.com')) {
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
            const src = await uploadImageToCloudinary(
              file,
              imageSetting.source,
            );
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
            const src = await uploadImageToCloudinary(
              file,
              imageSetting.source,
            );
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
  }, [placeholder, imageSetting.source]);

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
    immediatelyRender: false,
    ...props,
  });

  return {
    editor,
    getPendingImageDeletions: imageManager.getPendingDeletions,
    processPendingDeletions: imageManager.processPendingDeletions,
    clearPendingDeletions: imageManager.clearPendingDeletions,
    processOrphanedImageCleanup: imageManager.processOrphanedImageCleanup,
  };
};
