import { Alert, AlertIcon, Button, Link } from '@chakra-ui/react';

export function TalentButton({
  showMessage,
  isLoading,
  checkTalent,
}: {
  showMessage?: boolean;
  isLoading?: boolean;
  checkTalent: () => void;
}) {
  return (
    <>
      {!!showMessage && (
        <Alert mb={4} status="warning">
          <AlertIcon />
          Please log in to continue!
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
          onClick={() => checkTalent()}
          rounded="4px"
        >
          以人才贡献身份 {'->'}
        </Button>
      </Link>
    </>
  );
}
