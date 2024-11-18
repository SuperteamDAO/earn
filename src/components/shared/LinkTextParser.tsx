import { Fragment } from 'react';

const URL_REGEX =
  /(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

type Props = React.HTMLAttributes<HTMLParagraphElement> & {
  text: string;
};

export function LinkTextParser({ text, className, ...props }: Props) {
  const parts = text.split(URL_REGEX);

  return (
    <p className={className} {...props}>
      {parts.map((part, index) => {
        if (part.match(URL_REGEX)) {
          return (
            <a
              key={index}
              className="text-brand-purple hover:underline"
              href={part}
              target="_blank"
              rel="noopener noreferrer"
            >
              {part}
            </a>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </p>
  );
}
