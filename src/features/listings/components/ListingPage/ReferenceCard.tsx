import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { type FieldErrors, type UseFormRegister } from 'react-hook-form';

import { type References } from '../../types';

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
    <VStack align={'start'} w={'full'}>
      <FormControl w={'full'} isInvalid={!!errors.references?.[index]?.link}>
        <FormLabel color={'gray.500'}>
          <Text color={'gray.500'} fontSize={'0.88rem'} fontWeight={600}>
            Reference {index + 1}
          </Text>
        </FormLabel>
        <Input
          {...register(`references.${index}.link`)}
          borderColor="brand.slate.300"
          _placeholder={{
            color: 'brand.slate.300',
          }}
          focusBorderColor="brand.purple"
          placeholder="Enter a reference link"
        />
        <FormErrorMessage>
          {errors.references?.[index]?.link?.message}
        </FormErrorMessage>
      </FormControl>
    </VStack>
  );
};
