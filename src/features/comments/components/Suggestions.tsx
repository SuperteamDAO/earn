import { Button, Text, VStack } from '@chakra-ui/react';
import axios from 'axios';
import debounce from 'lodash.debounce';
import { type KeyboardEvent, useEffect, useState } from 'react';

import { EarnAvatar } from '@/components/shared/EarnAvatar';
import { MAX_COMMENT_SUGGESTIONS } from '@/constants';
import { type User } from '@/interface/user';

interface Props {
  defaultSuggestions: Map<string, User>;
  input: string;
  onSelect: (tag: string) => void;
}

export const Suggestions = ({ defaultSuggestions, input, onSelect }: Props) => {
  const [suggestions, setSuggestions] =
    useState<Map<string, User>>(defaultSuggestions);
  const [searchSuggestions, setSearchSuggestions] =
    useState<Map<string, User>>(defaultSuggestions);
  const [activeIndex, setActiveIndex] = useState<number>(0);

  async function filterSuggestions(text: string) {
    if (text === '') {
      setSuggestions(searchSuggestions);
    } else {
      if (suggestions.size < MAX_COMMENT_SUGGESTIONS) {
        const searchResp = await axios.get('/api/user/search', {
          params: {
            query: text,
            take: MAX_COMMENT_SUGGESTIONS - suggestions.size,
          },
        });
        const users = searchResp.data.users as User[];
        users.forEach((user) => {
          if (user.id) searchSuggestions.set(user.id, user);
        });
        setSearchSuggestions(searchSuggestions);
      }
      const filteredSuggestions = new Map<string, User>();
      searchSuggestions.forEach((value, key) => {
        if (
          value.username?.toLowerCase().includes(text.toLowerCase()) ||
          value.firstName?.toLowerCase().includes(text.toLowerCase()) ||
          value.lastName?.toLowerCase().includes(text.toLowerCase())
        ) {
          filteredSuggestions.set(key, value);
        }
      });
      setSuggestions(filteredSuggestions);
    }
  }

  useEffect(() => {
    const debouncedFilterSuggestions = debounce(() => {
      filterSuggestions(getLastWord(input));
    }, 300);
    debouncedFilterSuggestions();
    return () => {
      debouncedFilterSuggestions.cancel();
    };
  }, [input]);

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
  }, [activeIndex, suggestions]);

  if (suggestions.size === 0) return null;

  return (
    <VStack
      align="start"
      w="15rem"
      p={1}
      bg="white"
      border="1px"
      borderColor="brand.slate.300"
      rounded="lg"
    >
      {[...suggestions.values()]
        .slice(0, MAX_COMMENT_SUGGESTIONS)
        .map((suggestion, index) => (
          <Button
            key={suggestion.id}
            justifyContent="start"
            gap={2}
            display="flex"
            w="full"
            p={1}
            bg={activeIndex === index ? 'brand.slate.100' : 'transparent'}
            _hover={{ bg: 'brand.slate.200' }}
            _active={{ bg: 'brand.slate.100' }}
            onClick={() => onSelect(suggestion.username ?? '')}
            variant="ghost"
          >
            <EarnAvatar
              size={'28px'}
              id={suggestion?.id}
              avatar={suggestion?.photo}
            />
            <VStack align="start" gap={0}>
              <Text color="brand.slate.900" fontSize="small" fontWeight={500}>
                {suggestion.firstName} {suggestion.lastName}
              </Text>
              <Text
                overflow="hidden"
                maxW="10rem"
                color="brand.slate.500"
                fontSize="x-small"
                fontWeight={500}
                textOverflow="ellipsis"
              >
                @{suggestion.username}
              </Text>
            </VStack>
          </Button>
        ))}
    </VStack>
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
