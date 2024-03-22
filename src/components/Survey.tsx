import {
  Box,
  Button,
  Flex,
  Modal,
  ModalContent,
  ModalOverlay,
  Radio,
  RadioGroup,
  Stack,
  Text,
} from '@chakra-ui/react';
import { type Survey } from 'posthog-js';
import { usePostHog } from 'posthog-js/react';
import { useEffect, useState } from 'react';

type SurveyResponses = {
  [key: number]: string | number;
};

export function getMatchingSurvey(
  surveys: Survey[],
  id: string,
): Survey | null {
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
  const posthog = usePostHog();
  const [survey, setSurvey] = useState<Survey | null>(null);
  const [responses, setResponses] = useState<SurveyResponses>({});

  const handleRating = (questionId: number, rate: number) => {
    setResponses({ ...responses, [questionId]: rate });
  };

  const handleChoiceSelection = (questionId: number, choice: string) => {
    setResponses({ ...responses, [questionId]: choice });
  };

  useEffect(() => {
    posthog.getActiveMatchingSurveys((surveys) => {
      const surveyById = getMatchingSurvey(surveys, surveyId);
      setSurvey(surveyById);
    }, true);
  }, [posthog]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} size={'sm'}>
      <ModalOverlay />
      <ModalContent px={6} py={6}>
        {survey?.questions.map((question, index) => (
          <Box key={index}>
            <Text
              mb={2}
              color="brand.slate.700"
              fontSize="lg"
              fontWeight={600}
              lineHeight={'125%'}
            >
              {question.question}
            </Text>
            <Text mb={5} color="brand.slate.500" fontSize="sm">
              {question.description}
            </Text>
            {question.type === 'rating' && (
              <Box>
                <Flex justify="center" gap={4} mt={2}>
                  {[...Array(question.scale)].map((_, i) => (
                    <Button
                      key={i}
                      px={6}
                      onClick={() => handleRating(index, i + 1)}
                      variant={responses[index] === i + 1 ? 'solid' : 'outline'}
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
            {question.type === 'single_choice' && (
              <RadioGroup
                mb={3}
                onChange={(value) => handleChoiceSelection(index, value)}
                value={
                  responses[index] !== undefined
                    ? String(responses[index])
                    : undefined
                }
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
        ))}
        <Button mt={4} onClick={() => {}}>
          Submit
        </Button>
      </ModalContent>
    </Modal>
  );
};
