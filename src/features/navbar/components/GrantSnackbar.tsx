import { HStack, Text } from '@chakra-ui/react';
import { atom, useAtom } from 'jotai';
import { useRouter } from 'next/router';

type GrantSnackbarType = {
  isPublished: boolean;
};

export const grantSnackbarAtom = atom<GrantSnackbarType | null>(null);

export const GrantSnackbar = () => {
  const router = useRouter();
  const [grantSnackbar] = useAtom(grantSnackbarAtom);

  const { asPath } = router;

  const showSnackbar =
    asPath.split('/')[1] === 'grants' && !!asPath.split('/')[2];

  if (!grantSnackbar) return null;

  const { isPublished } = grantSnackbar;

  const getBackgroundColor = () => {
    if (!isPublished) return '#DC4830';
    return '#B869D3';
  };

  const getSnackbarMessage = (): string | null => {
    if (!isPublished)
      return 'This Grant Is Inactive Right Now. Check Out Other Grants on Our Homepage!';

    return null;
  };

  const message = getSnackbarMessage();
  const bgColor = getBackgroundColor();

  if (showSnackbar && grantSnackbar && message) {
    return (
      <HStack justify="center" gap={1} w="full" color="white" bgColor={bgColor}>
        <Text
          p={3}
          fontSize={{ base: 'xs', md: 'sm' }}
          fontWeight={500}
          textAlign="center"
        >
          {message}
        </Text>
      </HStack>
    );
  }
  return null;
};
