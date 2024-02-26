import { FormLabel, Text } from '@chakra-ui/react';
import { type FieldValues, type UseFormRegister } from 'react-hook-form';

import { AutoResizeTextarea } from '@/components/shared/autosize-textarea';

interface QuestionProps {
  question: string;
  label: string;
  register: UseFormRegister<FieldValues>;
  watch?: any;
}

export const QuestionHandler = ({
  question,
  register,
  label,
  watch,
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
        {...register(label)}
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
    </>
  );
};
