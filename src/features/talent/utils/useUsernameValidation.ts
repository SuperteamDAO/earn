import debounce from 'lodash.debounce';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { api } from '@/lib/api';
import logger from '@/lib/logger';
import { useUser } from '@/store/user';

import { USERNAME_PATTERN } from '../constants';

export const useUsernameValidation = (initialValue = '') => {
  const [username, setUsername] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const [validating, setValidating] = useState(false);

  const { user } = useUser();

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
        const response = await api.get(
          `/api/user/username?username=${usernameToCheck}`,
        );
        const available = response.data.available;
        setIsInvalid(!available);
        setValidationErrorMessage(
          available ? '' : 'Username is unavailable! Please try another one.',
        );
        setValidating(false);
      } catch (error) {
        logger.error(error);
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
      setIsInvalid(false);
      setValidationErrorMessage('');
      return;
    }
    if (username) {
      debouncedCheckUsername(username);
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
