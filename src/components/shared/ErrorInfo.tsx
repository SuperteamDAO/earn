import { AiOutlineWarning } from 'react-icons/ai';

export function ErrorInfo({
  title,
  message,
}: {
  title?: string;
  message?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <AiOutlineWarning size={52} className="text-slate-500" />
      <span className="font-bold text-slate-500">
        {title || 'Something went wrong!'}
      </span>
      <span className="text-sm text-slate-500">
        {message ||
          'There seems to be an error. Contact support@superteamearn.com to get help'}
      </span>
    </div>
  );
}
