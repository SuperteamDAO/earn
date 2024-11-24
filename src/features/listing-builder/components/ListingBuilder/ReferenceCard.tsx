import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  Input,
  Text,
} from '@chakra-ui/react';
import { type FieldErrors, type UseFormRegister } from 'react-hook-form';

import { type References } from '../../../listings/types';

interface PropFields {
  description: string;
  requirements?: string;
  references?: References[];
}

interface Props {
  register: UseFormRegister<PropFields>;
  index: number;
  errors: FieldErrors<PropFields>;
}

export const ReferenceCard = ({ register, index, errors }: Props) => {
  return (
    <HStack align="start" w="full">
      <Text color={'gray.500'} fontSize={'0.88rem'} fontWeight={600}>
        {index + 1}.
      </Text>
      <HStack align={'start'} w={'full'}>
        <FormControl w={'full'} isInvalid={!!errors.references?.[index]?.link}>
          <FormLabel color={'gray.500'}>
            <Text color={'gray.500'} fontSize={'0.88rem'} fontWeight={600}>
              链接
            </Text>
          </FormLabel>
          <Input
            {...register(`references.${index}.link`)}
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            placeholder=""
          />
          <FormErrorMessage>
            {errors.references?.[index]?.link?.message}
          </FormErrorMessage>
        </FormControl>
        <FormControl w={'full'} isInvalid={!!errors.references?.[index]?.title}>
          <FormLabel color={'gray.500'}>
            <Text color={'gray.500'} fontSize={'0.88rem'} fontWeight={600}>
              题目
            </Text>
          </FormLabel>
          <Input
            {...register(`references.${index}.title`)}
            borderColor="brand.slate.300"
            _placeholder={{
              color: 'brand.slate.300',
            }}
            focusBorderColor="brand.purple"
            placeholder=""
          />
          <FormErrorMessage>
            {errors.references?.[index]?.title?.message}
          </FormErrorMessage>
        </FormControl>
      </HStack>
    </HStack>
  );
};
