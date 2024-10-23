import { FormLabel, Text } from '@chakra-ui/react';
import { type FieldValues, type UseFormRegister } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { AutoResizeTextarea } from '@/components/shared/autosize-textarea';

interface QuestionProps {
  question: string;
  label: string;
  register: UseFormRegister<FieldValues>;
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
  const { t } = useTranslation();

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
            <p>{t('QuestionHandler.characterLimitReached')}</p>
          ) : (
            <p>
              {t('QuestionHandler.charactersLeft', {
                count: 3000 - (watch(label)?.length || 0),
              })}
            </p>
          ))}
      </Text>

      <Text alignSelf="start" mt={2} ml={1} color="red" fontSize="14px">
        {error}
      </Text>
    </>
  );
};
