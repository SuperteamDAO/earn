import { Box, Button, Container, Heading, Stack, Text } from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useState } from 'react';

import { LoginWrapper } from '@/components/LoginWrapper';
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

  return (
    <Container maxW={'3xl'}>
      <LoginWrapper
        acceptUser={acceptUser}
        inviteInfo={{
          emailInvite: invite?.email,
          currentSponsorId: invite?.sponsorId,
          memberType: invite?.memberType,
        }}
        triggerLogin={triggerLogin}
        setTriggerLogin={setTriggerLogin}
      />
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
