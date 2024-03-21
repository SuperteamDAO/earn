import { CloseIcon } from '@chakra-ui/icons';
import {
  AbsoluteCenter,
  Container,
  Modal,
  ModalCloseButton,
  ModalContent,
  Text,
} from '@chakra-ui/react';
import { Box } from 'degen';
import Image from 'next/image';
import Confetti from 'react-confetti';
interface Props {
  isOpen: boolean;
  onClose: () => void;
}
export const EasterEgg = ({ isOpen, onClose }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent
        pos="fixed"
        top="0px"
        left="0px"
        w="100vw"
        maxW="none"
        h="100vh"
        mt="0"
        mb="0"
        bg="#5243FF"
      >
        <Confetti />
        <ModalCloseButton w="2rem" h="2rem" m="1rem" color="white">
          <CloseIcon width="1rem" height="1rem" />
        </ModalCloseButton>
        <Container mt={['112px', '24px']} px="16px">
          <Box
            width="112px"
            marginX="auto"
            marginTop="24px"
            marginBottom="44px"
          >
            <Image
              src="/assets/icons/celebration.png"
              alt="celebration icon"
              width="100"
              height="100"
            />
          </Box>
          <Text
            color="white"
            fontSize={['2.5rem', '3.5rem']}
            fontWeight={500}
            lineHeight="1"
            textAlign="center"
          >
            Submission Received
          </Text>
          <Text
            mt={['30px', '20px']}
            color="white"
            fontSize={['2.3rem', '3.3rem']}
            lineHeight="1"
            textAlign="center"
            opacity="0.6"
          >
            We have received your submission
          </Text>
        </Container>
        <AbsoluteCenter
          bottom="0px"
          alignItems="flex-end"
          flexDir="column"
          display="flex"
          w={['150%', '100%', '100%', '50%']}
          h="auto"
          mx="auto"
          mt="auto"
          transform="translate(-50%,0%)"
        >
          <Image
            src="/assets/memes/JohnCenaVibingToCupid.gif"
            alt="John Cena Vibing to Cupid"
            style={{ width: '100%', marginTop: 'auto', display: 'block' }}
            width="500"
            height="600"
          />
        </AbsoluteCenter>
        <audio
          src="/assets/memes/JohnCenaVibingToCupid.mp3"
          style={{ display: 'none' }}
          autoPlay
          loop
        />
      </ModalContent>
    </Modal>
  );
};
