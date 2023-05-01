import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  Heading,
  HStack,
  Input,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useWallet } from '@solana/wallet-adapter-react';
import axios from 'axios';
import { MediaPicker } from 'degen';
import { useRouter } from 'next/router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { userStore } from '@/store/user';

import { IndustryList } from '../../constants';
import type { SponsorType } from '../../interface/sponsor';
import { uploadToCloudinary } from '../../utils/upload';

const CreateSponsor = () => {
  const router = useRouter();
  const animatedComponents = makeAnimated();
  const { connected } = useWallet();
  const { userInfo } = userStore();
  const {
    handleSubmit,
    register,
    formState: { errors },
  } = useForm();
  const [imageUrl, setImageUrl] = useState<string>('');
  const [industries, setIndustries] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);

  const createNewSponsor = async (sponsor: SponsorType) => {
    setIsLoading(true);
    setHasError(false);
    try {
      await axios.post('/api/sponsors/create', {
        ...sponsor,
        userId: userInfo?.id,
      });
      router.push('/listings/create');
    } catch (e) {
      setIsLoading(false);
      setHasError(true);
    }
  };
  return (
    <Default
      meta={
        <Meta
          title="Create Sponsor | Superteam Earn"
          description="Every Solana opportunity in one place!"
        />
      }
    >
      {!connected ? (
        <Text>Please sign up first!</Text>
      ) : (
        <VStack w="full" pt={8} pb={24}>
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
              {"Let's start with some basic information about your team"}
            </Text>
          </VStack>
          <VStack w={'2xl'} pt={10}>
            <form
              onSubmit={handleSubmit(async (e) => {
                createNewSponsor({
                  bio: e.bio,
                  industry: industries ?? '',
                  name: e.sponsorname,
                  slug: e.slug,
                  logo: imageUrl ?? '',
                  twitter: e.twitterHandle ?? '',
                  url: e.sponsorurl ?? '',
                });
              })}
              style={{ width: '100%' }}
            >
              <HStack justify={'space-between'} w={'full'}>
                <FormControl isRequired>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'sponsorname'}
                  >
                    Company Name
                  </FormLabel>
                  <Input
                    w={'18rem'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    focusBorderColor="brand.purple"
                    id="sponsorname"
                    placeholder="Stark Industries"
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
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'slug'}
                  >
                    Company Username
                  </FormLabel>
                  <Input
                    w={'18rem'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    focusBorderColor="brand.purple"
                    id="slug"
                    placeholder="starkindustries"
                    {...register('slug')}
                  />
                  <FormErrorMessage>
                    {errors.slug ? <>{errors.slug.message}</> : <></>}
                  </FormErrorMessage>
                </FormControl>
              </HStack>
              <HStack justify={'space-between'} w={'full'} my={6}>
                <FormControl w={'18rem'}>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'sponsorname'}
                  >
                    Company URL
                  </FormLabel>
                  <Input
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    focusBorderColor="brand.purple"
                    id="sponsorurl"
                    placeholder="https://starkindustries.com"
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
                <FormControl w={'18rem'}>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'twitterHandle'}
                  >
                    Company Twitter
                  </FormLabel>
                  <Input
                    w={'18rem'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    id="twitterHandle"
                    placeholder="@StarkIndustries"
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
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                >
                  Company Logo
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

              <HStack justify={'space-between'} w={'full'} mt={6}>
                <FormControl w={'full'} isRequired>
                  <FormLabel
                    color={'brand.slate.500'}
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
                    styles={{
                      control: (baseStyles) => ({
                        ...baseStyles,
                        backgroundColor: 'brand.slate.500',
                        borderColor: 'brand.slate.300',
                      }),
                    }}
                    onChange={(e) =>
                      setIndustries(e.map((i: any) => i.value).join(', '))
                    }
                  />
                  <FormErrorMessage>
                    {errors.industry ? <>{errors.industry.message}</> : <></>}
                  </FormErrorMessage>
                </FormControl>
              </HStack>
              <Box my={6}>
                <FormControl isRequired>
                  <FormLabel
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'bio'}
                  >
                    Company Short Bio
                  </FormLabel>
                  <Input
                    w={'full'}
                    borderColor={'brand.slate.300'}
                    _placeholder={{ color: 'brand.slate.300' }}
                    focusBorderColor="brand.purple"
                    id="bio"
                    placeholder="What does your company do?"
                    {...register('bio')}
                  />
                  <FormErrorMessage>
                    {errors.bio ? <>{errors.bio.message}</> : <></>}
                  </FormErrorMessage>
                </FormControl>
              </Box>
              <Box mt={8}>
                {hasError && (
                  <Text align="center" mb={4} color="red">
                    Sorry! An error occurred while creating your company!
                    <br />
                    Please try again or contact support!
                  </Text>
                )}
                <Button
                  w="full"
                  isLoading={!!isLoading}
                  loadingText="Creating..."
                  size="lg"
                  type="submit"
                  variant="solid"
                >
                  Create Sponsor
                </Button>
              </Box>
            </form>
          </VStack>
        </VStack>
      )}
    </Default>
  );
};

export default CreateSponsor;
