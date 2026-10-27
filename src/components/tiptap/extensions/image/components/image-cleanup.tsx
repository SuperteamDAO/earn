import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Extension } from '@tiptap/react';

// The subset of ProseMirror's Node#toJSON() output this plugin walks.
interface JSONNode {
  type?: string;
  attrs?: { src?: unknown };
  content?: JSONNode[];
}

interface ImageCleanupOptions {
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
    let prevContent: JSONNode | null = null;

    const extractImages = (
      content: JSONNode | undefined,
      images: Set<string>,
    ) => {
      if (!content) return;

      const src = content.attrs?.src;
      if (content.type === 'image' && typeof src === 'string' && src) {
        images.add(src);
      }

      if (content.content) {
        content.content.forEach((node) => {
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
