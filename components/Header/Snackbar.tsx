import { Box, Text, useMediaQuery } from '@chakra-ui/react';

const Snackbar = () => {
  const [isLessThan600] = useMediaQuery('(max-width: 600px)');

  if (!isLessThan600) return null;

  return (
    <Box w="full" p={3} color="white" bgColor="brand.purple">
      <Text fontSize="xs" textAlign="center">
        Note: Superteam Earn is not fully supported on mobile yet. Use laptop /
        desktop for a better experience!
      </Text>
    </Box>
  );
};

export default Snackbar;
