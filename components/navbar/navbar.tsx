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
import { userStore } from '../../store/user';

export const Navbar = () => {
  const { setUserInfo } = userStore();
  const router = useRouter();
  const { connected, publicKey, wallet } = useWallet();
  useEffect(() => {
    const makeUser = async () => {
      console.log(publicKey, connected);

      if (publicKey && connected) {
        const res = await createUser(publicKey.toBase58() as string);
        setUserInfo(res.data);
      }
    };
    makeUser();
  }, [publicKey, connected]);
  const onDisconnectWallet = async () => {
    if (wallet == null) {
      return;
    }
    await wallet.adapter.disconnect();
  };
  return (
    <>
      <Container
        maxW={'full'}
        p={{ xs: 10, md: 0 }}
        h={12}
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
          px={6}
          align={'center'}
          justify={'space-between'}
          h={'full'}
          mx="auto"
        >
          <Box cursor={'pointer'} onClick={() => router.push('/')}>
            <Image w={'12rem'} src={'/assets/logo/logo.png'} alt={'logo'} />
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
                    <MenuItem
                      onClick={() => {
                        router.push('/dashboard/team');
                      }}
                    >
                      <Text fontSize="0.9rem" color="gray.600">
                        Dashboard
                      </Text>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        onDisconnectWallet();
                      }}
                    >
                      <Text fontSize="0.9rem" color="gray.600">
                        Disconnect
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
