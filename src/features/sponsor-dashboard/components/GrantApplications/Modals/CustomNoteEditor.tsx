import { Eye } from 'lucide-react';
import { useState } from 'react';

import { RichEditor } from '@/components/shared/RichEditor';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import {
  CUSTOM_EMAIL_MAX_CHARS,
  getCustomEmailPlainText,
} from '../../../utils/customEmailSanitizer';

interface CustomNoteEditorProps {
  id: string;
  value: string;
  previewHtml: string;
  error: string | null;
  onChange: (value: string) => void;
}

export const CustomNoteEditor = ({
  id,
  value,
  previewHtml,
  error,
  onChange,
}: CustomNoteEditorProps) => {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const emailCharCount = getCustomEmailPlainText(previewHtml).length;

  return (
    <div className="mb-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <div>
          <p className="font-medium text-slate-600">Custom Note</p>
          <p className="text-xs text-slate-400">
            Email preview: {emailCharCount.toLocaleString()} /{' '}
            {CUSTOM_EMAIL_MAX_CHARS.toLocaleString()} characters
          </p>
        </div>
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              className="h-auto px-2 py-1 text-xs font-semibold text-slate-500"
            >
              <Eye className="size-3.5" />
              Preview
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[86vh] max-w-2xl gap-0 overflow-hidden p-0">
            <div className="border-b border-slate-200 px-5 py-4">
              <DialogTitle className="text-base font-semibold text-slate-700">
                Email Preview
              </DialogTitle>
              <p className="mt-1 text-xs text-slate-400">
                {emailCharCount.toLocaleString()} /{' '}
                {CUSTOM_EMAIL_MAX_CHARS.toLocaleString()} characters
              </p>
            </div>
            <div className="max-h-[70vh] overflow-y-auto bg-slate-50 px-4 py-5">
              <div className="mx-auto rounded-md border border-slate-200 bg-white px-5 py-4 shadow-sm">
                <div
                  className="prose prose-sm max-w-none text-slate-600"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <RichEditor
        id={id}
        height="h-[160px]"
        value={value}
        onChange={onChange}
        error={!!error}
        placeholder="Add a note from the grant reviewer"
      />
      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </div>
  );
};
