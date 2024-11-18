import { AiOutlineWarning } from 'react-icons/ai';

export function ErrorSection({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex min-h-[92vh] w-full items-center justify-center">
      <div className="flex flex-col items-center justify-center">
        <AiOutlineWarning size={96} className="text-slate-500" />
        <span className="mt-2 text-lg font-bold text-slate-500">
          {title || 'Error Occurred!'}
        </span>
        <span className="mt-2 text-slate-500">
          {message || 'Something went wrong! Please try again!'}
        </span>
      </div>
    </div>
  );
}
