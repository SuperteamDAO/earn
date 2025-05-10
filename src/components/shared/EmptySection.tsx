import { type ReactNode } from 'react';
import { AiOutlineInfoCircle } from 'react-icons/ai';

export function EmptySection({
  title,
  message,
}: {
  title?: string;
  message?: ReactNode;
  showNotifSub?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="mt-4 flex flex-col items-center justify-center gap-1 sm:gap-2">
        <AiOutlineInfoCircle className="size-8 text-slate-400 md:size-12" />
        <span className="text-lg font-bold text-slate-400">
          {title || 'Sorry! Nothing found'}
        </span>
        <span className="text-center text-slate-300">
          {message || 'Something went wrong! Please try again!'}
        </span>
      </div>
    </div>
  );
}
