import { AiOutlineInfoCircle } from 'react-icons/ai';

export function EmptySection({
  title,
  message,
  showNotifSub = true,
}: {
  title?: string;
  message?: string;
  showNotifSub?: boolean;
}) {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <AiOutlineInfoCircle size={52} className="text-slate-400" />
        <span className="mt-2 text-lg font-bold text-slate-400">
          {title || 'Sorry! Nothing found'}
        </span>
        {showNotifSub && (
          <span className="mt-2 text-slate-300">
            {message || 'Something went wrong! Please try again!'}
          </span>
        )}
      </div>
    </div>
  );
}
