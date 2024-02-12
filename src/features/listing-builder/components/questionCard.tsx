/* tslint:disable */
import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import type { Dispatch, SetStateAction } from 'react';

import type { Ques } from './questionBuilder';

interface Props {
  setQuestions: Dispatch<SetStateAction<Ques[]>>;
  curentQuestion: Ques;
  index: number;
  errorState: ErrorState[];
  handleDelete: (index: number) => void;
}
type ErrorState = {
  order: number;
  errMessage: string;
};
export const QuestionCard = ({
  setQuestions,
  curentQuestion,
  index,
  errorState,
  handleDelete,
}: Props) => {
  const handleChangeQuestion = (newq: string) => {
    setQuestions((prev) => {
      return prev.map((q) => {
        if (q.order === curentQuestion.order) {
          return {
            ...q,
            question: newq,
            label: newq,
          };
        }
        return q;
      });
    });
  };

  return (
    <>
      <VStack align={'start'} w={'full'}>
        <FormControl
          w={'full'}
          isInvalid={
            !!errorState.filter((e) => e.order === curentQuestion.order)[0]
          }
        >
          <FormLabel color={'gray.500'}>
            <Text color={'gray.500'} fontSize={'0.88rem'} fontWeight={600}>
              Question {index + 1}
            </Text>
          </FormLabel>
          <Flex gap="4">
            <Input
              borderColor="brand.slate.300"
              _placeholder={{
                color: 'brand.slate.300',
              }}
              focusBorderColor="brand.purple"
              onChange={(e) => {
                handleChangeQuestion(e.target.value);
              }}
              placeholder="Enter your question here"
              value={curentQuestion.question}
            />
            <Button colorScheme="red" onClick={() => handleDelete(index)}>
              <DeleteIcon />
            </Button>
          </Flex>
          <FormErrorMessage>
            {errorState?.filter((e) => e?.order === curentQuestion.order)[0] &&
              errorState?.filter((e) => e?.order === curentQuestion.order)[0]
                ?.errMessage}
          </FormErrorMessage>
        </FormControl>
      </VStack>
    </>
  );
};
