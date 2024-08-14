import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
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
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { IndustryList } from '@/constants';
import {
  useSlugValidation,
  useSponsorNameValidation,
} from '@/features/sponsor';
import type { SponsorType } from '@/interface/sponsor';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { SponsorStore } from '@/store/sponsor';
import { useUser } from '@/store/user';
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
  const { user, refetchUser } = useUser();
  const { setCurrentSponsor } = SponsorStore();

  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: slugValidationErrorMessage,
    slug,
  } = useSlugValidation();
  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();

  const { data: sponsorData } = useQuery({
    queryKey: ['sponsorData', user?.currentSponsorId],
    queryFn: async () => {
      const { data } = await axios.get('/api/sponsors/');
      return data;
    },
    enabled: !!user?.currentSponsorId,
  });

  useEffect(() => {
    if (sponsorData) {
      const { bio, industry, name, slug, logo, twitter, url, entityName } =
        sponsorData;
      setSponsorName(name);
      setSlug(slug);
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
    }
  }, [sponsorData, reset, setSlug, setSponsorName]);

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
      await refetchUser();

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
      <VStack w="full" pt={12} pb={24}>
        <VStack>
          <Text color={'gray.700'} fontSize={'3xl'} fontWeight={700}>
            Edit Sponsor Profile
          </Text>
        </VStack>
        <VStack w={'2xl'} pt={10}>
          <form
            onSubmit={handleSubmit(async (e) => {
              updateSponsor({
                bio: e.bio,
                industry: industries ?? '',
                name: sponsorName,
                slug: slug,
                logo: imageUrl ?? '',
                twitter: e.twitterHandle,
                url: e.sponsorurl ?? '',
                entityName: e.entityName,
              });
            })}
            style={{ width: '100%' }}
          >
            <Flex justify={'space-between'} gap={2} w={'full'}>
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
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="sponsorname"
                  placeholder="Stark Industries"
                  {...register('sponsorname')}
                  isInvalid={isSponsorNameInvalid}
                  onChange={(e) => setSponsorName(e.target.value)}
                  value={sponsorName}
                />
                {isSponsorNameInvalid && (
                  <Text color={'red'} fontSize={'sm'}>
                    {sponsorNameValidationErrorMessage}
                  </Text>
                )}
                <FormErrorMessage>
                  {errors.sponsorname ? (
                    <>{errors.sponsorname.message}</>
                  ) : (
                    <></>
                  )}
                </FormErrorMessage>
              </FormControl>
              <FormControl w={'full'} isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'slug'}
                >
                  Company Username
                </FormLabel>
                <Input
                  w={'full'}
                  borderColor={'brand.slate.300'}
                  _placeholder={{ color: 'brand.slate.300' }}
                  focusBorderColor="brand.purple"
                  id="slug"
                  placeholder="starkindustries"
                  {...register('slug')}
                  isInvalid={isSlugInvalid}
                  onChange={(e) => setSlug(e.target.value)}
                  value={slug}
                />
                {isSlugInvalid && (
                  <Text color={'red'} fontSize={'sm'}>
                    {slugValidationErrorMessage}
                  </Text>
                )}
                <FormErrorMessage>
                  {errors.slug ? <>{errors.slug.message}</> : <></>}
                </FormErrorMessage>
              </FormControl>
            </Flex>
            <HStack justify={'space-between'} w={'full'} my={6}>
              <FormControl w={'full'} isRequired>
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
              <FormControl w={'full'} isRequired>
                <FormLabel
                  color={'brand.slate.500'}
                  fontSize={'15px'}
                  fontWeight={600}
                  htmlFor={'twitterHandle'}
                >
                  Company Twitter
                </FormLabel>
                <Input
                  w={'full'}
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
                    label="Please mention the official entity name of your project. If you are a DAO, simply mention the name of the DAO. If you neither have an entity nor are a DAO, mention your full name."
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
