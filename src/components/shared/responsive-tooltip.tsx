import {
  Tooltip as ChakraTooltip,
  type TooltipProps,
  useOutsideClick,
} from '@chakra-ui/react';
import { useRef, useState } from 'react';

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

  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  return (
    <ChakraTooltip
      ref={ref}
      isOpen={isOpen}
      label={props.label}
      onClose={() => setIsOpen(false)}
      {...props}
    >
      <button
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
        }}
        onClick={handleToggle}
      >
        {props.children}
      </button>
    </ChakraTooltip>
  );
};
