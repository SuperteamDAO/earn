import {
  Box,
  Button,
  HStack,
  Image,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import React from 'react';
import { createSubscription } from '../../utils/functions';
interface Props {
  onClose: () => void;
  isOpen: boolean;
}
export const CreateProfileModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter();

  return (
    <>
      <Modal size={'sm'} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent p={5} h={'max'}>
          <Box bg={'#F0E4FF'} w={'full'} h={36} rounded={'lg'}></Box>
          <VStack gap={5} align={'center'} mt={5}>
            <Text color={'#000000'} fontSize={'1.1rem'} fontWeight={600}>
              Create a profile to continue
            </Text>
            <VStack>
              <HStack gap={2}>
                <Image src={'/assets/icons/purple-tick.svg'} alt={'tick'} />
                <Text fontSize={'1rem'} fontWeight={500} color={'gray.700'}>
                  Port Finance aims to provide a whole suite of money market{' '}
                </Text>
              </HStack>
              <HStack gap={2}>
                <Image src={'/assets/icons/purple-tick.svg'} alt={'tick'} />
                <Text fontSize={'1rem'} fontWeight={500} color={'gray.700'}>
                  Port Finance aims to provide a whole suite of money market{' '}
                </Text>
              </HStack>
            </VStack>
            <Button
              onClick={() => {
                router.push('/new/talent');
              }}
              color={'white'}
              w={'full'}
              bg={'#6562FF'}
            >
              Create Now
            </Button>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
