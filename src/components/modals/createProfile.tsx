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
import { useRouter } from 'next/router';

interface Props {
  onClose: () => void;
  isOpen: boolean;
}
export const CreateProfileModal = ({ isOpen, onClose }: Props) => {
  const router = useRouter();

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} size={'sm'}>
        <ModalOverlay />
        <ModalContent h={'max'} p={5}>
          <Box w={'full'} h={36} bg={'#F0E4FF'} rounded={'lg'}></Box>
          <VStack align={'center'} gap={5} mt={5}>
            <Text color={'#000000'} fontSize={'1.1rem'} fontWeight={600}>
              Ready to Get Involved?
            </Text>
            <VStack>
              <HStack gap={2}>
                <Image alt={'tick'} src={'/assets/icons/purple-tick.svg'} />
                <Text color={'gray.700'} fontSize={'1rem'} fontWeight={500}>
                  Create a profile to leave comments, get personalized
                  notifications
                </Text>
              </HStack>
              <HStack gap={2}>
                <Image alt={'tick'} src={'/assets/icons/purple-tick.svg'} />
                <Text color={'gray.700'} fontSize={'1rem'} fontWeight={500}>
                  Get access to exclusive earning opportunities. It takes 2
                  minutes and is entirely free.
                </Text>
              </HStack>
            </VStack>
            <Button
              w={'full'}
              color={'white'}
              bg={'#6562FF'}
              onClick={() => {
                router.push('/new/talent');
              }}
            >
              Create Your Profile
            </Button>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
