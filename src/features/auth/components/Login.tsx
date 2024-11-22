import { Box, Modal, ModalContent, ModalOverlay, Text } from '@chakra-ui/react';

import { SignIn } from './SignIn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSponsor?: boolean;
}
export const Login = ({ isOpen, onClose, isSponsor = false }: Props) => {
  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent w={'23rem'} h={'max'} pt={2}>
        <Box py={6}>
          <Text
            color="brand.slate.900"
            fontSize={18}
            fontWeight={600}
            textAlign={'center'}
          >
            只需一步
          </Text>
          <Text
            color="brand.slate.600"
            fontSize={15}
            fontWeight={400}
            textAlign={'center'}
          >
            {isSponsor ? '加入Solar Earn' : '立即注册'}
          </Text>
        </Box>
        <SignIn />
      </ModalContent>
    </Modal>
  );
};
