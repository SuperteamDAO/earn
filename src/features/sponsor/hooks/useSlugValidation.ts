import axios from 'axios';
import debounce from 'lodash.debounce';
import { useEffect, useState } from 'react';

import logger from '@/lib/logger';
import { useUser } from '@/store/user';

export const useSlugValidation = (initialValue = '') => {
  const [slug, setSlug] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

  const { user } = useUser();

  const slugPattern = /^[a-z0-9_-]+$/;

  const checkSlugAvailability = async (slug: string) => {
    if (!slugPattern.test(slug)) {
      setIsInvalid(true);
      setValidationErrorMessage(
        "Slug can only contain lowercase letters, numbers, '_', and '-'",
      );
      return;
    }

    try {
      const response = await axios.get(`/api/sponsors/check-slug?slug=${slug}`);
      const available = response.data.available;
      setIsInvalid(!available);
      setValidationErrorMessage(
        available ? '' : 'Company username already exists',
      );
    } catch (error) {
      logger.error(error);
      setIsInvalid(true);
      setValidationErrorMessage(
        'An error occurred while checking slug availability.',
      );
    }
  };

  const debouncedCheckSlug = debounce(checkSlugAvailability, 300);

  useEffect(() => {
    if (slug && slug === user?.currentSponsor?.slug) {
      setIsInvalid(false);
      setValidationErrorMessage('');
      return;
    }
    if (slug) {
      debouncedCheckSlug(slug);
    }
  }, [slug, user?.currentSponsor?.slug]);

  return { setSlug, isInvalid, validationErrorMessage, slug };
};
