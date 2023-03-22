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
}
export const SubmissionSuccess = ({ isOpen, onClose }: Props) => {
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
              {`We can't wait to see what you've created! Winners will receive prizes as well as instant admission to our DAO.`}
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
