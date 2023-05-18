import axios from 'axios';
import { useState } from 'react';
import AsyncSelect from 'react-select/async';

import { userStore } from '@/store/user';

function SelectSponsor() {
  const { userInfo } = userStore();
  const [isSponsorsLoading, setIsSponsorsLoading] = useState(false);
  console.log(
    'file: SelectSponsor.tsx:6 ~ SelectSponsor ~ userInfo:',
    userInfo?.currentSponsor
  );

  const getSponsors = async () => {
    setIsSponsorsLoading(true);
    try {
      const sponsorDetails = await axios.get(`/api/sponsors/`, {
        params: {
          userId: userInfo?.id,
        },
      });
      setIsSponsorsLoading(false);
    } catch (e) {
      setIsSponsorsLoading(false);
    }
  };

  const loadSponsors = async (
    inputValue: string,
    callback: (options: any) => void
  ) => {
    console.log(
      'file: SelectSponsor.tsx:13 ~ loadSponsors ~ inputValue:',
      inputValue
    );
    callback([]);
  };

  return <AsyncSelect cacheOptions loadOptions={loadSponsors} defaultOptions />;
}

export default SelectSponsor;
