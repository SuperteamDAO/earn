import { CheckIcon, CopyIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Image,
  Input,
  InputGroup,
  InputRightElement,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  useClipboard,
  VStack,
} from '@chakra-ui/react';
import { useRouter } from 'next/router';
import React from 'react';

interface Props {
  onClose: () => void;
  isOpen: boolean;
  slug: string;
}
export const SuccessListings = ({ isOpen, onClose, slug }: Props) => {
  const { hasCopied, onCopy } = useClipboard(
    `http://localhost:3000/listings${slug}`
  );
  const router = useRouter();
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent h={'max'} py={5}>
          <VStack gap={4} px={10}>
            <Box>
              <Image w={14} alt={'Cong Svg'} src={'/assets/icons/cong.svg'} />
            </Box>
            <Text color={'gray.700'} fontFamily={'Inter'} fontWeight={600}>
              You Have Successfully Created A Listing
            </Text>
            <InputGroup mt={5}>
              <Input
                overflow="hidden"
                color="gray.400"
                fontSize="1rem"
                fontWeight={500}
                whiteSpace="nowrap"
                textOverflow="ellipsis"
                focusBorderColor="#CFD2D7"
                isReadOnly
                value={`http://localhost:3000/listings${slug}`}
              />
              <InputRightElement h="100%" mr="1rem">
                {hasCopied ? (
                  <CheckIcon h="1.3rem" w="1.3rem" color="gray.200" />
                ) : (
                  <CopyIcon
                    onClick={onCopy}
                    cursor="pointer"
                    h="1.3rem"
                    w="1.3rem"
                    color="gray.200"
                  />
                )}
              </InputRightElement>
            </InputGroup>
            <VStack w={'full'}>
              <Button
                w="100%"
                color={'white'}
                fontSize="1rem"
                fontWeight={600}
                bg={'#6562FF'}
                _hover={{ bg: '#6562FF' }}
                onClick={() => {
                  router.push(`/listings${slug}`);
                }}
              >
                Continue with Listings
              </Button>
              <Button
                w="100%"
                color="gray.500"
                fontSize="1rem"
                fontWeight={600}
                bg="transparent"
                border="1px solid"
                borderColor="gray.200"
                onClick={() => {
                  router.push('/dashboard/listings');
                }}
              >
                Listing Dashboard
              </Button>
            </VStack>
          </VStack>
        </ModalContent>
      </Modal>
    </>
  );
};
