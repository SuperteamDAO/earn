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
  ModalHeader,
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
    'http://localhost:3000/listings' + slug
  );
  const router = useRouter();
  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent py={5} h={'max'}>
          <VStack gap={4} px={10}>
            <Box>
              <Image w={14} src={'/assets/icons/cong.svg'} alt={'Cong Svg'} />
            </Box>
            <Text color={'gray.700'} fontWeight={600} fontFamily={'Inter'}>
              You Have Successfully Created A Listing
            </Text>
            <InputGroup mt={5}>
              <Input
                fontSize="1rem"
                color="gray.400"
                textOverflow="ellipsis"
                overflow="hidden"
                whiteSpace="nowrap"
                focusBorderColor="#CFD2D7"
                fontWeight={500}
                value={'http://localhost:3000/listings' + slug}
                isReadOnly
              />
              <InputRightElement h="100%" marginRight="1rem">
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
                bg={'#6562FF'}
                color={'white'}
                fontSize="1rem"
                fontWeight={600}
                _hover={{ bg: '#6562FF' }}
                onClick={() => {
                  router.push(`/listings` + slug);
                }}
              >
                Continue with Listings
              </Button>
              <Button
                w="100%"
                fontSize="1rem"
                fontWeight={600}
                color="gray.500"
                border="1px solid"
                borderColor="gray.200"
                bg="transparent"
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
