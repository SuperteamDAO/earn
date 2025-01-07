import debounce from 'lodash.debounce';
import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import logger from '@/lib/logger';
import { useUser } from '@/store/user';

import { USERNAME_PATTERN } from '../constants';

export const useUsernameValidation = (initialValue = '') => {
  const [username, setUsername] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

  const { user } = useUser();

  const checkUsernameAvailability = async (username: string) => {
    if (username === '') {
      setIsInvalid(true);
      setValidationErrorMessage('Username is required');
      return;
    }
    if (!USERNAME_PATTERN.test(username)) {
      setIsInvalid(true);
      setValidationErrorMessage(
        "Username can only contain lowercase letters, numbers, '_', and '-'",
      );
      return;
    }

    try {
      const response = await api.get(`/api/user/username?username=${username}`);
      const available = response.data.available;
      setIsInvalid(!available);
      setValidationErrorMessage(
        available ? '' : 'Username is unavailable! Please try another one.',
      );
    } catch (error) {
      logger.error(error);
      setIsInvalid(true);
      setValidationErrorMessage(
        'An error occurred while checking username availability.',
      );
    }
  };

  const debouncedCheckUsername = debounce(checkUsernameAvailability, 300);

  useEffect(() => {
    if (username && username === user?.username) {
      setIsInvalid(false);
      setValidationErrorMessage('');
      return;
    }
    if (username) {
      debouncedCheckUsername(username);
    }
  }, [username, user?.username]);

  return { setUsername, isInvalid, validationErrorMessage, username };
};
