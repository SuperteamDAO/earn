import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  LinkBox,
  type LinkBoxProps,
  LinkOverlay,
  Text,
} from '@chakra-ui/react';
import { type ReactNode } from 'react';

export const FeedCardLink = ({
  href,
  style,
  children,
}: {
  href: string | undefined;
  style?: LinkBoxProps;
  children: ReactNode;
}) => {
  return (
    <LinkBox
      alignItems={'center'}
      gap={2}
      whiteSpace={'nowrap'}
      {...style}
      display={{ base: 'none', md: 'flex' }}
      _hover={{
        textDecoration: 'underline',
        textDecorationColor: '#6366F1',
        textUnderlineOffset: 2,
      }}
    >
      <LinkOverlay href={href} rel="noopener noreferrer" target="_blank">
        <Text
          as="span"
          color={'#6366F1'}
          fontSize={{ base: 'sm', md: 'md' }}
          fontWeight={600}
        >
          {children}
        </Text>
      </LinkOverlay>
      <ArrowForwardIcon color={'#6366F1'} />
    </LinkBox>
  );
};
