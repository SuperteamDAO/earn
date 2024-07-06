import axios from 'axios';
import debounce from 'lodash.debounce';
import { useEffect, useState } from 'react';

import logger from '@/lib/logger';
import { userStore } from '@/store/user';

export const useUsernameValidation = (initialValue = '') => {
  const [username, setUsername] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

  const { userInfo } = userStore();

  const usernamePattern = /^[a-z0-9_-]+$/;

  const checkUsernameAvailability = async (username: string) => {
    if (!usernamePattern.test(username)) {
      setIsInvalid(true);
      setValidationErrorMessage(
        "Username can only contain lowercase letters, numbers, '_', and '-'",
      );
      return;
    }

    try {
      const response = await axios.get(
        `/api/user/username?username=${username}`,
      );
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
    if (username && username === userInfo?.username) {
      setIsInvalid(false);
      setValidationErrorMessage('');
      return;
    }
    if (username) {
      debouncedCheckUsername(username);
    }
  }, [username, userInfo?.username]);

  return { setUsername, isInvalid, validationErrorMessage, username };
};
