import { cn } from '@/utils/cn';

import { emailRegex } from '@/features/social/utils/regex';

const URL_REGEX =
  /((?:(?:https?):\/\/)?(?:www\.)?(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}(?::\d{2,5})?(?:\/[a-zA-Z0-9\-._~:/?#[\]@!$&'()*+,;=%]*)?|(?:[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}))/gi;

type Props = React.HTMLAttributes<HTMLParagraphElement> & {
  text: string;
};

const addProtocolIfNeeded = (url: string): string => {
  // if it's an email, add mailto:
  if (emailRegex.test(url)) {
    return `mailto:${url}`;
  }

  // if it doesn't have http/https protocol, add https://
  if (!url.match(/^https?:\/\/|^mailto:/)) {
    return `https://${url}`;
  }

  return url;
};

const getDisplayText = (url: string): string => {
  // for email addresses, show as-is
  if (emailRegex.test(url)) {
    return url.replace('mailto:', '');
  }

  return url.replace(/^https?:\/\//, '');
};

export function LinkTextParser({ text, className, ...props }: Props) {
  const parts = text.split(URL_REGEX);

  return (
    <p
      className={cn('text-sm font-medium text-slate-500', className)}
      {...props}
    >
      {parts.map((part, index) => {
        if (part.match(URL_REGEX)) {
          const href = addProtocolIfNeeded(part);
          const displayText = getDisplayText(part);

          return (
            <a
              key={index}
              className="text-brand-purple hover:underline"
              href={href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {displayText}
            </a>
          );
        }
        return (
          <span key={index} className="">
            {part}
          </span>
        );
      })}
    </p>
  );
}
