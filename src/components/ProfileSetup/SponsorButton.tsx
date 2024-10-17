import { Alert, AlertIcon, Button } from '@chakra-ui/react';
import { useTranslation } from 'react-i18next';

export function SponsorButton({
  showMessage,
  isLoading,
  checkSponsor,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkSponsor: () => void;
}) {
  const { t } = useTranslation('common');

  return (
    <>
      {!!showMessage && (
        <Alert mb={4} status="warning">
          <AlertIcon />
          {t('sponsorButton.loginMessage')}
        </Alert>
      )}
      <Button
        w={'full'}
        h={12}
        color={'white'}
        bg={'brand.slate.900'}
        _hover={{ bg: 'brand.slate.700' }}
        isLoading={!!isLoading}
        loadingText={t('sponsorButton.loadingText')}
        onClick={() => checkSponsor()}
        rounded="4px"
      >
        {t('sponsorButton.buttonText')}
      </Button>
    </>
  );
}
