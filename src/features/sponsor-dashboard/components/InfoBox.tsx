import { Box, Text } from '@chakra-ui/react';
import parse, { type HTMLReactParserOptions } from 'html-react-parser';

import { LinkTextParser } from '@/components/shared/LinkTextParser';

const options: HTMLReactParserOptions = {
  replace: ({ name, children, attribs }: any) => {
    if (name === 'p' && (!children || children.length === 0)) {
      return <br />;
    }
    return { name, children, attribs };
  },
};

export const InfoBox = ({
  label,
  content,
  isHtml = false,
}: {
  label: string;
  content?: string | null;
  isHtml?: boolean;
}) => (
  <Box mb={4}>
    <Text
      mb={1}
      color="brand.slate.400"
      fontSize="xs"
      fontWeight={600}
      textTransform={'uppercase'}
    >
      {label}
    </Text>
    {isHtml ? (
      <Box overflow={'visible'} w={'full'} h={'full'} id="reset-des">
        {parse(content || '', options)}
      </Box>
    ) : (
      <LinkTextParser text={content || ''} />
    )}
  </Box>
);
