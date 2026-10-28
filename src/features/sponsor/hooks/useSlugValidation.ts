import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import logger from '@/lib/logger';
import { useUser } from '@/store/user';

const slugPattern = /^[a-z0-9_-]+$/;

export const useSlugValidation = (initialValue = '') => {
  const [slug, setSlug] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

  const { user } = useUser();

  useEffect(() => {
    if (slug && slug === user?.currentSponsor?.slug) {
      setIsInvalid(false);
      setValidationErrorMessage('');
      return;
    }
    if (!slug) return;

    const checkSlugAvailability = async (slug: string) => {
      if (!slugPattern.test(slug)) {
        setIsInvalid(true);
        setValidationErrorMessage(
          "Slug can only contain lowercase letters, numbers, '_', and '-'",
        );
        return;
      }

      try {
        const response = await api.get(`/api/sponsors/check-slug?slug=${slug}`);
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

    const timer = setTimeout(() => checkSlugAvailability(slug), 300);
    return () => clearTimeout(timer);
  }, [slug, user?.currentSponsor?.slug]);

  return { setSlug, isInvalid, validationErrorMessage, slug };
};
