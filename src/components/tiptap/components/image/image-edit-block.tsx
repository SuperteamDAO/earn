import type { Editor } from '@tiptap/react';
import { Upload } from 'lucide-react';
import * as React from 'react';

import { Button } from '@/components/ui/button';

interface ImageEditBlockProps {
  editor: Editor;
  close: () => void;
}

export const ImageEditBlock: React.FC<ImageEditBlockProps> = ({
  editor,
  close,
}) => {
  const [link] = React.useState('');
  const [isDragActive, setIsDragActive] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (link) {
        editor.commands.setImages([{ src: link }]);
        close();
      }
    },
    [editor, link, close],
  );

  const insertFiles = React.useCallback(
    async (files: File[]) => {
      const acceptedFiles = files.filter((file) =>
        ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'].includes(
          file.type,
        ),
      );

      if (!acceptedFiles.length) {
        return;
      }

      editor.commands.setImages(
        acceptedFiles.map((file) => ({
          src: file,
        })),
      );
      close();
    },
    [editor, close],
  );

  const handleDragOver = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(true);
    },
    [],
  );

  const handleDragLeave = React.useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
    },
    [],
  );

  const handleDrop = React.useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragActive(false);
      await insertFiles(Array.from(event.dataTransfer.files));
    },
    [insertFiles],
  );

  const handleFileSelection = React.useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files ?? []);
      await insertFiles(files);
      event.target.value = '';
    },
    [insertFiles],
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div
        className={`rounded-md border-2 border-dashed bg-slate-50 p-8 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'} `}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          className="hidden"
          multiple
          onChange={handleFileSelection}
        />
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <Upload className="h-10 w-10 text-slate-500" />
        </div>
        <p className="text-lg font-medium">
          {isDragActive ? 'Drop images here' : 'Drag and drop your images here'}
        </p>
        <p className="mt-1 text-sm text-slate-500">Maximum file size: 5MB</p>
        <Button
          type="button"
          variant="outline"
          className="mt-6 px-8"
          onClick={() => inputRef.current?.click()}
        >
          Upload Files
        </Button>
      </div>
    </form>
  );
};
