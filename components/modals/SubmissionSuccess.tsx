import {
  Box,
  Button,
  Image,
  Modal,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import React from 'react';
import { Confetti } from '../misc/confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eligibility: string;
}
export const SubmissionSuccess = ({ isOpen, onClose, eligibility }: Props) => {
  return (
    <>
      <Modal size={'xxl'} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay>
          <Confetti />
        </ModalOverlay>
        <ModalContent w={'40rem'} h={'35rem'}>
          <VStack px={10} w={'full'} h={'full'} gap={3} align={'center'}>
            <Box mt={20} w={'25rem'}>
              <Image
                w={'full'}
                h={'full'}
                objectFit={'cover'}
                src={'/assets/bg/success-icon.svg'}
                alt={'Success'}
              />
            </Box>
            <Text color={'#1E293B'} fontWeight={600} fontSize={'1.4rem'}>
              Successfully Submitted
            </Text>
            <Text
              color={'#1E293B'}
              textAlign={'center'}
              fontWeight={500}
              fontSize={'1rem'}
            >
              {eligibility === 'premission-less'
                ? 'Thanks for the submission! The sponsors will review your listing submission and choose a winner soon - we will notify you as soon as they do so!'
                : 'Thanks for the submission! The sponsors will review your application and announce a winner soon - we will notify you as soon as they do so!'}
            </Text>
            <Button
              onClick={onClose}
              bg={'#6562FF'}
              mx={10}
              w={'full'}
              h={12}
              color={'white'}
            >
              Continue
            </Button>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
