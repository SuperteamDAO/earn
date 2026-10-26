'use client';

import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { getJson } from '@/lib/fetch-json';
import { useViewer } from '@/lib/viewer';

import { USERNAME_PATTERN } from '../constants';

export const useUsernameValidation = (initialValue = '') => {
  const [username, setUsername] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [validating, setValidating] = useState(false);

  const user = useViewer();

  const checkUsernameAvailability = useCallback(
    async (usernameToCheck: string) => {
      if (usernameToCheck === '') {
        setIsInvalid(true);
        setValidationErrorMessage('Username is required');
        return;
      }
      if (!USERNAME_PATTERN.test(usernameToCheck)) {
        setIsInvalid(true);
        setValidationErrorMessage(
          "Username can only contain letters, numbers, '_', and '-'",
        );
        return;
      }

      try {
        setValidating(true);
        const { available } = await getJson<{ available: boolean }>(
          `/api/user/username/?username=${encodeURIComponent(usernameToCheck)}`,
        );
        setIsInvalid(!available);
        setValidationErrorMessage(
          available ? '' : 'Username is unavailable! Please try another one.',
        );
        setValidating(false);
      } catch (error) {
        console.error(error);
        setIsInvalid(true);
        setValidationErrorMessage(
          'An error occurred while checking username availability.',
        );
        setValidating(false);
      }
    },
    [],
  );

  const debouncedCheckUsername = useMemo(
    () => debounce(checkUsernameAvailability, 300),
    [checkUsernameAvailability],
  );

  useEffect(() => {
    if (username && username.toLowerCase() === user?.username?.toLowerCase()) {
      // oxlint-disable-next-line react/set-state-in-effect -- kept as Earn runs it
      setIsInvalid(false);
      setValidationErrorMessage('');
      return undefined;
    }
    if (username) {
      void debouncedCheckUsername(username);
    }
    return () => {
      debouncedCheckUsername.cancel();
    };
  }, [username, user?.username, debouncedCheckUsername]);

  return {
    setUsername,
    isInvalid,
    validationErrorMessage,
    username,
    validating,
  };
};
