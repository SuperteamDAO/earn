'use client';

import debounce from 'lodash.debounce';
import { useEffect, useMemo, useState } from 'react';

import { getJson } from '@/lib/fetch-json';
import logger from '@/lib/logger';
import { useViewer } from '@/lib/viewer';

interface Check {
  readonly isInvalid: boolean;
  readonly validationErrorMessage: string;
}

const VALID: Check = { isInvalid: false, validationErrorMessage: '' };

export const useSponsorNameValidation = (initialValue = '') => {
  const [sponsorName, setSponsorName] = useState(initialValue);
  const [check, setCheck] = useState<Check>(VALID);

  const user = useViewer();
  const currentName = user?.currentSponsor?.name;

  const checkSponsorNameAvailability = useMemo(
    () =>
      debounce(async (name: string) => {
        try {
          const response = await getJson<{ available: boolean }>(
            `/api/sponsors/check-name/?name=${encodeURIComponent(name)}`,
          );
          const available = response.available;
          setCheck({
            isInvalid: !available,
            validationErrorMessage: available
              ? ''
              : 'Company name already exists',
          });
        } catch (error) {
          logger.error(error);
          setCheck({
            isInvalid: true,
            validationErrorMessage:
              'An error occurred while checking sponsor name availability.',
          });
        }
      }, 300),
    [],
  );

  // Their own sponsor's name is always theirs to keep.
  const isOwn = !!sponsorName && sponsorName === currentName;

  useEffect(() => {
    if (sponsorName && !isOwn) void checkSponsorNameAvailability(sponsorName);
    return () => checkSponsorNameAvailability.cancel();
  }, [sponsorName, isOwn, checkSponsorNameAvailability]);

  const { isInvalid, validationErrorMessage } = isOwn ? VALID : check;
  return { setSponsorName, isInvalid, validationErrorMessage, sponsorName };
};
