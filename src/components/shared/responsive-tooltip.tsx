import {
  Tooltip as ChakraTooltip,
  type TooltipProps,
  useOutsideClick,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';

// click to open toolips on mobiles

interface Props extends TooltipProps {
  children: React.ReactNode;
}

export const Tooltip = (props: Props) => {
  const [isOpen, setIsOpen] = useState(false);
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
        }}
        onClick={() => setIsOpen(true)}
      >
        {props.children}
      </button>
    </ChakraTooltip>
  );
};
