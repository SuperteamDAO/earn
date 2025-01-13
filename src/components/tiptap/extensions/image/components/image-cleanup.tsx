import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/react';

export interface ImageCleanupOptions {
  onCleanup?: (src: string) => void;
}

export const ImageCleanup = Extension.create<ImageCleanupOptions>({
  name: 'imageCleanup',

  addOptions() {
    return {
      onCleanup: undefined,
    };
  },

  addProseMirrorPlugins() {
    const trackedImages = new Set<string>();
    let prevContent: any = null;

    const extractImages = (content: any, images: Set<string>) => {
      if (!content) return;

      if (content.type === 'image' && content.attrs?.src) {
        images.add(content.attrs.src);
      }

      if (content.content) {
        content.content.forEach((node: any) => {
          extractImages(node, images);
        });
      }
    };

    return [
      new Plugin({
        key: new PluginKey('imageCleanup'),

        view: () => ({
          update: (view) => {
            const newContent = view.state.doc.toJSON();

            if (prevContent) {
              const oldImages = new Set<string>();
              const newImages = new Set<string>();

              extractImages(prevContent, oldImages);
              extractImages(newContent, newImages);

              for (const src of oldImages) {
                if (!newImages.has(src) && trackedImages.has(src)) {
                  trackedImages.delete(src);
                  this.options.onCleanup?.(src);
                }
              }
            }

            prevContent = newContent;
          },
        }),
      }),
    ];
  },
});
