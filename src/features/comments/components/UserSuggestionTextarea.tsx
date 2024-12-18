import React, {
  type ChangeEvent,
  type Dispatch,
  type SetStateAction,
  useEffect,
  useRef,
  useState,
} from 'react';
import TextareaAutosize, {
  type TextareaAutosizeProps,
} from 'react-textarea-autosize';
import getCaretCoordinates from 'textarea-caret';

import { type User } from '@/interface/user';
import { cn } from '@/utils/cn';

import {
  addMention,
  Suggestions,
  userSuggestionOverrider,
} from './Suggestions';

const MAX_LENGTH = 280;

interface Props extends TextareaAutosizeProps {
  value: string;
  setValue: Dispatch<SetStateAction<string>>;
  defaultSuggestions: Map<string, User>;
  autoFocusOn?: boolean;
  variant?: 'default' | 'flushed';
}

export const UserSuggestionTextarea = ({
  value,
  setValue,
  defaultSuggestions,
  autoFocusOn,
  variant = 'default',
  className,
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
    <div className="relative w-full">
      <div className="relative w-full">
        <TextareaAutosize
          ref={inputRef}
          className={cn(
            'w-full resize-none overflow-hidden text-sm md:text-base',
            'min-h-8 placeholder:text-slate-400',
            'focus:outline-none focus:ring-0',
            variant === 'flushed'
              ? [
                  'border-x-0 border-b-2 border-t-0 border-slate-200',
                  'rounded-none px-0 py-0',
                  'focus:border-brand-purple',
                ]
              : [
                  'rounded-md border border-slate-200',
                  'focus:border-brand-purple focus:ring-brand-purple',
                ],
            className,
          )}
          maxLength={MAX_LENGTH}
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
      </div>
      {value?.length > 0 && (
        <p className="pr-1 pt-1 text-right text-xs text-slate-400">
          {MAX_LENGTH - value.length} characters left
        </p>
      )}
      {showSuggestions && (
        <div
          className="absolute z-[100]"
          style={{
            top: suggestionPosition.top,
            left: suggestionPosition.left,
          }}
        >
          <Suggestions
            onSelect={selectSuggestion}
            input={value}
            defaultSuggestions={defaultSuggestions}
          />
        </div>
      )}
    </div>
  );
};
