import {
  Tooltip as ChakraTooltip,
  type TooltipProps,
  useOutsideClick,
} from '@chakra-ui/react';
import { useRef } from 'react';

// click to open toolips on mobiles

interface Props extends TooltipProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  children: React.ReactNode;
}

export const Tooltip = ({ isOpen, setIsOpen, children, ...props }: Props) => {
  const ref = useRef<HTMLDivElement | null>(null);

  useOutsideClick({
    ref: ref,
    handler: () => setIsOpen(false),
  });

  return (
    <ChakraTooltip
      ref={ref}
      isOpen={isOpen}
      label={props.label}
      onClose={() => setIsOpen(false)}
      onOpen={() => setIsOpen(true)}
      {...props}
    >
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </button>
    </ChakraTooltip>
  );
};
