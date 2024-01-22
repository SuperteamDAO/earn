import type { TextareaProps } from '@chakra-ui/react';
import { Textarea } from '@chakra-ui/react';
import React from 'react';
import ResizeTextarea from 'react-textarea-autosize';

// eslint-disable-next-line react/display-name
export const AutoResizeTextarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>((props, ref) => (
  <Textarea
    ref={ref}
    as={ResizeTextarea}
    overflow="hidden"
    w="100%"
    minH="unset"
    resize="none"
    minRows={1}
    {...props}
  />
));
