import { Center, HStack } from '@chakra-ui/react';
import { Player } from '@lottiefiles/react-lottie-player';

const SearchLoading = () => {
  return (
    <>
      <Center w={['full', 'full', '50rem', '50rem']} h={'12rem'}>
        <HStack
          alignItems={'center'}
          justify="center"
          gap="0.1rem"
          maxW="fit-content"
          m="1rem"
          p="1rem"
          bg="white"
          rounded="6px"
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
