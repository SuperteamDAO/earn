import {
  Box,
  Button,
  Container,
  Heading,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

import { Login } from '@/features/auth';
import type { User } from '@/interface/user';
import { userStore } from '@/store/user';

interface Props {
  invite: any;
}

export function InviteView({ invite }: Props) {
  const router = useRouter();
  const [triggerLogin, setTriggerLogin] = useState(false);
  const [isWalletError, setIsWalletError] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);

  const { setUserInfo, userInfo } = userStore();

  const { isOpen, onOpen, onClose } = useDisclosure();

  const acceptUser = async (user: User) => {
    setIsAccepting(true);
    if (user?.email !== invite?.email) {
      setIsWalletError(true);
      setIsAccepting(false);
    } else if (user?.id && user?.email === invite?.email) {
      try {
        await axios.post('/api/userSponsors/accept/', {
          inviteId: invite?.id,
        });
        setUserInfo({
          ...userInfo,
          currentSponsorId: invite?.currentSponsorId,
        });
        router.push('/dashboard/listings');
      } catch (e) {
        setIsWalletError(true);
        setIsAccepting(false);
      }
    }
  };

  const handleSubmit = () => {
    if (!userInfo?.id) {
      setUserInfo({ email: invite?.email });
      setTriggerLogin(true);
    }
  };

  const inviteInfo = {
    emailInvite: invite?.email,
    currentSponsorId: invite?.sponsorId,
    memberType: invite?.memberType,
  };

  useEffect(() => {
    const makeUser = async () => {
      const userDetails = await axios.post('/api/user/');
      if (invite?.email && acceptUser) {
        acceptUser(userDetails.data);
      }
    };
    inviteInfo && makeUser();
  }, []);

  useEffect(() => {
    if (triggerLogin) {
      setTriggerLogin(false);
      onOpen();
    }
  }, [triggerLogin]);

  const isSponsor = inviteInfo && Object.keys(inviteInfo).length > 0;

  return (
    <Container maxW={'3xl'}>
      {!!isOpen && (
        <Login isSponsor={isSponsor} isOpen={isOpen} onClose={onClose} />
      )}
      <Stack as={Box} py={{ base: 20, md: 36 }} textAlign={'center'}>
        <Heading
          fontSize={{ base: '2xl', sm: '4xl', md: '6xl' }}
          fontWeight={700}
          lineHeight={'110%'}
        >
          Welcome to <br />
          <Text as={'span'} color={'brand.purple'}>
            Superteam Earn
          </Text>
          !
        </Heading>
        <Text pt={2} color={'brand.slate.500'}>
          Start your journey to access top global talent!
          <br />
          <Text as="span" fontWeight={700}>
            Accept{' '}
            {`${invite?.sender?.firstName} ${invite?.sender?.lastName}'s`}{' '}
            invite to join Superteam Earn.
          </Text>
        </Text>
        <Stack
          pos={'relative'}
          align={'center'}
          direction={'column'}
          alignSelf={'center'}
          pt={4}
        >
          <Button
            px={6}
            isLoading={isAccepting}
            loadingText="Accepting Invite..."
            onClick={() => handleSubmit()}
            rounded={'full'}
            size="lg"
            variant="solid"
          >
            Accept Invite
          </Button>
        </Stack>
        {isWalletError && (
          <Text pt={2} color={'red'}>
            You have already signed up using the same email address with another
            sponsor.
            <br />
            Please log out, change your email address & try again.
          </Text>
        )}
      </Stack>
    </Container>
  );
}
