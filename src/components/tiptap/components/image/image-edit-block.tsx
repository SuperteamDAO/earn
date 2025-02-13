import type { Editor } from '@tiptap/react';
import { Upload } from 'lucide-react';
import * as React from 'react';
import { useDropzone } from 'react-dropzone';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ImageEditBlockProps {
  editor: Editor;
  close: () => void;
}

export const ImageEditBlock: React.FC<ImageEditBlockProps> = ({
  editor,
  close,
}) => {
  const [link, setLink] = React.useState('');

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

  const onDrop = React.useCallback(
    async (acceptedFiles: File[]) => {
      if (!acceptedFiles.length) return;

      const insertImages = async () => {
        const contentBucket = acceptedFiles.map((file) => ({
          src: file,
        }));
        editor.commands.setImages(contentBucket);
      };

      await insertImages();
      close();
    },
    [editor, close],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'image/jpeg': [],
      'image/png': [],
      'image/webp': [],
      'image/jpg': [],
    },
    onDrop,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-1">
        <Label htmlFor="image-link">Attach an image link</Label>
        <div className="flex">
          <Input
            id="image-link"
            type="url"
            required
            placeholder="https://example.com"
            value={link}
            className="grow"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setLink(e.target.value)
            }
          />
          <Button type="submit" className="ml-2">
            Submit
          </Button>
        </div>
      </div>
      <span className="block w-full text-center text-slate-500 italic">OR</span>
      <div
        {...getRootProps()}
        className={`rounded-md border-2 border-dashed bg-slate-50 p-8 text-center transition-colors ${isDragActive ? 'border-primary bg-primary/5' : 'border-slate-200 hover:border-slate-300'} `}
      >
        <input {...getInputProps()} />
        <div className="mx-auto mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-slate-100">
          <Upload className="h-10 w-10 text-slate-500" />
        </div>
        <p className="text-lg font-medium">
          {isDragActive ? 'Drop images here' : 'Drag and drop your images here'}
        </p>
        <p className="mt-1 text-sm text-slate-500">Maximum file size: 5MB</p>
        <Button type="button" variant="outline" className="mt-6 px-8">
          Upload Files
        </Button>
      </div>
    </form>
  );
};
