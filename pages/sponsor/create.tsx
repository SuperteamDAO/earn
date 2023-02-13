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
import { Navbar } from '../../components/navbar/navbar';
import { useForm } from 'react-hook-form';
import { Emailverification } from '../../components/modals/emailverification';
import { useWallet } from '@solana/wallet-adapter-react';
import { MediaPicker } from 'degen';
import { uploadToCloudinary } from '../../utils/upload';
import { genrateOtp } from '../../utils/functions';
import { useState } from 'react';
import { SponsorType } from '../../interface/sponsor';
import {
  genrateCode,
  genrateCodeLast,
  genrateNanoid,
  genrateuuid,
} from '../../utils/helpers';
import { ConnectWallet } from '../../layouts/connectWallet';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { IndustryList, MultiSelectOptions } from '../../constants';
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
            <VStack mx={'auto'} maxW={'6xl'}>
              <Navbar />
              <VStack pb={'5rem'} minH={'100vh'} pt={24} w="full">
                <VStack>
                  <Heading
                    color={'gray.700'}
                    fontFamily={'Inter'}
                    fontWeight={700}
                    fontSize={'24px'}
                  >
                    Welcome to Superteam Earn
                  </Heading>
                  <Text
                    fontFamily={'Inter'}
                    fontWeight={500}
                    color={'gray.400'}
                    fontSize={'20px'}
                  >
                    {
                      "Let's start with some basic information about your project"
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
                      const a = await genrateOtp(
                        publicKey?.toBase58() as string,
                        e.sponsoremail
                      );
                      console.log(a);

                      const code = genrateCode(publicKey?.toBase58() as string);
                      const codeLast = genrateCodeLast(
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
                    <HStack w={'full'} justify={'space-between'}>
                      <FormControl w={'18rem'} isRequired>
                        <FormLabel
                          color={'gray.400'}
                          fontWeight={600}
                          fontSize={'15px'}
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
                          color={'gray.400'}
                          fontWeight={600}
                          fontSize={'15px'}
                          htmlFor={'sponsorname'}
                        >
                          Company URL
                        </FormLabel>
                        <Input
                          id="sponsorurl"
                          placeholder="Enter your website"
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
                          color={'gray.400'}
                          fontWeight={600}
                          fontSize={'15px'}
                          htmlFor={'sponsoremail'}
                        >
                          Your Email
                        </FormLabel>
                        <Input
                          w={'full'}
                          id="sponsoremail"
                          type={'email'}
                          placeholder="Enter your website"
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
                    <HStack w={'full'} justify={'space-between'} my={6}>
                      <FormControl w={'18rem'} isRequired>
                        <FormLabel
                          color={'gray.400'}
                          fontWeight={600}
                          fontSize={'15px'}
                          htmlFor={'bio'}
                        >
                          Username
                        </FormLabel>
                        <Input
                          w={'full'}
                          id="username"
                          placeholder="username"
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
                          color={'gray.400'}
                          fontWeight={600}
                          fontSize={'15px'}
                          htmlFor={'twitterHandle'}
                        >
                          Company Tiwtter
                        </FormLabel>
                        <Input
                          id="twitterHandle"
                          placeholder="@yourtwitter"
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
                    <VStack gap={2} my={3} align={'start'}>
                      <Heading
                        color={'gray.400'}
                        fontWeight={600}
                        fontSize={'15px'}
                      >
                        Add your logo
                      </Heading>
                      <HStack gap={5}>
                        <MediaPicker
                          onChange={async (e) => {
                            const a = await uploadToCloudinary(e);
                            setImageUrl(a);
                          }}
                          compact
                          label="Choose or drag and drop media"
                        />
                      </HStack>
                    </VStack>

                    <HStack w={'full'} justify={'space-between'}>
                      <FormControl w={'full'} isRequired>
                        <FormLabel
                          color={'gray.400'}
                          fontWeight={600}
                          fontSize={'15px'}
                          htmlFor={'industry'}
                        >
                          Industry
                        </FormLabel>
                        {/* <Input
                          w={'18rem'}
                          id="industry"
                          placeholder="Pick a Industry"
                          {...register('industry')}
                        /> */}
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
                          color={'gray.400'}
                          fontWeight={600}
                          fontSize={'15px'}
                          htmlFor={'bio'}
                        >
                          Company Short Bio
                        </FormLabel>
                        <Input
                          w={'full'}
                          id="bio"
                          placeholder="What does your company do ?"
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
                        bg={'#6562FF'}
                        color={'white'}
                        fontSize="1rem"
                        fontWeight={600}
                        h="2.6rem"
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
