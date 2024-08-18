import { Alert, AlertIcon, Button } from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { BsBriefcaseFill } from 'react-icons/bs';

import { userSponsorQuery } from '@/queries/user-sponsor';
import { useUser } from '@/store/user';

export function SponsorButton() {
  const router = useRouter();
  const { user } = useUser();
  const [showMessage, setShowMessage] = useState(false);

  const { data: sponsors, refetch, isFetching } = useQuery(userSponsorQuery);

  useEffect(() => {
    if (sponsors) {
      if (sponsors.length) {
        router.push('/new/listing');
      } else {
        router.push('/new/sponsor');
      }
    }
  }, [sponsors, router]);

  const handleClick = () => {
    if (!user || !user?.id) {
      setShowMessage(true);
    } else {
      setShowMessage(false);
      refetch();
    }
  };

  return (
    <>
      {showMessage && (
        <Alert mb={4} status="warning">
          <AlertIcon />
          Please log in to continue!
        </Alert>
      )}
      <Button
        w={'full'}
        h={12}
        color={'white'}
        fontSize={'0.9rem'}
        bg={'#6562FF'}
        _hover={{ bg: '#6562FF' }}
        isLoading={isFetching}
        leftIcon={<BsBriefcaseFill />}
        loadingText="Redirecting..."
        onClick={handleClick}
      >
        Make Your Sponsor Profile
      </Button>
    </>
  );
}
