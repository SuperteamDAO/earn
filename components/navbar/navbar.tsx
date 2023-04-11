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
  Select,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import type { Wallet as SolanaWallet } from '@solana/wallet-adapter-react';
import { useWallet } from '@solana/wallet-adapter-react';
import Avatar from 'boring-avatars';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import toast from 'react-hot-toast';
import { MdOutlineKeyboardArrowDown } from 'react-icons/md';

import type { SponsorType } from '../../interface/sponsor';
import { TalentStore } from '../../store/talent';
import { userStore } from '../../store/user';
import { createUser, findTalentPubkey } from '../../utils/functions';
import { truncatedPublicKey } from '../../utils/helpers';
import { ConnectWalletModal } from '../modals/connectWalletModal';

interface Props {
  sponsors?: SponsorType[];
}
export const Navbar = ({ sponsors }: Props) => {
  const { setUserInfo } = userStore();
  const { setTalentInfo, talentInfo } = TalentStore();
  const router = useRouter();
  const { connected, publicKey, wallet, select } = useWallet();

  const findTalent = async () => {
    const talent = await findTalentPubkey(publicKey?.toBase58() as string);
    if (!talent) {
      return null;
    }
    return setTalentInfo(talent.data);
  };

  useEffect(() => {
    const makeUser = async () => {
      if (publicKey && connected) {
        const res = await createUser(publicKey.toBase58() as string);
        setUserInfo(res.data);
        if (res.data?.talent) {
          await findTalent();
        }
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
  const { isOpen, onOpen, onClose } = useDisclosure();
  // --
  const { userInfo } = userStore();

  const onConnectWallet = async (solanaWallet: SolanaWallet) => {
    try {
      // await connect();

      select(solanaWallet.adapter.name);
    } catch (e) {
      toast.error('Wallet not found');
    }
  };

  return (
    <>
      {(isOpen || !connected) && (
        <ConnectWalletModal
          onConnectWallet={onConnectWallet}
          isOpen={isOpen}
          onClose={onClose}
        />
      )}
      <Container
        sx={{
          backdropFilter: 'blur(10px)',
          margin: '0px !important',
          marginTop: '0px !important',
        }}
        pos={'absolute'}
        zIndex={10}
        top={0}
        maxW={'full'}
        h={12}
        p={{ xs: 10, md: 0 }}
        bg={'#F1F5F9'}
        borderBottom={'1px solid rgba(255, 255, 255, 0.15)'}
      >
        <Flex
          align={'center'}
          justify={'space-between'}
          h={'full'}
          mx="auto"
          px={6}
        >
          <HStack w={'full'}>
            <Box cursor={'pointer'} onClick={() => router.push('/')}>
              <Image w={'12rem'} alt={'logo'} src={'/assets/logo/logo.png'} />
            </Box>
            {sponsors && (
              <Select w={'12rem'}>
                {sponsors?.map((sponsor, index) => {
                  return (
                    <option key={sponsor.id} value={index}>
                      {sponsor.name}
                    </option>
                  );
                })}
              </Select>
            )}
          </HStack>
          <Box>
            {!connected ? (
              <Button
                h={10}
                px={10}
                color={'white'}
                bg={'#6562FF'}
                _hover={{ bg: '#6562FF' }}
                onClick={() => {
                  if (router.asPath === '/') {
                    router.push('/new');
                    return;
                  }
                  onOpen();
                }}
              >
                Connect wallet
              </Button>
            ) : (
              <HStack gap={2}>
                {userInfo?.sponsor && (
                  <Button
                    w="100%"
                    color="#6562FF"
                    fontSize="0.9rem"
                    fontWeight={600}
                    bg="transparent"
                    border="1px solid #6562FF"
                    onClick={() => {
                      router.push('/listings/create');
                    }}
                  >
                    Create a Listing
                  </Button>
                )}
                <Divider
                  h={12}
                  borderColor={'gray.300'}
                  orientation={'vertical'}
                />

                <Menu>
                  <MenuButton>
                    <HStack>
                      <Avatar
                        variant="marble"
                        colors={['#92A1C6', '#F0AB3D', '#C271B4']}
                      />
                      <Flex align={'center'} justify={'space-between'} gap={5}>
                        <Text
                          color={'gray.600'}
                          fontFamily={'Inter'}
                          fontWeight={600}
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
                    <MenuItem
                      isDisabled={!talentInfo?.username}
                      onClick={() => router.push(`/t/${talentInfo?.username}`)}
                    >
                      <Text color="gray.600" fontSize="0.9rem">
                        View Profile
                      </Text>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        router.push('/dashboard/team');
                      }}
                    >
                      <Text color="gray.600" fontSize="0.9rem">
                        Dashboard
                      </Text>
                    </MenuItem>
                    <MenuItem
                      onClick={() => {
                        onDisconnectWallet();
                      }}
                    >
                      <Text color="gray.600" fontSize="0.9rem">
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
