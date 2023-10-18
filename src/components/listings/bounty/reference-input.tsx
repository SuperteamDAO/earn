import {
  FormControl,
  FormErrorMessage,
  FormLabel,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { type Dispatch, type SetStateAction, useState } from 'react';

import type { References } from '@/interface/bounty';
import { isValidHttpUrl } from '@/utils/validUrl';

interface Props {
  setReferences: Dispatch<SetStateAction<References[]>>;
  curentReference: References;
  index: number;
  setReferenceError: Dispatch<SetStateAction<boolean>>;
}

export const ReferenceCard = ({
  setReferences,
  curentReference,
  index,
  setReferenceError,
}: Props) => {
  const [errorState, setErrorState] = useState<string | null>(null);
  const handleChangeReference = (newLink: string) => {
    setReferences((prev) => {
      return prev.map((r) => {
        if (r.order === curentReference.order) {
          return {
            ...r,
            link: newLink,
          };
        }
        return r;
      });
    });

    const isValid = isValidHttpUrl(newLink);
    if (!isValid) {
      setErrorState('Link URL needs to contain "https://" prefix');
      setReferenceError(true);
    } else {
      setErrorState(null);
      setReferenceError(false);
    }
  };

  return (
    <VStack align={'start'} w={'full'}>
      <FormControl w={'full'} isInvalid={!!errorState}>
        <FormLabel color={'gray.500'}>
          <Text color={'gray.500'} fontSize={'0.88rem'} fontWeight={600}>
            Reference {index + 1}
          </Text>
        </FormLabel>
        <Input
          borderColor="brand.slate.300"
          _placeholder={{
            color: 'brand.slate.300',
          }}
          focusBorderColor="brand.purple"
          onChange={(e) => {
            handleChangeReference(e.target.value);
          }}
          placeholder="Enter a reference link"
          value={curentReference.link}
        />
        <FormErrorMessage>{errorState}</FormErrorMessage>
      </FormControl>
    </VStack>
  );
};
