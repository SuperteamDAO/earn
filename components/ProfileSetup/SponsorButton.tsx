import { AddIcon } from '@chakra-ui/icons';
import { Button } from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { SponsorStore } from '@/store/sponsor';
import { userStore } from '@/store/user';

function SponsorButton() {
  const router = useRouter();
  const { setCurrentSponsor } = SponsorStore();
  const { userInfo } = userStore();
  const [isLoading, setIsLoading] = useState(false);

  const checkSponsor = async () => {
    if (!userInfo || !userInfo?.id) return;
    setIsLoading(true);
    try {
      const sponsors = await axios.post('/api/userSponsors', {
        userId: userInfo.id,
      });
      if (sponsors?.data?.length) {
        setCurrentSponsor(sponsors?.data[0]?.sponsor);
        router.push('/new/listing');
      } else {
        router.push('/new/sponsor');
      }
    } catch (error) {
      setIsLoading(false);
    }
  };

  return (
    <Button
      w={'full'}
      h={12}
      color={'white'}
      fontSize={'0.9rem'}
      bg={'#6562FF'}
      _hover={{ bg: '#6562FF' }}
      isLoading={!!isLoading}
      leftIcon={<AddIcon />}
      loadingText="Redirecting..."
      onClick={() => checkSponsor()}
    >
      List your Opportunity
    </Button>
  );
}

export default SponsorButton;
