'use client';

import debounce from 'lodash.debounce';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { Button } from '@/components/ui/button';
import { getJson } from '@/lib/fetch-json';
import { cn } from '@/utils/cn';

import { EarnAvatar } from '@/features/talent/components/EarnAvatar';

import type { MentionUser } from '../types';

interface Props {
  defaultSuggestions: Map<string, MentionUser>;
  input: string;
  onSelect: (tag: string) => void;
}

const MAX_COMMENT_SUGGESTIONS = 5;

export const Suggestions = ({ defaultSuggestions, input, onSelect }: Props) => {
  const [suggestions, setSuggestions] =
    useState<Map<string, MentionUser>>(defaultSuggestions);
  // Everyone seen so far, the defaults and search results alike.
  const [searchSuggestions] = useState(
    () => new Map<string, MentionUser>(defaultSuggestions),
  );
  const shown = useRef(defaultSuggestions.size);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  useEffect(() => {
    let live = true;
    const show = (next: Map<string, MentionUser>) => {
      if (!live) return;
      shown.current = next.size;
      setSuggestions(next);
    };
    const filterSuggestions = async (text: string) => {
      if (text === '') {
        show(new Map(searchSuggestions));
        return;
      }
      if (shown.current < MAX_COMMENT_SUGGESTIONS) {
        const params = new URLSearchParams({
          query: text,
          take: String(MAX_COMMENT_SUGGESTIONS - shown.current),
        });
        const { users = [] } = await getJson<{ users?: MentionUser[] }>(
          `/api/user/search/?${params.toString()}`,
        ).catch(() => ({ users: [] }));
        users.forEach((user) => {
          if (user.id) searchSuggestions.set(user.id, user);
        });
      }
      const filteredSuggestions = new Map<string, MentionUser>();
      const lower = text.toLowerCase();
      searchSuggestions.forEach((value, key) => {
        if (
          value.username?.toLowerCase().includes(lower) ||
          value.firstName?.toLowerCase().includes(lower) ||
          value.lastName?.toLowerCase().includes(lower)
        ) {
          filteredSuggestions.set(key, value);
        }
      });
      show(filteredSuggestions);
    };
    const debouncedFilterSuggestions = debounce(() => {
      void filterSuggestions(getLastWord(input));
    }, 300);
    debouncedFilterSuggestions();
    return () => {
      live = false;
      debouncedFilterSuggestions.cancel();
    };
  }, [input, searchSuggestions]);

  useEffect(() => {
    const handleKeyPress = (event: globalThis.KeyboardEvent) => {
      switch (event.key) {
        case 'Enter':
          onSelect([...suggestions.values()][activeIndex]?.username ?? '');
          break;
        case 'ArrowUp':
          if (activeIndex === 0) {
            setActiveIndex(suggestions.size - 1);
          } else {
            setActiveIndex(activeIndex - 1);
          }
          break;
        case 'Tab':
        case 'ArrowDown':
          if (activeIndex === suggestions.size - 1) {
            setActiveIndex(0);
          } else {
            setActiveIndex(activeIndex + 1);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => {
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [activeIndex, suggestions, onSelect]);

  if (suggestions.size === 0) return null;

  return (
    <div className="flex w-[15rem] flex-col items-start gap-2 rounded-lg border border-slate-300 bg-white p-1">
      {[...suggestions.values()]
        .slice(0, MAX_COMMENT_SUGGESTIONS)
        .map((suggestion, index) => (
          <Button
            key={suggestion.id}
            variant="ghost"
            className={cn(
              'flex w-full justify-start gap-2 p-1',
              activeIndex === index ? 'bg-slate-100' : 'bg-transparent',
              'hover:bg-slate-200 active:bg-slate-100',
            )}
            onClick={() => onSelect(suggestion.username ?? '')}
          >
            <EarnAvatar
              className="h-7 w-7"
              id={suggestion?.id}
              avatar={suggestion?.photo ?? undefined}
            />
            <div className="flex flex-col items-start">
              <p className="text-sm font-medium text-slate-900">
                {suggestion.firstName} {suggestion.lastName}
              </p>
              <p className="max-w-[10rem] overflow-hidden text-xs font-medium text-ellipsis text-slate-500">
                @{suggestion.username}
              </p>
            </div>
          </Button>
        ))}
    </div>
  );
};

function getLastWord(str: string): string {
  const lastAtIndex = str.lastIndexOf('@');
  return str.slice(lastAtIndex + 1);
}

function replaceLastAtWord(str: string, replacement: string): string {
  const lastAtIndex = str.lastIndexOf('@');
  const removeLastWord = str.slice(0, lastAtIndex);
  return `${removeLastWord}${replacement}`;
}

export function addMention(str: string, username: string): string {
  return replaceLastAtWord(str, `@${username} `);
}

export function userSuggestionOverrider(
  event: KeyboardEvent<HTMLTextAreaElement>,
  lastInput: string,
  hideSuggestions: () => void,
) {
  switch (event.key) {
    case 'Enter':
      event.preventDefault();
      break;
    case 'ArrowUp':
      event.preventDefault();
      break;
    case 'ArrowDown':
      event.preventDefault();
      break;
    case 'ArrowLeft':
      event.preventDefault();
      break;
    case 'ArrowRight':
      event.preventDefault();
      break;
    case 'Tab':
      event.preventDefault();
      break;
    case 'Escape':
      hideSuggestions();
      break;
    case 'Backspace':
      if (lastInput[lastInput.length - 1] === '@') {
        hideSuggestions();
      }
      break;
    case ' ':
      hideSuggestions();
      break;
    default:
      break;
  }
}
