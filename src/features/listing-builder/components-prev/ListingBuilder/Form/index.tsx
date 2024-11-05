import {
  Button,
  type ButtonProps,
  FormLabel,
  Image,
  Tooltip,
} from '@chakra-ui/react';
import { type ReactNode } from 'react';

type ToolbarButtonProps = {
  isActive?: boolean;
  children: ReactNode;
  onClick: () => void;
} & ButtonProps;

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
      fontWeight={500}
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

export const ToolbarButton = ({
  isActive = false,
  children,
  onClick,
  ...props
}: ToolbarButtonProps) => {
  return (
    <Button
      alignItems={'center'}
      justifyContent={'center'}
      display={'flex'}
      bg={isActive ? 'gray.200' : ''}
      borderTop={'1px solid #D2D2D2'}
      borderRight={'1px solid #D2D2D2'}
      borderRadius={'0px'}
      onClick={onClick}
      variant={'unstyled'}
      {...props}
    >
      {children}
    </Button>
  );
};
