import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Collapse,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import parse, { type HTMLReactParserOptions } from 'html-react-parser';
import React, { useEffect, useRef, useState } from 'react';

interface Props {
  description?: string;
}

export function DescriptionUI({ description }: Props) {
  const options: HTMLReactParserOptions = {
    replace: ({ name, children, attribs }: any) => {
      if (name === 'p' && (!children || children.length === 0)) {
        return <br />;
      }
      return { name, children, attribs };
    },
  };

  //to resolve a chain of hydration errors
  const [isMounted, setIsMounted] = useState(false);
  const [showMore, setShowMore] = useState(true);
  const [showCollapser, setShowCollapser] = useState(false);
  const descriptionRef = useRef<HTMLDivElement>(null);
  const isMD = useBreakpointValue({ base: false, md: true });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (descriptionRef.current) {
      const fiftyVH = window.innerHeight / 2;
      if (descriptionRef.current.clientHeight > fiftyVH && !isMD) {
        setShowCollapser(true);
        setShowMore(false);
      }
    }
  }, [descriptionRef.current]);

  if (!isMounted) {
    return null;
  }

  return (
    <Box overflow="visible" w="full">
      <VStack
        ref={descriptionRef}
        pos="relative"
        overflow={'visible'}
        w="full"
        px={{ base: 0 }}
        py={5}
        bg={'white'}
        rounded={'xl'}
      >
        <Collapse
          in={showMore}
          startingHeight={'50vh'}
          style={{ width: '100%' }}
        >
          <Box overflow={'visible'} w={'full'} h={'full'} pb={8} id="reset-des">
            {parse(
              description?.startsWith('"')
                ? JSON.parse(description || '')
                : description ?? '',
              options,
            )}
          </Box>
        </Collapse>
        {showCollapser && (
          <Button
            pos="absolute"
            zIndex={2}
            bottom={1}
            left={'50%'}
            color="brand.slate.500"
            bg="white"
            borderColor={'brand.slate.300'}
            transform={'translateX(-50%)'}
            onClick={() => setShowMore(!showMore)}
            rightIcon={
              <ChevronDownIcon
                w={5}
                h={5}
                color="brand.slate.300"
                transform={showMore ? 'rotate(180deg)' : ''}
              />
            }
            size="sm"
            variant="outline"
          >
            Read {showMore ? 'Less' : 'More'}
          </Button>
        )}
      </VStack>
    </Box>
  );
}
