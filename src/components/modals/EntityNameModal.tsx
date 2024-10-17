/* eslint-disable react/no-unescaped-entities */
import {
  Button,
  HStack,
  Input,
  Link,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useState } from 'react';
import { Trans, useTranslation } from 'react-i18next';

import { PDTG, TERMS_OF_USE } from '@/constants';
import { useUser } from '@/store/user';

export const EntityNameModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const [entityName, setEntityName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const { t } = useTranslation('common');

  const { user, refetchUser } = useUser();
  if (!user?.currentSponsor?.id) return null;

  const setDBEntityName = async () => {
    setLoading(true);
    try {
      if (user.currentSponsor) {
        await axios.post('/api/sponsors/edit', {
          entityName,
        });
        await refetchUser();
        onClose();
      }
    } catch (e) {
      console.log('unable to set entity name ', e);
      setError(true);
    }
    setLoading(false);
  };

  return (
    <Modal
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
    >
      <ModalOverlay />
      <ModalContent gap={6} overflow="hidden" p={6} rounded="lg">
        <VStack align="start">
          <Text fontSize="lg" fontWeight={500}>
            {t('entityNameModal.title')}
          </Text>
          <Text color="brand.slate.400" fontSize="sm">
            <Trans i18nKey="entityNameModal.description" ns="common">
              In accordance with our updated{' '}
              <Link
                textDecoration={'underline'}
                href={TERMS_OF_USE}
                rel="noopener noreferrer"
                target="_blank"
                textUnderlineOffset={2}
              >
                Terms of Use
              </Link>
              , we need to know the name of the entity that controls your
              project. If you are a DAO, please mention the name of your DAO. If
              you don't have an entity, please mention your full name.
            </Trans>
          </Text>
        </VStack>
        <Input
          onChange={(e) => setEntityName(e.target.value)}
          placeholder={t('entityNameModal.inputPlaceholder')}
          value={entityName}
        />
        <HStack>
          <Link
            as={NextLink}
            w="full"
            href={PDTG}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Button w="full" variant="outline">
              {t('entityNameModal.needHelp')}
            </Button>
          </Link>
          <Button w="full" isLoading={loading} onClick={setDBEntityName}>
            {t('entityNameModal.update')}
          </Button>
        </HStack>
        {error && (
          <Text color="red" textAlign="center">
            {t('entityNameModal.error')}
          </Text>
        )}
      </ModalContent>
    </Modal>
  );
};
