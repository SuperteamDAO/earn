import { CloseIcon } from '@chakra-ui/icons';
import {
  AbsoluteCenter,
  Box,
  Container,
  Modal,
  ModalCloseButton,
  ModalContent,
  Text,
} from '@chakra-ui/react';
import Image from 'next/image';
import Pride from 'react-canvas-confetti/dist/presets/pride';
import { type TDecorateOptionsFn } from 'react-canvas-confetti/dist/types';

import { ExternalImage } from '@/components/ui/cloudinary-image';
import { ASSET_URL } from '@/constants/ASSET_URL';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isProject: boolean;
}

const decorateOptions: TDecorateOptionsFn = (options) => {
  const colors = [
    '#E63946',
    '#F1FAEE',
    '##A8DADC',
    '#457B9D',
    '#1D3557',
    '#F4A261',
    '#E9C46A',
    '#2A9D8F',
    '#FF5733',
    '#FF2400',
    '#FFC0CB',
  ];
  const selectedColors: string[] = [];

  while (selectedColors.length < 5) {
    const randomIndex = Math.floor(Math.random() * colors.length);
    const color = colors[randomIndex];
    if (!selectedColors.includes(color!)) {
      selectedColors.push(color!);
    }
  }

  return {
    ...options,
    particleCount: 20,
    colors: selectedColors,
  };
};

export const EasterEgg = ({ isOpen, onClose, isProject }: Props) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent
        pos="fixed"
        top="0"
        left="0"
        w="100vw"
        maxW="none"
        h="100vh"
        mt="0"
        mb="0"
        bg="#5243FF"
        borderRadius={0}
      >
        <Pride autorun={{ speed: 10 }} decorateOptions={decorateOptions} />
        <ModalCloseButton w={6} h={6} m={4} color="white">
          <CloseIcon width={4} height={4} />
        </ModalCloseButton>
        <Container mt={[28, 6]} px={4}>
          <Box w="112px" mx="auto" mt="24px" mb="44px">
            <ExternalImage
              src={'/icons/celebration.png'}
              alt="celebration icon"
              className="h-100 w-100"
            />
          </Box>
          <Text
            color="white"
            fontSize={[42, 58]}
            fontWeight={500}
            lineHeight="1"
            textAlign="center"
          >
            {isProject ? 'Application' : 'Submission'} Received!
          </Text>
          <Text
            mt={[8, 5]}
            color="white"
            fontSize={[38, 48]}
            lineHeight="1"
            textAlign="center"
            opacity="0.6"
          >
            Sending some vibes your way 💃 💃
          </Text>
        </Container>
        <AbsoluteCenter
          bottom="0"
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
            src={ASSET_URL + '/memes/JohnCenaVibingToCupid.gif'}
            alt="John Cena Vibing to Cupid"
            style={{ width: '100%', marginTop: 'auto', display: 'block' }}
            width="1000"
            height="1200"
            priority
            loading="eager"
            quality={80}
            className="scale-125"
          />
        </AbsoluteCenter>
        <audio
          src={'/assets/JohnCenaVibingToCupid.mp3'}
          style={{ display: 'none' }}
          autoPlay
          loop
        />
      </ModalContent>
    </Modal>
  );
};
