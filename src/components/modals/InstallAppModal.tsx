import {
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import Image from 'next/image';
import { type UserAgent } from 'next-useragent';
import { BsThreeDotsVertical } from 'react-icons/bs';
import { MdIosShare, MdOutlineInstallMobile } from 'react-icons/md';

const ManualInstructions = () => {
  return (
    <Box mb={8} py={2} borderRadius={4} bgColor={'brand.slate.100'}>
      <Text align={'center'}>
        Tap these icons ({' '}
        <Icon as={MdIosShare} mr={1} color={'brand.purple'} fontWeight={600} />
        or <Icon as={BsThreeDotsVertical} color={'brand.purple'} />) and select
        the “Add to home screen” option.
      </Text>
    </Box>
  );
};

export const InstallAppModal = ({
  isOpen,
  onClose,
  installApp,
  deviceInfo,
}: {
  isOpen: boolean;
  onClose: () => void;
  installApp: () => void;
  deviceInfo: UserAgent;
}) => {
  const { os } = deviceInfo;

  const isAutoInstallable = () => {
    if (os === 'iOS') {
      return false;
    }

    return true;
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent alignSelf="flex-end" mb={0}>
          <ModalHeader
            borderBottom={'1px'}
            borderBottomColor={'brand.slate.300'}
          >
            <HStack>
              <Icon as={MdOutlineInstallMobile} color={'brand.slate.500'} />
              <Text fontSize={'lg'}>Install Earn</Text>
            </HStack>
          </ModalHeader>
          <ModalCloseButton mt={{ base: 2, md: 3 }} />
          <ModalBody>
            <VStack alignItems={'center'} my={4}>
              <Flex align={'center'} direction={'column'} mt={10}>
                <Image
                  src={'/android-chrome-512x512.png'}
                  alt="Superteam Earn Icon"
                  height={63}
                  width={63}
                />
                <Flex align={'center'} direction={'column'} my={12}>
                  <Text fontWeight={700}>Never miss a listing again!</Text>
                  <Text
                    w={'75%'}
                    mt={1}
                    color="brand.slate.500"
                    textAlign={'center'}
                  >
                    Add Earn to your homescreen and always stay updated.
                  </Text>
                </Flex>
                {isAutoInstallable() ? (
                  <Button w={'full'} mt={4} onClick={() => installApp()}>
                    Add to Homescreen
                  </Button>
                ) : (
                  <ManualInstructions />
                )}
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};
