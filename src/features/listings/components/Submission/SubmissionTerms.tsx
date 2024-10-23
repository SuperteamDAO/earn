import {
  Button,
  Center,
  Divider,
  HStack,
  Link,
  ListItem,
  Modal,
  ModalContent,
  ModalOverlay,
  Text,
  UnorderedList,
  VStack,
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';

import { TERMS_OF_USE } from '@/constants';

export const SubmissionTerms = ({
  isOpen,
  onClose,
  sponsorName,
  entityName,
}: {
  isOpen: boolean;
  onClose: () => void;
  sponsorName: string;
  entityName?: string;
}) => {
  const { t } = useTranslation('common');

  return (
    <Modal
      autoFocus={false}
      closeOnEsc={false}
      closeOnOverlayClick={false}
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
    >
      <ModalOverlay />
      <ModalContent overflow="hidden" rounded="lg">
        <HStack gap={5} px={5} py={4}>
          <Center p={3} bg="brand.slate.200" rounded="full">
            <svg
              width="32"
              height="32"
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
          <Text align="start" fontSize="xl" fontWeight={600} lineHeight={1}>
            {t('SubmissionModal.termsOfUse')}
          </Text>
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
          <UnorderedList>
            <ListItem>
              {t('SubmissionModal.acknowledgement', {
                entityName,
                sponsorName,
              })}
            </ListItem>
            <ListItem>{t('SubmissionModal.SolarEarnRole')}</ListItem>
            <ListItem>{t('SubmissionModal.SolarEarnLiability')}</ListItem>
            <ListItem>{t('SubmissionModal.userParticipationRisk')}</ListItem>
            <ListItem>{t('SubmissionModal.disputeResolution')}</ListItem>
            <ListItem>{t('SubmissionModal.releaseOfLiability')}</ListItem>
            <ListItem>{t('SubmissionModal.noGuarantee')}</ListItem>
            <ListItem>{t('SubmissionModal.partnerIndemnification')}</ListItem>
          </UnorderedList>
          <Text as={'p'} lineHeight={1.25}>
            {t('SubmissionModal.additionalTerms')}
            <Link
              textDecoration={'underline'}
              href={TERMS_OF_USE}
              rel="noopener noreferrer"
              target="_blank"
              textUnderlineOffset={2}
            >
              {t('SubmissionModal.termsOfUseLink')}
            </Link>
            .
          </Text>
          <Button ml="auto" px={10} fontSize="lg" onClick={onClose}>
            {t('SubmissionModal.done')}
          </Button>
        </VStack>
      </ModalContent>
    </Modal>
  );
};
