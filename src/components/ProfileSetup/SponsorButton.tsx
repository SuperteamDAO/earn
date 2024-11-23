import { Alert, AlertIcon, Button } from '@chakra-ui/react';

export function SponsorButton({
  showMessage,
  isLoading,
  checkSponsor,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkSponsor: () => void;
}) {
  return (
    <>
      {!!showMessage && (
        <Alert mb={4} status="warning">
          <AlertIcon />
          Please log in to continue!
        </Alert>
      )}
      <Button
        w={'full'}
        h={12}
        color={'white'}
        bg={'brand.slate.900'}
        _hover={{ bg: 'brand.slate.700' }}
        isLoading={!!isLoading}
        loadingText=""
        onClick={() => checkSponsor()}
        rounded="4px"
      >
        以项目方身份贡献 {'->'}
      </Button>
    </>
  );
}
