import {
  Box,
  Button,
  Flex,
  Modal,
  ModalContent,
  ModalOverlay,
  Radio,
  RadioGroup,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import { type Survey, type SurveyQuestion } from 'posthog-js';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

import { useUser } from '@/store/user';

function getMatchingSurvey(surveys: Survey[], id: string): Survey | null {
  const survey = surveys.find((survey) => survey.id === id);
  return survey || null;
}

export const SurveyModal = ({
  isOpen,
  onClose,
  surveyId,
}: {
  isOpen: boolean;
  onClose: () => void;
  surveyId: string;
}) => {
  const { refetchUser } = useUser();
  const posthog = usePostHog();

  const [question, setQuestion] = useState<SurveyQuestion | undefined | null>(
    null,
  );
  const [response, setResponse] = useState<string | number>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRating = (rate: number) => {
    setResponse(rate);
  };

  const handleChoiceSelection = (choice: string) => {
    setResponse(choice);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    posthog.capture('survey sent', {
      $survey_id: surveyId,
      $survey_response: response,
    });
    await axios.post('/api/user/update-survey/', {
      surveyId,
    });
    await refetchUser();
    setIsSubmitting(false);
    onClose();
  };

  useEffect(() => {
    posthog.getActiveMatchingSurveys((surveys) => {
      const surveyById = getMatchingSurvey(surveys, surveyId);
      setQuestion(surveyById?.questions[0]);
    }, true);
  }, [posthog]);

  return (
    <Modal
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
    >
      <ModalOverlay />
      <ModalContent p={6}>
        {!question ? (
          <Box>
            <Skeleton h="18px" mb={2} />
            <Skeleton w="60%" h="14px" mb={5} />
            <Flex justify="center" gap={1} mt={8}>
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} w="40px" h="36px" />
              ))}
            </Flex>
            <Skeleton h="10" mt={8} mb={3} borderRadius={'3'} />
          </Box>
        ) : (
          <>
            <Box>
              <Text
                mb={2}
                color="brand.slate.700"
                fontSize="lg"
                fontWeight={600}
                lineHeight={'125%'}
              >
                {question?.question}
              </Text>
              <Text mb={5} color="brand.slate.500" fontSize="sm">
                {question?.description}
              </Text>
              {question?.type === 'rating' && (
                <Box>
                  <Flex justify="center" gap={4} mt={2}>
                    {[...Array(question.scale)].map((_, i) => (
                      <Button
                        key={i}
                        onClick={() => handleRating(i + 1)}
                        size={'sm'}
                        variant={response === i + 1 ? 'solid' : 'outline'}
                      >
                        {i + 1}
                      </Button>
                    ))}
                  </Flex>
                  <Flex justify={'space-between'} flexGrow={1} mt={0.5}>
                    <Text color="brand.slate.400" fontSize="xs">
                      {question.lowerBoundLabel}
                    </Text>
                    <Text color="brand.slate.400" fontSize="xs">
                      {question.upperBoundLabel}
                    </Text>
                  </Flex>
                </Box>
              )}
              {question?.type === 'single_choice' && (
                <RadioGroup
                  mb={3}
                  onChange={(value) => handleChoiceSelection(value)}
                  value={response !== undefined ? String(response) : undefined}
                >
                  <Stack direction="column">
                    {question.choices.map((choice, idx) => (
                      <Radio
                        key={idx}
                        _hover={{ bg: 'brand.slate.100' }}
                        colorScheme="purple"
                        name="memberType"
                        size="md"
                        value={choice}
                      >
                        {choice}
                      </Radio>
                    ))}
                  </Stack>
                </RadioGroup>
              )}
            </Box>
            <Button
              mt={4}
              isDisabled={!response}
              isLoading={isSubmitting}
              loadingText="Submitting..."
              onClick={handleSubmit}
            >
              Submit
            </Button>
          </>
        )}
      </ModalContent>
    </Modal>
  );
};
