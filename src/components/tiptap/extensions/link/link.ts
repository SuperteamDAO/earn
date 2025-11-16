import TiptapLink from '@tiptap/extension-link';
import { Plugin, TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { getMarkRange, mergeAttributes } from '@tiptap/react';

interface ExtensionWithParent<TValue> {
  readonly parent?: () => TValue;
}

type ParentLinkOptions = Record<string, unknown> & {
  readonly HTMLAttributes: Record<string, unknown>;
};

const getParent = <TValue>(
  extension: ExtensionWithParent<TValue>,
): TValue | undefined => {
  return extension.parent?.();
};

export const Link = TiptapLink.extend({
  /*
   * Determines whether typing next to a link automatically becomes part of the link.
   * In this case, we dont want any characters to be included as part of the link.
   */
  inclusive: false,

  /*
   * Match all <a> elements that have an href attribute, except for:
   * - <a> elements with a data-type attribute set to button
   * - <a> elements with an href attribute that contains 'javascript:'
   */
  parseHTML() {
    return [
      {
        tag: 'a[href]:not([data-type="button"]):not([href *= "javascript:" i])',
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      'a',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes),
      0,
    ];
  },

  addOptions() {
    const parentOptions =
      getParent<ParentLinkOptions>(
        this as unknown as ExtensionWithParent<ParentLinkOptions>,
      ) ?? (this.options as unknown as ParentLinkOptions);

    return {
      ...parentOptions,
      openOnClick: false,
      HTMLAttributes: {
        ...parentOptions.HTMLAttributes,
        class: 'link',
      },
    };
  },

  addProseMirrorPlugins() {
    const { editor } = this;
    const parentPlugins =
      getParent<Plugin[]>(this as unknown as ExtensionWithParent<Plugin[]>) ??
      [];

    return [
      ...parentPlugins,
      new Plugin({
        props: {
          handleKeyDown: (_: EditorView, event: KeyboardEvent) => {
            const { selection } = editor.state;

            /*
             * Handles the 'Escape' key press when there's a selection within the link.
             * This will move the cursor to the end of the link.
             */
            if (event.key === 'Escape' && selection.empty !== true) {
              editor.commands.focus(selection.to, { scrollIntoView: false });
            }

            return false;
          },
          handleClick(view: EditorView, pos: number): boolean {
            /*
             * Marks the entire link when the user clicks on it.
             */

            const { schema, doc, tr } = view.state;
            const range = schema.marks.link
              ? getMarkRange(doc.resolve(pos), schema.marks.link)
              : undefined;

            if (!range) {
              return false;
            }

            const { from, to } = range;
            const start = Math.min(from, to);
            const end = Math.max(from, to);

            if (pos < start || pos > end) {
              return false;
            }

            const $start = doc.resolve(start);
            const $end = doc.resolve(end);
            const transaction = tr.setSelection(
              new TextSelection($start, $end),
            );

            view.dispatch(transaction);
            return true;
          },
        },
      }),
    ];
  },
});
