import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Collapse,
  useBreakpointValue,
  VStack,
} from '@chakra-ui/react';
import parse, { type HTMLReactParserOptions } from 'html-react-parser';
import React, { useCallback, useEffect, useRef, useState } from 'react';

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
  const isNotMD = useBreakpointValue({ base: true, md: false });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const decideCollapser = useCallback(() => {
    if (descriptionRef) {
      const fiftyVH = window.innerHeight / 2;
      if (isNotMD && (descriptionRef.current?.clientHeight ?? 0) > fiftyVH) {
        setShowCollapser(true);
        setShowMore(false);
      }
    }
  }, [descriptionRef.current, isNotMD]);

  useEffect(() => {
    // Use a timeout to ensure the DOM has been updated
    const timer = setTimeout(() => {
      decideCollapser();
    }, 0);

    return () => clearTimeout(timer);
  }, [decideCollapser, isMounted]);

  if (!isMounted) {
    return null;
  }

  return (
    <Box
      overflow="visible"
      w="full"
      borderBottomWidth={{ base: '1px', md: '0px' }}
    >
      <VStack
        ref={descriptionRef}
        pos="relative"
        overflow={'visible'}
        w="full"
        px={{ base: 0 }}
        bg={'white'}
        rounded={'xl'}
      >
        <Collapse
          in={showMore}
          startingHeight={'50vh'}
          style={{ width: '100%' }}
        >
          <Box
            className="listing-description"
            overflow={'visible'}
            w={'full'}
            h={'full'}
            pb={7}
            id="reset-des"
          >
            {parse(
              description?.startsWith('"')
                ? JSON.parse(description || '')
                : (description ?? ''),
              options,
            )}
          </Box>
        </Collapse>
        {showCollapser && (
          <Button
            pos="absolute"
            zIndex={2}
            bottom={-4}
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
