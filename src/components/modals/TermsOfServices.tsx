import {
  Button,
  Center,
  Divider,
  HStack,
  Link,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import dayjs from 'dayjs';

export const TermsOfServices = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const updatedAt = dayjs(process.env.NEXT_PUBLIC_TOS_DATE);
  const formattedDate = updatedAt.format('MMMM D, YYYY');

  return (
    <Modal
      autoFocus={false}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
    >
      <ModalOverlay />
      <ModalContent overflow="hidden" rounded="lg">
        <HStack gap={5} px={5} py={4}>
          <Center p={3} bg="brand.slate.200" rounded="full">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 31"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14.9998 0.666748H2.99977C2.20412 0.666748 1.44106 0.982818 0.878451 1.54543C0.315841 2.10804 -0.000228882 2.8711 -0.000228882 3.66675V27.6667C-0.000228882 28.4624 0.315841 29.2255 0.878451 29.7881C1.44106 30.3507 2.20412 30.6667 2.99977 30.6667H20.9998C21.7954 30.6667 22.5585 30.3507 23.1211 29.7881C23.6837 29.2255 23.9998 28.4624 23.9998 27.6667V9.66675L14.9998 0.666748ZM20.9998 27.6667H2.99977V3.66675H13.4998V11.1667H20.9998V27.6667Z"
                fill="#4D55E4"
              />
            </svg>
          </Center>
          <VStack align="start" gap={0}>
            <Text fontSize="md" fontWeight={600} lineHeight={1}>
              Updated Terms of Use
            </Text>
            <Text color="brand.slate.400" fontSize="sm" fontWeight={500}>
              Updated on {formattedDate}
            </Text>
          </VStack>
        </HStack>
        <Divider borderBottomWidth={2} />
        <VStack
          align="start"
          gap={3}
          px={5}
          py={4}
          color="brand.slate.500"
          fontWeight={500}
          textAlign="left"
        >
          <Text as={'p'} lineHeight={1.25}>
            At Superteam Earn, we regularly review our policies to reflect how
            we serve our users. {"We're"} making updates to our Terms of Use
            that take effect on June 15, 2024.
          </Text>
          <Text as={'p'} lineHeight={1.25}>
            Here’s our updated{' '}
            <Link
              textDecoration={'underline'}
              href="https://drive.google.com/file/d/1hD5Qzm1CILkughA2LBDsfK1ndZpUBnb4/view?usp=sharing"
              rel="noopener noreferrer"
              target="_blank"
              textUnderlineOffset={2}
            >
              Terms of Use
            </Link>
            .
          </Text>
          <Text as={'p'} lineHeight={1.25}>
            By continuing to use Earn and its services on or after the effective
            date, you accept our updated{' '}
            <Link
              textDecoration={'underline'}
              href="https://drive.google.com/file/d/1hD5Qzm1CILkughA2LBDsfK1ndZpUBnb4/view?usp=sharing"
              rel="noopener noreferrer"
              target="_blank"
              textUnderlineOffset={2}
            >
              Terms of Use
            </Link>
            .
          </Text>
          <Button ml="auto" px={10} onClick={onClose}>
            I accept
          </Button>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
