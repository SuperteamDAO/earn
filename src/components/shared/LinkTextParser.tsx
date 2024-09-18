import { Link, Text, type TextProps } from '@chakra-ui/react';
import { Fragment } from 'react';

const URL_REGEX =
  /(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

type Props = TextProps & {
  text: string;
};

export function LinkTextParser({ text, ...props }: Props) {
  const parts = text.split(URL_REGEX);

  return (
    <Text {...props}>
      {parts.map((part, index) => {
        if (part.match(URL_REGEX)) {
          return (
            <Link
              key={index}
              color="brand.purple"
              _hover={{ textDecoration: 'underline' }}
              href={part}
              isExternal
            >
              {part}
            </Link>
          );
        }
        return <Fragment key={index}>{part}</Fragment>;
      })}
    </Text>
  );
}
