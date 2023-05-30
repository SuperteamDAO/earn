import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Stack,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import type { FormEvent } from 'react';
import { useState } from 'react';

import type { User } from '@/interface/user';
import { generateCode, generateCodeLast } from '@/utils/helpers';
import { Mixpanel } from '@/utils/mixpanel';
import { truncatePublicKey } from '@/utils/truncatePublicKey';

interface Props {
  userInfo: User | null;
  setUserInfo: (userInfo: User) => void;
  setStep: (step: number) => void;
  setOtp: (otp: { current: number; last: number }) => void;
  inviteInfo?: {
    emailInvite?: string;
    currentSponsorId?: string;
    memberType?: 'MEMBER' | 'ADMIN';
  };
}

interface Info {
  firstName?: string;
  lastName?: string;
  email?: string;
}

const validateEmail = (email: string) => {
  if (!email) {
    return false;
  }
  if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,8}$/i.test(email)) {
    return false;
  }
  return true;
};

function NewUserInfo({
  setUserInfo,
  userInfo,
  setStep,
  setOtp,
  inviteInfo,
}: Props) {
  const [userDetails, setUserDetails] = useState({
    firstName: userInfo?.firstName ?? '',
    lastName: userInfo?.lastName ?? '',
    email: inviteInfo?.emailInvite ?? userInfo?.email ?? '',
  });
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const setInfo = (info: Info) => {
    setUserDetails({
      ...userDetails,
      ...info,
    });
  };

  const sendOTPEmail = async (user: User) => {
    setUserInfo({ ...userInfo, ...user });
    await axios.post('/api/otp/send', {
      publicKey: userInfo?.publicKey,
      email: userDetails?.email,
    });
    Mixpanel.track('otp_sent', {
      email: userDetails?.email,
    });
    const code = generateCode(userInfo?.publicKey);
    const codeLast = generateCodeLast(userInfo?.publicKey);
    setOtp({
      current: code,
      last: codeLast,
    });
    setLoading(false);
    setStep(3);
  };

  const sendOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      if (
        !userDetails?.firstName ||
        !userDetails?.lastName ||
        !userDetails?.email
      ) {
        setErrorMessage('Please fill all the fields');
      } else if (!validateEmail(userDetails?.email)) {
        setErrorMessage('Please enter a valid email address');
      } else {
        setErrorMessage('');
        setLoading(true);
        const newUserDetails = await axios.post('/api/user/create', {
          publicKey: userInfo?.publicKey,
          email: userDetails?.email,
          firstName: userDetails?.firstName,
          lastName: userDetails?.lastName,
        });
        sendOTPEmail(newUserDetails?.data);
      }
    } catch (error: any) {
      if (
        error?.response?.data?.error?.code === 'P2002' &&
        error?.response?.data?.user
      ) {
        if (error?.response?.data?.user?.publicKey === userInfo?.publicKey) {
          sendOTPEmail(error?.response?.data?.user);
        } else {
          setErrorMessage(
            `User already exists for this email with another wallet (${truncatePublicKey(
              error?.response?.data?.user?.publicKey
            )}).`
          );
        }
      } else {
        setErrorMessage(
          `Error occurred in creating user. Error Code:${
            error?.response?.data?.error?.code || 'N/A'
          }`
        );
      }
      setLoading(false);
    }
  };

  return (
    <Box>
      <Text mb={4} color="brand.slate.500" fontSize="lg" textAlign="center">
        Welcome, let&apos;s get you started!
      </Text>
      <Stack spacing={4}>
        <form onSubmit={(e) => sendOTP(e)}>
          <HStack mb={4}>
            <Box>
              <FormControl id="firstName" isRequired>
                <FormLabel color="brand.slate.500">First Name</FormLabel>
                <Input
                  defaultValue={userDetails?.firstName}
                  focusBorderColor="brand.purple"
                  onChange={(e) => setInfo({ firstName: e.target.value })}
                  type="text"
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl id="lastName" isRequired>
                <FormLabel color="brand.slate.500">Last Name</FormLabel>
                <Input
                  defaultValue={userDetails?.lastName}
                  focusBorderColor="brand.purple"
                  onChange={(e) => setInfo({ lastName: e.target.value })}
                  type="text"
                />
              </FormControl>
            </Box>
          </HStack>
          <FormControl mb={4} id="email" isRequired>
            <FormLabel color="brand.slate.500">Email address</FormLabel>
            <Input
              _readOnly={{
                bg: 'brand.slate.200',
                color: 'brand.slate.500',
                cursor: 'not-allowed',
              }}
              defaultValue={userDetails?.email}
              focusBorderColor="brand.purple"
              isReadOnly={!!inviteInfo?.emailInvite}
              onChange={(e) => setInfo({ email: e.target.value })}
              type="email"
            />
          </FormControl>
          <Stack pt={2} spacing={10}>
            <Button
              isLoading={!!loading}
              loadingText="Verifying..."
              type="submit"
              variant="solid"
            >
              Verify Account
            </Button>
          </Stack>
        </form>
        {!!errorMessage && (
          <Text mb={4} color="red" textAlign="center">
            {errorMessage}
          </Text>
        )}
      </Stack>
    </Box>
  );
}

export default NewUserInfo;
