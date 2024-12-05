import {
  Button,
  Input,
  Link,
  Modal,
  ModalContent,
  ModalOverlay,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import NextLink from 'next/link';
import { useState } from 'react';

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

  const { user, refetchUser } = useUser();
  if (!user?.currentSponsor?.id) return null;

  const setDBEntityName = async () => {
    setLoading(true);
    try {
      if (user.currentSponsor) {
        await axios.post('/api/sponsors/update-entity-name', {
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
          <p className="text-lg font-medium">Update Your Entity Name</p>
          <p className="text-sm text-slate-400">
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
            , we need to know the name of the entity that controls your project.
            If you are a DAO, please mention the name of your DAO. If you{' '}
            {"don't "}
            have an entity, please mention your full name.
          </p>
        </VStack>
        <Input
          onChange={(e) => setEntityName(e.target.value)}
          placeholder="Entity Name"
          value={entityName}
        />
        <div className="flex gap-2">
          <Link
            as={NextLink}
            w="full"
            href={PDTG}
            rel="noopener noreferrer"
            target="_blank"
          >
            <Button w="full" variant="outline">
              Need Help?
            </Button>
          </Link>
          <Button w="full" isLoading={loading} onClick={setDBEntityName}>
            Update
          </Button>
        </div>
        {error && (
          <p className="text-center text-red-500">
            Some Error occurred, please try again later
          </p>
        )}
      </ModalContent>
    </Modal>
  );
};
