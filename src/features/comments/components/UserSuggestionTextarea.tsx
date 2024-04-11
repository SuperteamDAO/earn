import { Box, Text, Textarea, type TextareaProps } from '@chakra-ui/react';
import React, {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import ResizeTextarea from 'react-textarea-autosize';
import getCaretCoordinates from 'textarea-caret';

import { type User } from '@/interface/user';

import {
  addMention,
  Suggestions,
  userSuggestionOverrider,
} from './Suggestions';

const MAX_LENGTH = 280;

interface Props extends TextareaProps {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  defaultSuggestions: Map<string, User>;
  autoFocusOn?: boolean;
}

export const UserSuggestionTextarea = ({
  value,
  setValue,
  defaultSuggestions,
  autoFocusOn,
  ...props
}: Props) => {
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionPosition, setSuggestionPosition] = useState({
    top: 0,
    left: 0,
  });

  const selectSuggestion = (tag: string) => {
    setValue((value) => addMention(value, tag));
    setShowSuggestions(false);
  };

  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const input = event.target.value;
    setValue(input);
    if (inputRef.current) {
      if (!showSuggestions) {
        const caret = getCaretCoordinates(
          inputRef.current,
          inputRef.current.selectionStart,
        );
        setSuggestionPosition({ top: caret.top + 20, left: caret.left });
      }
    }
    if (input[input.length - 1] === '@') {
      setShowSuggestions(true);
    }
  };

  useEffect(() => {
    setTimeout(() => {
      if (autoFocusOn) inputRef?.current?.focus();
    }, 0);
  }, [autoFocusOn]);

  return (
    <Box pos={'relative'} w="full">
      <Box pos={'relative'} w="full">
        <Textarea
          ref={inputRef}
          as={ResizeTextarea}
          overflow="hidden"
          w="100%"
          minH="unset"
          resize="none"
          maxLength={280}
          minRows={1}
          onChange={handleInput}
          onKeyDown={(e) => {
            if (showSuggestions) {
              userSuggestionOverrider(e, value, () =>
                setShowSuggestions(false),
              );
            }
          }}
          value={value}
          {...props}
        />
      </Box>
      {value?.length > 0 && (
        <Text
          pt={1}
          pr={1}
          color="brand.slate.400"
          fontSize={'xs'}
          textAlign={'right'}
        >
          {MAX_LENGTH - value.length} characters left
        </Text>
      )}
      {showSuggestions && (
        <Box
          pos={'absolute'}
          zIndex={100}
          top={suggestionPosition.top}
          left={suggestionPosition.left}
        >
          <Suggestions
            onSelect={selectSuggestion}
            input={value}
            defaultSuggestions={defaultSuggestions}
          />
        </Box>
      )}
    </Box>
  );
};
