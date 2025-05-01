import { AiOutlineWarning } from 'react-icons/ai';

import { HELP_URL } from '@/constants/project';

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
          `There seems to be an error. <a href="${HELP_URL}" target="_blank">Contact us</a> to get help`}
      </span>
    </div>
  );
}
