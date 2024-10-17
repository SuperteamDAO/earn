import { ArrowBackIcon } from '@chakra-ui/icons';
import { Box, Modal, ModalContent, ModalOverlay, Text } from '@chakra-ui/react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { SignIn } from './SignIn';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isSponsor?: boolean;
}

export const Login = ({ isOpen, onClose, isSponsor = false }: Props) => {
  const [loginStep, setLoginStep] = useState(0);
  const { t } = useTranslation('common');

  return (
    <Modal isCentered isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent w={'23rem'} h={'max'} pt={2}>
        <Box py={6}>
          {loginStep === 1 && (
            <ArrowBackIcon
              ml={5}
              h={5}
              w={5}
              color={'brand.slate.500'}
              onClick={() => setLoginStep(0)}
              cursor="pointer"
            />
          )}
          <Text
            color="brand.slate.900"
            fontSize={18}
            fontWeight={600}
            textAlign={'center'}
          >
            {t('login.oneStepAway')}
          </Text>
          <Text
            color="brand.slate.600"
            fontSize={15}
            fontWeight={400}
            textAlign={'center'}
          >
            {isSponsor
              ? t('login.joiningSuperteamEarn')
              : t('login.earningGlobalStandards')}
          </Text>
        </Box>
        <SignIn loginStep={loginStep} setLoginStep={setLoginStep} />
      </ModalContent>
    </Modal>
  );
};
