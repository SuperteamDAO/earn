import { forwardRef, Textarea } from '@chakra-ui/react';
import React from 'react';
import ResizeTextarea from 'react-textarea-autosize';

export const AutoResizeTextarea = forwardRef((props, ref) => (
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
