'use client';

import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';

import { getJson } from '@/lib/fetch-json';
import logger from '@/lib/logger';
import { useViewer } from '@/lib/viewer';

const slugPattern = /^[a-z0-9_-]+$/;

interface Check {
  readonly isInvalid: boolean;
  readonly validationErrorMessage: string;
}

const VALID: Check = { isInvalid: false, validationErrorMessage: '' };

export const useSlugValidation = (initialValue = '') => {
  const [slug, setSlug] = useState(initialValue);
  const [check, setCheck] = useState<Check>(VALID);

  const user = useViewer();
  const currentSlug = user?.currentSponsor?.slug;

  const checkSlugAvailability = useMemo(
    () =>
      debounce(async (value: string) => {
        if (!slugPattern.test(value)) {
          setCheck({
            isInvalid: true,
            validationErrorMessage:
              "Slug can only contain lowercase letters, numbers, '_', and '-'",
          });
          return;
        }

        try {
          const response = await getJson<{ available: boolean }>(
            `/api/sponsors/check-slug/?slug=${encodeURIComponent(value)}`,
          );
          const available = response.available;
          setCheck({
            isInvalid: !available,
            validationErrorMessage: available
              ? ''
              : 'Company username already exists',
          });
        } catch (error) {
          logger.error(error);
          setCheck({
            isInvalid: true,
            validationErrorMessage:
              'An error occurred while checking slug availability.',
          });
        }
      }, 300),
    [],
  );

  // Their own sponsor's slug is always theirs to keep.
  const isOwn = !!slug && slug === currentSlug;

  useEffect(() => {
    if (slug && !isOwn) void checkSlugAvailability(slug);
    return () => checkSlugAvailability.cancel();
  }, [slug, isOwn, checkSlugAvailability]);

  const { isInvalid, validationErrorMessage } = isOwn ? VALID : check;
  return { setSlug, isInvalid, validationErrorMessage, slug };
};
