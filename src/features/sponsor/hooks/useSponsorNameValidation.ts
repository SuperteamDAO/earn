import { useEffect, useState } from 'react';

import { api } from '@/lib/api';
import logger from '@/lib/logger';
import { useUser } from '@/store/user';

export const useSponsorNameValidation = (initialValue = '') => {
  const [sponsorName, setSponsorName] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');

  const { user } = useUser();

  useEffect(() => {
    if (sponsorName && sponsorName === user?.currentSponsor?.name) {
      setIsInvalid(false);
      setValidationErrorMessage('');
      return;
    }
    if (!sponsorName) return;

    const checkSponsorNameAvailability = async (name: string) => {
      try {
        const response = await api.get(`/api/sponsors/check-name?name=${name}`);
        const available = response.data.available;
        setIsInvalid(!available);
        setValidationErrorMessage(
          available ? '' : 'Company name already exists',
        );
      } catch (error) {
        logger.error(error);
        setIsInvalid(true);
        setValidationErrorMessage(
          'An error occurred while checking sponsor name availability.',
        );
      }
    };

    const timer = setTimeout(
      () => checkSponsorNameAvailability(sponsorName),
      300,
    );
    return () => clearTimeout(timer);
  }, [sponsorName, user?.currentSponsor?.name]);

  return { setSponsorName, isInvalid, validationErrorMessage, sponsorName };
};
