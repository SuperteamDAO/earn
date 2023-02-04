import {
  Box,
  Button,
  Container,
  Divider,
  Flex,
  HStack,
  Image,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Text,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { createUser } from '../../utils/functions';
import Avatar from 'boring-avatars';
import { truncatedPublicKey } from '../../utils/helpers';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';

export const Navbar = () => {
  const router = useRouter();
  const { connected, publicKey } = useWallet();
  useEffect(() => {
    const makeUser = async () => {
      if (publicKey) {
        const res = await createUser(publicKey.toBase58() as string);
        console.log(res);
      }
    };
    makeUser();
  }, [publicKey]);
  return (
    <>
      <Container
        maxW={'full'}
        p={{ xs: 10, md: 0 }}
        h={14}
        position={'absolute'}
        zIndex={10}
        top={0}
        bg={'#F1F5F9'}
        borderBottom={'1px solid rgba(255, 255, 255, 0.15)'}
        sx={{
          backdropFilter: 'blur(10px)',
          margin: '0px !important',
          marginTop: '0px !important',
        }}
      >
        <Flex
          align={'center'}
          justify={'space-between'}
          h={'full'}
          maxW={['4xl', '5xl', '6xl', '7xl', '8xl']}
          mx="auto"
        >
          <Box cursor={'pointer'} onClick={() => router.push('/')}>
            <Image src={'/assets/logo/logo.png'} alt={'logo'} />
          </Box>
          <Box>
            {!connected ? (
              <Button
                _hover={{ bg: '#6562FF' }}
                color={'white'}
                h={10}
                px={10}
                bg={'#6562FF'}
                onClick={() => {
                  router.push('/new');
                }}
              >
                Connect wallet
              </Button>
            ) : (
              <HStack gap={2}>
                <Divider
                  borderColor={'gray.300'}
                  h={14}
                  orientation={'vertical'}
                />

                <Menu>
                  <MenuButton>
                    <HStack>
                      <Avatar
                        variant="marble"
                        colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                      />
                      <Flex gap={5} justify={'space-between'} align={'center'}>
                        <Text
                          color={'gray.600'}
                          fontWeight={600}
                          fontFamily={'Inter'}
                        >
                          {truncatedPublicKey(
                            publicKey?.toString() as string,
                            7
                          )}
                        </Text>
                        <MdOutlineKeyboardArrowDown />
                      </Flex>
                    </HStack>
                  </MenuButton>
                  <MenuList w={'15rem'}>
                    <MenuItem onClick={() => {}}>
                      <Text fontSize="0.9rem" color="gray.600">
                        View Profile
                      </Text>
                    </MenuItem>
                  </MenuList>
                </Menu>
              </HStack>
            )}
          </Box>
        </Flex>
      </Container>
    </>
  );
};
