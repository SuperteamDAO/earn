import axios from 'axios';
import debounce from 'lodash.debounce';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import logger from '@/lib/logger';
import { useUser } from '@/store/user';

export const useSponsorNameValidation = (initialValue = '') => {
  const [sponsorName, setSponsorName] = useState(initialValue);
  const [isInvalid, setIsInvalid] = useState(false);
  const [validationErrorMessage, setValidationErrorMessage] = useState('');
  const { t } = useTranslation();

  const { user } = useUser();

  const checkSponsorNameAvailability = async (name: string) => {
    try {
      const response = await axios.get(`/api/sponsors/check-name?name=${name}`);
      const available = response.data.available;
      setIsInvalid(!available);
      setValidationErrorMessage(
        available ? '' : t('useSponsorNameValidation.companyNameExists'),
      );
    } catch (error) {
      logger.error(error);
      setIsInvalid(true);
      setValidationErrorMessage(
        t('useSponsorNameValidation.errorCheckingAvailability'),
      );
    }
  };

  const debouncedCheckSponsorName = debounce(checkSponsorNameAvailability, 300);

  useEffect(() => {
    if (sponsorName && sponsorName === user?.currentSponsor?.name) {
      setIsInvalid(false);
      setValidationErrorMessage('');
      return;
    }
    if (sponsorName) {
      debouncedCheckSponsorName(sponsorName);
    }
  }, [sponsorName, user?.currentSponsor?.name]);

  return { setSponsorName, isInvalid, validationErrorMessage, sponsorName };
};
