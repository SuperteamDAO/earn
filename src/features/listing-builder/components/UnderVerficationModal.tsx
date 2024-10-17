import {
  Button,
  Center,
  Link,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import NextLink from 'next/link';

interface Props {
  onClose: () => void;
  isOpen: boolean;
}
export function UnderVerificationModal({ onClose, isOpen }: Props) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <ModalOverlay />
      <ModalContent overflow="hidden" w="100%" h={'max'} rounded="lg">
        <ModalHeader>
          <VStack mt={4}>
            <Center p={8} bg="#EFF6FF" rounded="full">
              <svg
                width="73"
                height="73"
                viewBox="0 0 73 73"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M26.1584 68.4375L20.3792 58.7042L9.42925 56.2708L10.4938 45.0167L3.04175 36.5L10.4938 27.9833L9.42925 16.7292L20.3792 14.2958L26.1584 4.5625L36.5001 8.97292L46.8417 4.5625L52.6209 14.2958L63.5709 16.7292L62.5063 27.9833L69.9584 36.5L62.5063 45.0167L63.5709 56.2708L52.6209 58.7042L46.8417 68.4375L36.5001 64.0271L26.1584 68.4375ZM33.3063 47.2979L50.4917 30.1125L46.2334 25.7021L33.3063 38.6292L26.7667 32.2417L22.5084 36.5L33.3063 47.2979Z"
                  fill="#2563EB"
                />
              </svg>
            </Center>
          </VStack>
        </ModalHeader>
        <ModalBody>
          <VStack gap={3}>
            <Text fontSize="lg" fontWeight={600}>
              We need to verify your listing before it gets published
            </Text>
            <Text color="brand.slate.500">
              {`It's important for us to verify certain work opportunities to maintain trust, and keep the platform free of any bad actors. We will try our best to verify your listing within 24 hours. `}
            </Text>
            <Text color="brand.slate.500">
              {`Once verified, your listing will be published automatically. If we need any information, we will get in touch with you. `}
            </Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Link as={NextLink} w="full" href="/dashboard/listings">
            <Button w="full" py={5}>
              Understood
            </Button>
          </Link>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
