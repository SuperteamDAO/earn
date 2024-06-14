import { InfoOutlineIcon } from '@chakra-ui/icons';
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
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { IndustryList } from '@/constants';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { SponsorStore } from '@/store/sponsor';
import { userStore } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

const UpdateSponsor = () => {
  const router = useRouter();
  const animatedComponents = makeAnimated();
  const { data: session, status } = useSession();
  const {
    handleSubmit,
    register,
    formState: { errors },
    watch,
    getValues,
    reset,
  } = useForm({
    defaultValues: {
      sponsorname: '',
      slug: '',
      sponsorurl: '',
      twitterHandle: '',
      bio: '',
      industry: '',
      entityName: '',
    },
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isImageUploading, setIsImageUploading] = useState(false);

  const [isPhotoLoading, setIsPhotoLoading] = useState(true);
  const [industries, setIndustries] = useState<string>();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const { userInfo, setUserInfo } = userStore();
  const { setCurrentSponsor } = SponsorStore();

  useEffect(() => {
    const fetchSponsorData = async () => {
      try {
        const response = await axios.get('/api/sponsors/');
        return response.data;
      } catch (e) {}
    };

    const init = async () => {
      setIsLoading(true);
      const response = await fetchSponsorData();
      const { bio, industry, name, slug, logo, twitter, url, entityName } =
        response;
      register('bio', { value: bio, required: 'Company bio is required' });
      register('sponsorname', {
        value: name,
        required: 'Company name is required',
      });
      register('slug', {
        value: slug,
        required: 'Company username is required',
      });
      register('sponsorurl', {
        value: url,
        required: 'Company URL is required',
      });
      register('sponsorurl', {
        value: entityName,
        required: 'Entity Name is required',
      });
      register('twitterHandle', {
        value: twitter,
        required: 'Company Twitter handle is required',
      });
      reset({
        bio,
        sponsorname: name,
        slug,
        sponsorurl: url,
        twitterHandle: twitter,
        entityName,
      });
      if (logo) {
        setImageUrl(logo);
      }
      setIsPhotoLoading(false);
      setIndustries(industry);
      setIsLoading(false);
    };

    init();
  }, [userInfo?.currentSponsorId, router]);

  const updateSponsor = async (sponsor: SponsorType) => {
    if (getValues('bio').length > 180) {
      setErrorMessage('Company short bio length exceeded the limit');
      return;
    }
    setIsLoading(true);
    setHasError(false);
    try {
      await axios.post('/api/sponsors/edit', {
        ...sponsor,
      });
      setCurrentSponsor(sponsor);
      const updatedUser = await axios.get('/api/user/');
      setUserInfo(updatedUser?.data);
      router.push('/dashboard/listings');
    } catch (e: any) {
      if (e?.response?.data?.error?.code === 'P2002') {
        setErrorMessage('Sorry! Sponsor name or username already exists.');
      }
      setHasError(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (!session && status === 'loading') {
    return <></>;
  }

  return (
    <Default
      meta={
        <Meta
          title="Edit Sponsor Profile | Superteam Earn"
          description="Every Solana opportunity in one place!"
        />
      }
    >
      <VStack w="full" pt={8} pb={24}>
        <VStack>
          <Heading
            color={'gray.700'}
            fontFamily={'var(--font-sans)'}
            fontSize={'24px'}
            fontWeight={700}
          >
            Edit Sponsor Profile
          </Heading>
        </VStack>
        <VStack w={'2xl'} pt={10}>
          <form
            onSubmit={handleSubmit(async (e) => {
              updateSponsor({
                bio: e.bio,
                industry: industries ?? '',
                name: e.sponsorname,
                slug: e.slug,
                logo: imageUrl ?? '',
                twitter: e.twitterHandle,
                url: e.sponsorurl ?? '',
                entityName: e.entityName,
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
                  {errors.sponsorurl ? <>{errors.sponsorurl.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
              <FormControl w={'18rem'} isRequired>
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

            <HStack w="full">
              <FormControl w={'full'} isRequired>
                <HStack mb={2}>
                  <FormLabel
                    m={0}
                    color={'brand.slate.500'}
                    fontSize={'15px'}
                    fontWeight={600}
                    htmlFor={'entityName'}
                  >
                    Entity Name
                  </FormLabel>
                  <Tooltip
                    fontSize="xs"
                    label="Please mention the official entity name of your project. If you are a DAO, simply mention the name of the DAO here."
                  >
                    <InfoOutlineIcon
                      color="brand.slate.500"
                      w={3}
                      h={3}
                      display={{ base: 'none', md: 'block' }}
                    />
                  </Tooltip>
                </HStack>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="entityName"
                  placeholder="Full Entity Name"
                  {...register('entityName')}
                />
                <FormErrorMessage>
                  {errors.entityName ? <>{errors.entityName.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </HStack>

            <VStack align={'start'} gap={2} my={3}>
              <Heading
                color={'brand.slate.500'}
                fontSize={'15px'}
                fontWeight={600}
              >
                Company Logo{' '}
                <span
                  style={{
                    color: 'red',
                  }}
                >
                  *
                </span>
              </Heading>
              <HStack gap={5}>
                {isPhotoLoading ? (
                  <></>
                ) : imageUrl ? (
                  <ImagePicker
                    onChange={async (e) => {
                      setIsImageUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-sponsor');
                      setImageUrl(a);
                      setIsImageUploading(false);
                    }}
                    defaultValue={{
                      url: imageUrl,
                      type: 'image',
                    }}
                    onReset={() => {
                      setImageUrl('');
                    }}
                  />
                ) : (
                  <ImagePicker
                    onChange={async (e) => {
                      setIsImageUploading(true);
                      const a = await uploadToCloudinary(e, 'earn-sponsor');
                      setImageUrl(a);
                      setIsImageUploading(false);
                    }}
                    onReset={() => {
                      setImageUrl('');
                    }}
                  />
                )}
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
                  defaultValue={IndustryList.filter((i) => {
                    return industries?.split(', ').includes(i.value);
                  })}
                  value={IndustryList.filter((i) => {
                    return industries?.split(', ').includes(i.value);
                  })}
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
                  maxLength={180}
                  {...register('bio')}
                  placeholder="What does your company do?"
                />
                <Text
                  color={
                    (watch('bio')?.length || 0) > 160
                      ? 'red'
                      : 'brand.slate.400'
                  }
                  fontSize={'xs'}
                  textAlign="right"
                >
                  {180 - (watch('bio')?.length || 0)} characters left
                </Text>
                <FormErrorMessage>
                  {errors.bio ? <>{errors.bio.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </Box>
            <Box mt={8}>
              {hasError && (
                <Text align="center" mb={4} color="red">
                  {errorMessage ||
                    'Sorry! An error occurred while editing your company profile!'}
                  <br />
                  Please update the details & try again or contact support!
                </Text>
              )}
              <Button
                w="full"
                isDisabled={imageUrl === ''}
                isLoading={!!isLoading || isImageUploading}
                size="lg"
                type="submit"
                variant="solid"
              >
                Update Profile
              </Button>
            </Box>
          </form>
        </VStack>
      </VStack>
    </Default>
  );
};

export default UpdateSponsor;
