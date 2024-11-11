import { InfoOutlineIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  HStack,
  Text,
  Tooltip,
  VStack,
} from '@chakra-ui/react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { IndustryList } from '@/constants';
import {
  type SponsorBase,
  sponsorBaseSchema,
  useSlugValidation,
  useSponsorNameValidation,
} from '@/features/sponsor';
import { sponsorQuery } from '@/features/sponsor-dashboard';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

export default function UpdateSponsor() {
  const router = useRouter();
  const animatedComponents = makeAnimated();
  const { data: session, status } = useSession();
  const { user, refetchUser } = useUser();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<SponsorBase>({
    resolver: zodResolver(sponsorBaseSchema),
    defaultValues: {
      name: '',
      slug: '',
      bio: '',
      logo: '',
      industry: '',
      url: '',
      twitter: '',
      entityName: '',
    },
  });

  const {
    setSponsorName,
    isInvalid: isSponsorNameInvalid,
    validationErrorMessage: sponsorNameValidationErrorMessage,
    sponsorName,
  } = useSponsorNameValidation();

  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: slugValidationErrorMessage,
    slug,
  } = useSlugValidation();

  const { data: sponsorData } = useQuery(sponsorQuery(user?.currentSponsorId));

  useEffect(() => {
    if (sponsorData) {
      const { bio, industry, name, slug, logo, twitter, url, entityName } =
        sponsorData;
      setSponsorName(name);
      setSlug(slug);
      setLogoUrl(logo || '');
      form.reset({
        name,
        slug,
        bio,
        logo,
        industry,
        url,
        twitter,
        entityName,
      });
    }
  }, [sponsorData, form.reset, setSlug, setSponsorName]);

  const onSubmit = async (data: SponsorBase) => {
    setIsLoading(true);
    try {
      await axios.post('/api/sponsors/edit', data);
      await refetchUser();
      toast.success('Sponsor profile updated successfully!');
      router.push('/dashboard/listings');
    } catch (error) {
      console.error('Error updating sponsor:', error);
      if (
        axios.isAxiosError(error) &&
        error.response?.data?.error?.code === 'P2002'
      ) {
        toast.error('Sorry! Sponsor name or username already exists.');
      } else {
        toast.error('Failed to update sponsor profile. Please try again.');
      }
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
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              style={{ width: '100%' }}
            >
              <Flex justify={'space-between'} gap={2} w={'full'}>
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired>Company Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Stark Industries"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setSponsorName(e.target.value);
                          }}
                          value={sponsorName}
                        />
                      </FormControl>
                      {isSponsorNameInvalid && (
                        <p className="text-sm text-red-500">
                          {sponsorNameValidationErrorMessage}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired>Company Username</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="starkindustries"
                          {...field}
                          onChange={(e) => {
                            field.onChange(e);
                            setSlug(e.target.value);
                          }}
                          value={slug}
                        />
                      </FormControl>
                      {isSlugInvalid && (
                        <p className="text-sm text-red-500">
                          {slugValidationErrorMessage}
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Flex>
              <HStack justify={'space-between'} w={'full'} my={6}>
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired>Company URL</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://starkindustries.com"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="twitter"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired>Company Twitter</FormLabel>
                      <FormControl>
                        <Input placeholder="@StarkIndustries" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </HStack>

              <HStack w="full">
                <FormField
                  control={form.control}
                  name="entityName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired className="flex items-center gap-2">
                        Entity Name
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
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="Full Entity Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </HStack>

              <VStack align={'start'} gap={2} my={3}>
                <FormLabel isRequired className="mb-2">
                  Company Logo
                </FormLabel>
                <ImagePicker
                  defaultValue={logoUrl ? { url: logoUrl } : undefined}
                  onChange={async (e) => {
                    setIsUploading(true);
                    const url = await uploadToCloudinary(e, 'earn-sponsor');
                    setLogoUrl(url);
                    form.setValue('logo', url);
                    setIsUploading(false);
                  }}
                  onReset={() => {
                    setLogoUrl(null);
                    form.setValue('logo', '');
                  }}
                />
              </VStack>

              <HStack justify={'space-between'} w={'full'} mt={6}>
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired>Industry</FormLabel>
                      <FormControl>
                        <Select
                          closeMenuOnSelect={false}
                          components={animatedComponents}
                          isMulti
                          options={IndustryList.map((industry) => ({
                            value: industry,
                            label: industry,
                          }))}
                          onChange={(selected) => {
                            const values = selected.map(
                              (item: any) => item.value,
                            );
                            field.onChange(values.join(', '));
                          }}
                          value={field.value.split(', ').map((industry) => ({
                            value: industry,
                            label: industry,
                          }))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </HStack>
              <Box my={6}>
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired>Company Short Bio</FormLabel>
                      <FormControl>
                        <Input
                          maxLength={180}
                          placeholder="What does your company do?"
                          {...field}
                        />
                      </FormControl>
                      <div className="text-right text-xs text-slate-400">
                        {180 - (field.value?.length || 0)} characters left
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </Box>
              <Box mt={8}>
                <Button
                  w="full"
                  disabled={!logoUrl || isUploading}
                  isLoading={isLoading}
                  size="lg"
                  type="submit"
                  variant="solid"
                >
                  Update Profile
                </Button>
              </Box>
            </form>
          </Form>
        </VStack>
      </VStack>
    </Default>
  );
}
