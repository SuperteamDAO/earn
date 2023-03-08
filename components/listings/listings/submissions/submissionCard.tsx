import { Box, Button, HStack, Image, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import { AiFillHeart } from 'react-icons/ai';

export const SubmissionCard = () => {
  return (
    <>
      <VStack
        overflow={'hidden'}
        h={'18rem'}
        rounded={'lg'}
        p={5}
        position={'relative'}
        w={'18rem'}
        bg={'white'}
      >
        <Image
          src="/assets/random/submission-card.svg"
          w={'full'}
          alt={'card'}
        />
        <HStack align={'center'} justify={'space-between'} w={'full'}>
          <VStack align={'start'}>
            <Text color={'#000000'} fontSize={'1.1rem'} fontWeight={600}>
              Yash Bhardwaj
            </Text>
            <HStack>
              <Image
                w={5}
                src={'/assets/randompeople/nft5.svg'}
                alt={'profile image'}
              />
              <Text color={'gray.400'}>by @ybhrdwj</Text>
            </HStack>
          </VStack>
          <Button
            variant={'unstyled'}
            border={'1px solid #CBD5E1'}
            w={14}
            display={'flex'}
            alignItems={'center'}
            gap={2}
          >
            <AiFillHeart color="#94A3B8" />5
          </Button>
        </HStack>
        <Box
          bg={'#FFE6B6'}
          transform={'rotate(45deg) translate(4.5rem) translateY(-2rem)'}
          w={'15rem'}
          h={'2rem'}
          zIndex={3}
          top={0}
          overflowX={'hidden'}
          position={'absolute'}
          display={'flex'}
          justifyContent={'center'}
        >
          <Text
            letterSpacing={'0.195rem'}
            color={'#D26F12'}
            fontWeight={600}
            lineHeight={8}
            ml={5}
          >
            WINNER
          </Text>
        </Box>
      </VStack>
    </>
  );
};
