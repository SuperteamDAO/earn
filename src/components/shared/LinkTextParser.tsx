import { Box, Link } from '@chakra-ui/react';
import { Fragment } from 'react';

const URL_REGEX =
  /(\bhttps?:\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

interface Props {
  text: string;
}

export function LinkTextParser({ text }: Props) {
  const parts = text.split(URL_REGEX);

  return (
    <Box>
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
    </Box>
  );
}
