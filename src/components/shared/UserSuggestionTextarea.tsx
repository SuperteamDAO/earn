import {
  Box,
  Button,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Textarea,
  type TextareaProps,
} from '@chakra-ui/react';
import EmojiPicker from 'emoji-picker-react';
import React, {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
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

interface Props extends TextareaProps {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  defaultSuggestions: Map<string, User>;
}

export const UserSuggestionTextarea = ({
  value,
  setValue,
  defaultSuggestions,
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
    console.log('input', input);
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
  return (
    <Box pos={'relative'} w="full">
      <Textarea
        ref={inputRef}
        as={ResizeTextarea}
        overflow="hidden"
        w="100%"
        minH="unset"
        resize="none"
        minRows={1}
        onChange={handleInput}
        onKeyDown={(e) => {
          if (showSuggestions) {
            userSuggestionOverrider(e, value, () => setShowSuggestions(false));
          }
        }}
        value={value}
        {...props}
      />
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
      <Popover>
        <PopoverTrigger>
          <Button
            pos={'absolute'}
            right={2}
            bottom={0}
            w={8}
            minW={8}
            h={8}
            p={0}
            rounded={'full'}
            tabIndex={-1}
            variant="ghost"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M18 13a6 6 0 0 1-6 5 6 6 0 0 1-6-5h12Z" />
              <line x1="9" x2="9.01" y1="9" y2="9" />
              <line x1="15" x2="15.01" y1="9" y2="9" />
            </svg>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <EmojiPicker
            onEmojiClick={(emoji) => setValue((s) => s + emoji.emoji)}
          />
        </PopoverContent>
      </Popover>
    </Box>
  );
};
