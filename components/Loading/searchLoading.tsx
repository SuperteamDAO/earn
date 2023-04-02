import { Center, HStack } from '@chakra-ui/react';
import { Player } from '@lottiefiles/react-lottie-player';

const SearchLoading = () => {
  return (
    <>
      <Center h={'12rem'} w={['full', 'full', '50rem', '50rem']}>
        <HStack
          gap="0.1rem"
          padding="1rem"
          bg="white"
          m="1rem"
          maxW="fit-content"
          rounded="6px"
          alignItems={'center'}
          justify="center"
        >
          <Player
            style={{ height: '300px', width: '300px' }}
            autoplay
            loop
            src={
              'https://assets4.lottiefiles.com/private_files/lf30_fup2uejx.json'
            }
          ></Player>
        </HStack>
      </Center>
    </>
  );
};

export default SearchLoading;
