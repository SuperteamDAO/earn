import { DeleteIcon } from '@chakra-ui/icons';
import {
  Button,
  Flex,
  FormControl,
  FormLabel,
  Input,
  VStack,
} from '@chakra-ui/react';

interface QuestionCardProps {
  register: any;
  index: number;
  remove: (index: number) => void;
}

export const QuestionCard = ({
  register,
  index,
  remove,
}: QuestionCardProps) => {
  return (
    <VStack align={'start'} w={'full'}>
      <FormControl>
        <FormLabel>Question {index + 1}</FormLabel>
        <Flex gap="4">
          <Input
            {...register(`eligibility.${index}.question`)}
            placeholder="Enter your question here"
          />
          <Button colorScheme="red" onClick={() => remove(index)}>
            <DeleteIcon />
          </Button>
        </Flex>
      </FormControl>
    </VStack>
  );
};
