import {
  Box,
  Button,
  FormControl,
  FormLabel,
  HStack,
  Input,
  PinInput,
  PinInputField,
  Stack,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { FormEvent } from 'react';
import { useState } from 'react';

import { userStore } from '@/store/user';
import { generateOtp } from '@/utils/functions';
import { generateCode, generateCodeLast } from '@/utils/helpers';

interface Props {
  userPublicKey: string;
  onClose: () => void;
}

interface Info {
  firstName?: string;
  lastName?: string;
  email?: string;
}

function NewUserInfo({ userPublicKey, onClose }: Props) {
  const router = useRouter();
  const { setUserInfo } = userStore();
  const [showVerifyOTP, setShowVerifyOTP] = useState(false);
  const [pin, setPin] = useState('');
  const [userDetails, setUserDetails] = useState({
    firstName: '',
    lastName: '',
    email: 'tksumanth1994@gmail.com',
  });
  const [sendOTPLoading, setSendOTPLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    publicKey: '',
    email: '',
    firstName: '',
    lastName: '',
    isVerified: '',
    createdAt: '',
    updatedAt: '',
  });
  const [otp, setOtp] = useState({
    current: 0,
    last: 0,
  });
  const [verifyOTPLoading, setVerifyOTPLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const setInfo = (info: Info) => {
    setUserDetails({
      ...userDetails,
      ...info,
    });
  };

  const sendOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setSendOTPLoading(true);
      await generateOtp(userPublicKey, userDetails?.email);
      const newUserDetails = await axios.post('/api/user/create', {
        publicKey: userPublicKey,
        email: userDetails?.email,
        firstName: userDetails?.firstName,
        lastName: userDetails?.lastName,
      });
      setNewUser(newUserDetails?.data);
      setUserInfo(newUserDetails?.data);
      const code = generateCode(userPublicKey);
      const codeLast = generateCodeLast(userPublicKey);
      setOtp({
        current: code,
        last: codeLast,
      });
      setShowVerifyOTP(true);
      setSendOTPLoading(false);
    } catch (error) {
      setSendOTPLoading(false);
    }
  };

  const verifyOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setVerifyOTPLoading(true);
      setVerificationError('');
      if (otp.current === Number(pin) || otp.last === Number(pin)) {
        const userUpdtedDetails = await axios.post('/api/user/update', {
          id: newUser?.id,
          isVerified: true,
        });
        setUserInfo(userUpdtedDetails?.data);
        router.push('/new');
        onClose();
      } else {
        setVerificationError('Incorrect OTP. Please try again.');
      }
      setVerifyOTPLoading(false);
    } catch (error) {
      setVerificationError('Incorrect OTP. Please try again.');
      setVerifyOTPLoading(false);
    }
  };

  if (showVerifyOTP) {
    return (
      <Box>
        <Text mb={4} color="brand.slate.500" fontSize="lg" textAlign="center">
          OTP sent to {userDetails?.email}
        </Text>
        <Stack spacing={4}>
          <form onSubmit={(e) => verifyOTP(e)}>
            <FormControl mb={4} id="email" isRequired>
              <FormLabel color="brand.slate.500">Enter OTP</FormLabel>
              <PinInput
                focusBorderColor="brand.purple"
                manageFocus
                mask
                onComplete={(e) => {
                  setPin(e);
                }}
                type="alphanumeric"
              >
                <PinInputField mr={2} />
                <PinInputField mr={2} />
                <PinInputField mr={2} />
                <PinInputField mr={2} />
                <PinInputField mr={2} />
                <PinInputField />
              </PinInput>
            </FormControl>
            <Stack pt={2} spacing={10}>
              <Button
                isLoading={!!verifyOTPLoading}
                loadingText="Creating..."
                type="submit"
                variant="solid"
              >
                Create Account
              </Button>
            </Stack>
          </form>
          {!!verificationError && (
            <Text mb={4} color="red" textAlign="center">
              {verificationError}
            </Text>
          )}
        </Stack>
      </Box>
    );
  }

  return (
    <Box>
      <Text mb={4} color="brand.slate.500" fontSize="lg" textAlign="center">
        Let&apos;s get you started!
      </Text>
      <Stack spacing={4}>
        <form onSubmit={(e) => sendOTP(e)}>
          <HStack mb={4}>
            <Box>
              <FormControl id="firstName" isRequired>
                <FormLabel color="brand.slate.500">First Name</FormLabel>
                <Input
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
              focusBorderColor="brand.purple"
              onChange={(e) => setInfo({ email: e.target.value })}
              type="email"
            />
          </FormControl>
          <Stack pt={2} spacing={10}>
            <Button
              isLoading={!!sendOTPLoading}
              loadingText="Verifying..."
              type="submit"
              variant="solid"
            >
              Verify Account
            </Button>
          </Stack>
        </form>
      </Stack>
    </Box>
  );
}

export default NewUserInfo;
