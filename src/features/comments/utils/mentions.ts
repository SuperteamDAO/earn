import { type KeyboardEvent } from 'react';

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
