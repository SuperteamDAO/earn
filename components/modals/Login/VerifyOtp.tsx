import {
  Box,
  Button,
  FormControl,
  FormLabel,
  PinInput,
  PinInputField,
  Stack,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import type { FormEvent } from 'react';
import { useState } from 'react';

import type { User } from '@/interface/user';
import { userStore } from '@/store/user';

interface Props {
  userInfo: User | null;
  onClose: () => void;
  otp: {
    current: number;
    last: number;
  };
}

function NewUserInfo({ userInfo, onClose, otp }: Props) {
  const router = useRouter();
  const { setUserInfo } = userStore();
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationError, setVerificationError] = useState('');

  const verifyOTP = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      setVerificationError('');
      if (otp.current === Number(pin) || otp.last === Number(pin)) {
        const userUpdtedDetails = await axios.post('/api/user/update', {
          id: userInfo?.id,
          isVerified: true,
        });
        setUserInfo(userUpdtedDetails?.data);
        router.push('/new');
        onClose();
      } else {
        setVerificationError('Incorrect OTP. Please try again.');
      }
      setLoading(false);
    } catch (error) {
      setVerificationError('Incorrect OTP. Please try again.');
      setLoading(false);
    }
  };

  return (
    <Box>
      <Text mb={4} color="brand.slate.500" fontSize="lg" textAlign="center">
        OTP sent to {userInfo?.email}
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
              isLoading={!!loading}
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

export default NewUserInfo;
