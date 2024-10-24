import { FormLabel, Text } from '@chakra-ui/react';
import { type UseFormRegister } from 'react-hook-form';

import { AutoResizeTextarea } from '@/components/shared/autosize-textarea';

interface QuestionProps {
  question: string;
  label: string;
  register: UseFormRegister<any>;
  watch?: any;
  validate?: any;
  error?: string;
}

export const QuestionHandler = ({
  question,
  register,
  label,
  watch,
  validate,
  error,
}: QuestionProps) => {
  return (
    <>
      <FormLabel mb={1} color={'brand.slate.600'} fontWeight={600}>
        {question}
      </FormLabel>
      <AutoResizeTextarea
        borderColor={'brand.slate.300'}
        _placeholder={{ color: 'brand.slate.300' }}
        focusBorderColor="brand.purple"
        maxLength={3000}
        {...register(label, { validate })}
      />
      <Text
        color={(watch(label)?.length || 0) > 2900 ? 'red' : 'brand.slate.400'}
        fontSize={'xs'}
        textAlign="right"
      >
        {watch(label)?.length > 2500 &&
          (3000 - (watch(label)?.length || 0) === 0 ? (
            <p>Character limit reached</p>
          ) : (
            <p>{3000 - (watch(label)?.length || 0)} characters left</p>
          ))}
      </Text>

      <Text alignSelf="start" mt={2} ml={1} color="red" fontSize="14px">
        {error}
      </Text>
    </>
  );
};
