import { Box, Text } from '@chakra-ui/react';
import { atom } from 'jotai';
import { useRouter } from 'next/router';

export const bountySnackbarAtom = atom(null);

export const BountySnackbar = () => {
  const router = useRouter();
  // const [bountySnackbar, setBountySnackbar] = useAtom(bountySnackbarAtom);

  const { pathname } = router;

  const showSnackbar = /^\/listings\/bounties\/[^/]+$/.test(pathname);

  if (showSnackbar) {
    return (
      <Box w="full" p={3} color="white" bgColor="brand.purple">
        <Text fontSize="xs" textAlign="center">
          Note: Superteam Earn is not fully supported on mobile yet. Use laptop
          / desktop for a better experience!
        </Text>
      </Box>
    );
  }
  return null;
};
