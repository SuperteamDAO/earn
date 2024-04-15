import { FormLabel, Image, Tooltip } from '@chakra-ui/react';
import { type ReactNode } from 'react';

export const ListingFormLabel = ({
  children,
  htmlFor,
}: {
  children: ReactNode;
  htmlFor?: string;
}) => {
  return (
    <FormLabel
      color={'brand.slate.500'}
      fontSize={'15px'}
      fontWeight={600}
      htmlFor={htmlFor}
    >
      {children}
    </FormLabel>
  );
};

export const ListingTooltip = ({ label }: { label: string }) => {
  return (
    <Tooltip
      w="max"
      p="0.7rem"
      color="white"
      fontSize="0.9rem"
      fontWeight={600}
      bg="#6562FF"
      borderRadius="0.5rem"
      hasArrow
      label={label}
      placement="right-end"
    >
      <Image mt={-2} alt={'Info Icon'} src={'/assets/icons/info-icon.svg'} />
    </Tooltip>
  );
};
