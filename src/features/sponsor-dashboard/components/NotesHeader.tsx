import { Loader2 } from 'lucide-react';

import { Wand } from '@/svg/wand';
import { cn } from '@/utils/cn';

interface NotesHeaderProps {
  isAiCommited: boolean | undefined;
  isSaving: boolean;
}

export const NotesHeader = ({ isAiCommited, isSaving }: NotesHeaderProps) => (
  <div
    className={cn(
      'mb-2 flex w-full items-center justify-between pr-3 text-slate-400',
      isAiCommited && 'text-slate-600',
    )}
  >
    <div className="flex items-center gap-1">
      {isAiCommited && <Wand />}
      <span className="font-extrabold">Notes</span>
    </div>
    {isSaving ? (
      <Loader2 className="h-3 w-3 animate-spin" />
    ) : (
      <span className="text-[10px]">Auto-saved</span>
    )}
  </div>
);
