import { Alert, AlertIcon, Button, Link } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function TalentButton({
  showMessage,
  isLoading,
  checkTalent,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkTalent: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <>
      {!!showMessage && (
        <Alert mb={4} status="warning">
          <AlertIcon />
          {t('talentButton.loginMessage')}
        </Alert>
      )}
      <Link>
        <Button
          w={'full'}
          h={12}
          color={'white'}
          bg={'brand.purple.dark'}
          _hover={{ bg: 'brand.purple' }}
          isLoading={!!isLoading}
          loadingText={t('talentButton.loadingText')}
          onClick={() => checkTalent()}
          rounded="4px"
        >
          {t('talentButton.buttonText')}
        </Button>
      </Link>
    </>
  );
}
