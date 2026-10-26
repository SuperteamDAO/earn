'use client';

import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';

import { getJson } from '@/lib/fetch-json';
import logger from '@/lib/logger';
import { useViewer } from '@/lib/viewer';

import { USERNAME_PATTERN } from '@/features/talent/constants';

interface Check {
  readonly isInvalid: boolean;
  readonly validationErrorMessage: string;
}

const VALID: Check = { isInvalid: false, validationErrorMessage: '' };

// The talent area's username check, for the sponsor form: Earn's
// /api/user/username, without the account store.
export const useUsernameValidation = (initialValue = '') => {
  const [username, setUsername] = useState(initialValue);
  const [check, setCheck] = useState<Check>(VALID);

  const user = useViewer();
  const currentUsername = user?.username?.toLowerCase();

  const checkUsernameAvailability = useMemo(
    () =>
      debounce(async (usernameToCheck: string) => {
        if (!USERNAME_PATTERN.test(usernameToCheck)) {
          setCheck({
            isInvalid: true,
            validationErrorMessage:
              "Username can only contain letters, numbers, '_', and '-'",
          });
          return;
        }

        try {
          const response = await getJson<{ available: boolean }>(
            `/api/user/username/?username=${encodeURIComponent(usernameToCheck)}`,
          );
          const available = response.available;
          setCheck({
            isInvalid: !available,
            validationErrorMessage: available
              ? ''
              : 'Username is unavailable! Please try another one.',
          });
        } catch (error) {
          logger.error(error);
          setCheck({
            isInvalid: true,
            validationErrorMessage:
              'An error occurred while checking username availability.',
          });
        }
      }, 300),
    [],
  );

  // Their own username is always theirs to keep.
  const isOwn = !!username && username.toLowerCase() === currentUsername;

  useEffect(() => {
    if (username && !isOwn) void checkUsernameAvailability(username);
    return () => checkUsernameAvailability.cancel();
  }, [username, isOwn, checkUsernameAvailability]);

  const { isInvalid, validationErrorMessage } = isOwn ? VALID : check;
  return { setUsername, isInvalid, validationErrorMessage, username };
};
