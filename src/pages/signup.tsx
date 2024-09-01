import {
  Box,
  Button,
  Container,
  Heading,
  Image,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

import { SignIn } from '@/features/auth';
import { acceptInvite, verifyInviteQuery } from '@/features/sponsor-dashboard';

export default function SignupPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isNavigating, setIsNavigating] = useState(false);

  const { token } = router.query;
  const cleanToken =
    (Array.isArray(token) ? token[0] : token)?.split('?')[0] || '';

  const { data: inviteDetails, error } = useQuery(
    verifyInviteQuery(cleanToken),
  );

  const acceptInviteMutation = useMutation({
    mutationFn: acceptInvite,
    onSuccess: () => {
      toast.success("You've successfully joined the sponsor's dashboard.");
      setIsNavigating(true);
      router.push('/dashboard/listings');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleAcceptInvite = () => {
    acceptInviteMutation.mutate(cleanToken);
  };

  useEffect(() => {
    if (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'An error occurred while verifying the invitation',
      );
    }
  }, [error]);

  if (error) {
    return (
      <Container centerContent>
        <VStack mt={10} spacing={4}>
          <Heading>Invitation Error</Heading>
          <Text>
            {error instanceof Error ? error.message : 'An error occurred'}
          </Text>
          <Button onClick={() => router.push('/')}>Go to Homepage</Button>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="xl" centerContent>
      <Box
        w="full"
        mt={10}
        px={20}
        pt={20}
        pb={40}
        bg="white"
        borderWidth={1}
        borderColor="gray.200"
        borderRadius="lg"
        shadow="lg"
      >
        <VStack align="center" spacing={0}>
          <Text
            color="brand.slate.600"
            fontSize="2xl"
            fontWeight={500}
            textAlign="center"
          >
            Welcome to Superteam Earn
          </Text>
          <Text color="brand.slate.600" fontSize="lg" textAlign="center">
            Start your journey to access top global talent!
          </Text>
          <Image
            w={20}
            h={20}
            mt={12}
            mr={{ base: 3, sm: 5 }}
            alt={inviteDetails?.sponsorName}
            rounded={5}
            src={inviteDetails?.sponsorLogo}
          />
          <Text
            mt={5}
            color="brand.slate.500"
            fontWeight={500}
            lineHeight="24px"
            textAlign="center"
          >
            {inviteDetails?.senderName} has invited you to join <br />
            {inviteDetails?.sponsorName}
          </Text>
          {!session ? (
            <Box w="full" mt={12}>
              <Text
                mb={4}
                color="brand.slate.500"
                fontWeight={500}
                textAlign="center"
              >
                Please sign in to accept the invitation:
              </Text>
              <SignIn loginStep={0} setLoginStep={() => {}} />
            </Box>
          ) : (
            <Button
              mt={4}
              colorScheme="blue"
              isLoading={acceptInviteMutation.isPending || isNavigating}
              onClick={handleAcceptInvite}
              size="lg"
              variant={'outline'}
            >
              Accept Invite
            </Button>
          )}
        </VStack>
      </Box>
    </Container>
  );
}
