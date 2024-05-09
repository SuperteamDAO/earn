import { FormControl, FormLabel, Input, Text, VStack } from '@chakra-ui/react';
import { type UseFormRegister } from 'react-hook-form';

import { type References } from '../../types';

interface Props {
  register: UseFormRegister<{
    description: any;
    requirements: string | undefined;
    references: References[] | undefined;
  }>;
  index: number;
}

export const ReferenceCard = ({ register, index }: Props) => {
  return (
    <VStack align={'start'} w={'full'}>
      <FormControl w={'full'}>
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
      </FormControl>
    </VStack>
  );
};
