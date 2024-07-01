import {
  Button,
  Input,
  Popover,
  PopoverCloseButton,
  PopoverContent,
  PopoverTrigger,
  Text,
  useBreakpointValue,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { usePostHog } from 'posthog-js/react';
import { type FormEvent, useEffect, useState } from 'react';

import { userStore } from '@/store/user';

export const EmailCapture = ({
  surveyId,
  localStorageId,
}: {
  surveyId: string;
  localStorageId: string;
}) => {
  const posthog = usePostHog();
  const { setUserInfo, userInfo } = userStore();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { isOpen, onOpen, onClose } = useDisclosure();

  const onCloseAltered = () => {
    // localStorage.setItem(localStorageId, JSON.stringify(true));
    onClose();
  };

  const updateUserWithSurveyId = async () => {
    setUserInfo({
      surveysShown: {
        ...userInfo?.surveysShown,
        [surveyId]: true,
      },
    });
    await axios.post('/api/user/update/', {
      surveysShown: {
        ...userInfo?.surveysShown,
        [surveyId]: true,
      },
    });
  };

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      posthog.capture('survey sent', {
        $survey_id: surveyId,
        $survey_response: email,
      });
      if (userInfo) {
        updateUserWithSurveyId();
      }
    } catch (e) {
      setError('Error collecting email, please try again later');
      console.log('Error collecting email');
    }
    onCloseAltered();
    setLoading(false);
  }

  const decideOpenStatus = async () => {
    let isEmailCollectedLocally = JSON.parse(
      localStorage.getItem(localStorageId) ?? 'false',
    );

    let isEmailCollectedDB = userInfo?.surveysShown?.[surveyId] === true;

    if (isEmailCollectedLocally && !isEmailCollectedDB) {
      if (userInfo) {
        await updateUserWithSurveyId();
        isEmailCollectedDB = true;
      }
    } else if (!isEmailCollectedLocally && isEmailCollectedDB) {
      // localStorage.setItem(localStorageId, JSON.stringify(true));
      isEmailCollectedLocally = true;
    }
    if (!isEmailCollectedDB && !isEmailCollectedLocally) {
      posthog.capture('survey shown', {
        $survey_id: surveyId,
      });
      onOpen();
    } else {
      onCloseAltered();
    }
  };

  useEffect(() => {
    decideOpenStatus();
  }, [userInfo]);

  const isMD = useBreakpointValue({ base: false, md: true });

  if (userInfo?.surveysShown?.[surveyId] === true) {
    return null;
  }

  return (
    <Popover
      closeOnBlur={false}
      closeOnEsc={false}
      isOpen={isOpen}
      onClose={onCloseAltered}
      placement="right-end"
    >
      <PopoverTrigger>
        <Text pos="fixed" right={2} bottom={4} visibility="hidden" />
      </PopoverTrigger>
      <PopoverContent
        maxW={{ base: '16rem', md: '24rem' }}
        style={{ right: 0, bottom: isMD ? 0 : '3.5rem' }}
      >
        <form onSubmit={handleSubmit}>
          <PopoverCloseButton onClick={onCloseAltered} />
          <VStack
            align="start"
            gap={{ base: 3, md: 6 }}
            overflow="hidden"
            p={6}
            rounded="lg"
          >
            <VStack align="start">
              <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight={500}>
                Enter your Email ID
              </Text>
              <Text color="brand.slate.400" fontSize={{ base: 'xs', md: 'sm' }}>
                to get updates about Talent Olympics
              </Text>
            </VStack>
            <Input
              fontSize={{ base: 'sm', md: 'md' }}
              autoFocus
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              required
              type="email"
              value={email}
            />
            <Button
              w="full"
              fontSize={{ base: 'sm', md: 'md' }}
              isLoading={loading}
              type="submit"
            >
              Submit
            </Button>
            {error && (
              <Text
                color="red"
                fontSize={{ base: 'sm', md: 'md' }}
                textAlign="center"
              >
                Some Error occurred, please try again later
              </Text>
            )}
          </VStack>
        </form>
      </PopoverContent>
    </Popover>
  );
};
