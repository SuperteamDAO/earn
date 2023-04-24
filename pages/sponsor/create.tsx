import {
  Box,
  Button,
  Container,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
  useDisclosure,
  VStack,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { MediaPicker } from 'degen';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { Emailverification } from '../../components/modals/emailverification';
import { Navbar } from '../../components/navbar/navbar';
import type { MultiSelectOptions } from '../../constants';
import { IndustryList } from '../../constants';
import type { SponsorType } from '../../interface/sponsor';
import { ConnectWallet } from '../../layouts/connectWallet';
import { generateOtp } from '../../utils/functions';
import {
  generateCode,
  generateCodeLast,
  genrateNanoid,
  genrateuuid,
} from '../../utils/helpers';
import { uploadToCloudinary } from '../../utils/upload';

interface Totp {
  current: number;
  last: number;
}

const CreateSponsor = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [industrys, setIndustry] = useState<MultiSelectOptions>();
  const animatedComponents = makeAnimated();
  const [otp, setOtp] = useState<Totp>({
    current: 0,
    last: 0,
  });
  const [sponsor, setSponsor] = useState<SponsorType>();
  const { publicKey, connected } = useWallet();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();
  return (
    <>
      {isOpen && (
        <Emailverification
          sponsor={sponsor as SponsorType}
          email={sponsor?.email as string}
          onClose={onClose}
          isOpen={isOpen}
          totp={otp}
        />
      )}
      {!connected ? (
        <ConnectWallet />
      ) : (
        <>
          <Container maxW={'full'}>
            <VStack maxW={'6xl'} mx={'auto'}>
              <Navbar />
              <VStack w="full" minH={'100vh'} pt={24} pb={'5rem'}>
                <VStack>
                  <Heading
                    color={'gray.700'}
                    fontFamily={'Inter'}
                    fontSize={'24px'}
                    fontWeight={700}
                  >
                    Welcome to Superteam Earn
                  </Heading>
                  <Text
                    color={'gray.400'}
                    fontFamily={'Inter'}
                    fontSize={'20px'}
                    fontWeight={500}
                  >
                    {
                      "Let's start with some basic information about you and your team"
                    }
                  </Text>
                </VStack>
                <VStack w={'2xl'} pt={10}>
                  <form
                    onSubmit={handleSubmit(async (e) => {
                      console.log(e);
                      setSponsor({
                        bio: e.bio,
                        email: e.sponsoremail,
                        industry: JSON.stringify(industrys),
                        publickey: publicKey?.toBase58() as string,
                        verified: true,
                        name: e.sponsorname,
                        logo: imageUrl,
                        twitter: e.twitterHandle,
                        url: e.sponsorurl,
                        username: e.username,
                        type: 'Admin',
                        orgId: genrateNanoid(),
                        id: genrateuuid(),
                      });
                      const a = await generateOtp(
                        publicKey?.toBase58() as string,
                        e.sponsoremail
                      );
                      console.log(a);

                      const code = generateCode(
                        publicKey?.toBase58() as string
                      );
                      const codeLast = generateCodeLast(
                        publicKey?.toBase58() as string
                      );
                      setOtp({
                        current: code,
                        last: codeLast,
                      });
                      onOpen();
                    })}
                    style={{ width: '100%' }}
                  >
                    <HStack justify={'space-between'} w={'full'}>
                      <FormControl w={'18rem'} isRequired>
                        <FormLabel
                          color={'gray.500'}
                          fontSize={'15px'}
                          fontWeight={600}
                          htmlFor={'sponsorname'}
                        >
                          Company Name
                        </FormLabel>
                        <Input
                          w={'18rem'}
                          id="sponsorname"
                          placeholder="Company Name"
                          {...register('sponsorname')}
                        />
                        <FormErrorMessage>
                          {errors.sponsorname ? (
                            <>{errors.sponsorname.message}</>
                          ) : (
                            <></>
                          )}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl w={'18rem'} isRequired>
                        <FormLabel
                          color={'gray.500'}
                          fontSize={'15px'}
                          fontWeight={600}
                          htmlFor={'sponsorname'}
                        >
                          Company URL
                        </FormLabel>
                        <Input
                          id="sponsorurl"
                          placeholder="Enter Your Website"
                          {...register('sponsorurl')}
                        />
                        <FormErrorMessage>
                          {errors.sponsorurl ? (
                            <>{errors.sponsorurl.message}</>
                          ) : (
                            <></>
                          )}
                        </FormErrorMessage>
                      </FormControl>
                    </HStack>
                    <Box my={6}>
                      <FormControl isRequired>
                        <FormLabel
                          color={'gray.500'}
                          fontSize={'15px'}
                          fontWeight={600}
                          htmlFor={'sponsoremail'}
                        >
                          Your Email
                        </FormLabel>
                        <Input
                          w={'full'}
                          id="sponsoremail"
                          placeholder="Enter Your Email"
                          type={'email'}
                          {...register('sponsoremail')}
                        />
                        <FormErrorMessage>
                          {errors.sponsoremail ? (
                            <>{errors.sponsoremail.message}</>
                          ) : (
                            <></>
                          )}
                        </FormErrorMessage>
                      </FormControl>
                    </Box>
                    <HStack justify={'space-between'} w={'full'} my={6}>
                      <FormControl w={'18rem'} isRequired>
                        <FormLabel
                          color={'gray.500'}
                          fontSize={'15px'}
                          fontWeight={600}
                          htmlFor={'bio'}
                        >
                          Username
                        </FormLabel>
                        <Input
                          w={'full'}
                          id="username"
                          placeholder="Username"
                          {...register('username')}
                        />
                        <FormErrorMessage>
                          {errors.username ? (
                            <>{errors.username.message}</>
                          ) : (
                            <></>
                          )}
                        </FormErrorMessage>
                      </FormControl>
                      <FormControl w={'18rem'} isRequired>
                        <FormLabel
                          color={'gray.500'}
                          fontSize={'15px'}
                          fontWeight={600}
                          htmlFor={'twitterHandle'}
                        >
                          Company Twitter
                        </FormLabel>
                        <Input
                          id="twitterHandle"
                          placeholder="@SuperteamDAO"
                          {...register('twitterHandle')}
                        />
                        <FormErrorMessage>
                          {errors.twitterHandle ? (
                            <>{errors.twitterHandle.message}</>
                          ) : (
                            <></>
                          )}
                        </FormErrorMessage>
                      </FormControl>
                    </HStack>
                    <VStack align={'start'} gap={2} my={3}>
                      <Heading
                        color={'gray.400'}
                        fontSize={'15px'}
                        fontWeight={600}
                      >
                        Add Your Logo
                      </Heading>
                      <HStack gap={5}>
                        <MediaPicker
                          onChange={async (e) => {
                            const a = await uploadToCloudinary(e);
                            setImageUrl(a);
                          }}
                          compact
                          label="Choose or Drag & Drop Media"
                        />
                      </HStack>
                    </VStack>

                    <HStack justify={'space-between'} w={'full'}>
                      <FormControl w={'full'} isRequired>
                        <FormLabel
                          color={'gray.500'}
                          fontSize={'15px'}
                          fontWeight={600}
                          htmlFor={'industry'}
                        >
                          Industry
                        </FormLabel>

                        <Select
                          closeMenuOnSelect={false}
                          components={animatedComponents}
                          isMulti
                          options={IndustryList}
                          onChange={(e) => {
                            setIndustry(e as any);
                          }}
                        />
                        <FormErrorMessage>
                          {errors.industry ? (
                            <>{errors.industry.message}</>
                          ) : (
                            <></>
                          )}
                        </FormErrorMessage>
                      </FormControl>
                    </HStack>
                    <Box my={6}>
                      <FormControl isRequired>
                        <FormLabel
                          color={'gray.500'}
                          fontSize={'15px'}
                          fontWeight={600}
                          htmlFor={'bio'}
                        >
                          Company Short Bio
                        </FormLabel>
                        <Input
                          w={'full'}
                          id="bio"
                          placeholder="What Does Your Company Do ?"
                          {...register('bio')}
                        />
                        <FormErrorMessage>
                          {errors.bio ? <>{errors.bio.message}</> : <></>}
                        </FormErrorMessage>
                      </FormControl>
                    </Box>
                    <Box>
                      <Button
                        w="100%"
                        h="2.6rem"
                        color={'white'}
                        fontSize="1rem"
                        fontWeight={600}
                        bg={'#6562FF'}
                        _hover={{ bg: '#6562FF' }}
                        type="submit"
                      >
                        Continue
                      </Button>
                    </Box>
                  </form>
                </VStack>
              </VStack>
            </VStack>
          </Container>
        </>
      )}
    </>
  );
};

export default CreateSponsor;
