import {
  Box,
  Button,
  Image,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';

import { Confetti } from '../misc/confetti';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  eligibility: string;
}
export const SubmissionSuccess = ({ isOpen, onClose, eligibility }: Props) => {
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={'xxl'}>
        <ModalOverlay>
          <Confetti />
        </ModalOverlay>
        <ModalContent w={'40rem'} h={'35rem'}>
          <VStack align={'center'} gap={3} w={'full'} h={'full'} px={10}>
            <Box w={'25rem'} mt={20}>
              <Image
                w={'full'}
                h={'full'}
                objectFit={'cover'}
                alt={'Success'}
                src={'/assets/bg/success-icon.svg'}
              />
            </Box>
            <Text color={'#1E293B'} fontSize={'1.4rem'} fontWeight={600}>
              Successfully Submitted
            </Text>
            <Text
              color={'#1E293B'}
              fontSize={'1rem'}
              fontWeight={500}
              textAlign={'center'}
            >
              {eligibility === 'premission-less'
                ? 'Thanks for the submission! The sponsors will review your listing submission and choose a winner soon - we will notify you as soon as they do so!'
                : 'Thanks for the submission! The sponsors will review your application and announce a winner soon - we will notify you as soon as they do so!'}
            </Text>
            <Button
              w={'full'}
              h={12}
              mx={10}
              color={'white'}
              bg={'#6562FF'}
              onClick={onClose}
            >
              Continue
            </Button>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
