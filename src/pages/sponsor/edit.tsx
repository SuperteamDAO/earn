import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

import { ImagePicker } from '@/components/shared/ImagePicker';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FormFieldWrapper } from '@/components/ui/form-field-wrapper';
import { Input } from '@/components/ui/input';
import { MultiSelect } from '@/components/ui/multi-select';
import { Tooltip } from '@/components/ui/tooltip';
import { Default } from '@/layouts/Default';
import { Meta } from '@/layouts/Meta';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { uploadToCloudinary } from '@/utils/upload';

import { SocialInput } from '@/features/social/components/SocialInput';
import { extractSocialUsername } from '@/features/social/utils/extractUsername';
import { useSlugValidation } from '@/features/sponsor/hooks/useSlugValidation';
import { useSponsorNameValidation } from '@/features/sponsor/hooks/useSponsorNameValidation';
import {
  type SponsorBase,
  sponsorBaseSchema,
} from '@/features/sponsor/utils/sponsorFormSchema';
import { sponsorQuery } from '@/features/sponsor-dashboard/queries/sponsor';
import { IndustryList } from '@/features/talent/constants';

export default function UpdateSponsor() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { user, refetchUser } = useUser();

  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const form = useForm<SponsorBase>({
    resolver: zodResolver(sponsorBaseSchema),
    mode: 'onBlur',
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

  useEffect(() => {
    if (form.formState.touchedFields.name && sponsorName === '') {
      form.clearErrors('name');
    }
    if (!form.formState.errors?.name?.message) {
      if (isSponsorNameInvalid) {
        form.setError('name', {
          message: sponsorNameValidationErrorMessage,
        });
      }
    }
  }, [
    sponsorNameValidationErrorMessage,
    isSponsorNameInvalid,
    form.formState.errors.name?.message,
    sponsorName,
  ]);

  const {
    setSlug,
    isInvalid: isSlugInvalid,
    validationErrorMessage: slugValidationErrorMessage,
    slug,
  } = useSlugValidation();

  useEffect(() => {
    if (form.formState.touchedFields.slug && slug === '') {
      form.clearErrors('slug');
    }
    form.clearErrors('slug');
    if (isSlugInvalid && !form.formState.errors.slug?.message) {
      form.setError('slug', {
        message: slugValidationErrorMessage,
      });
    }
  }, [
    slugValidationErrorMessage,
    isSlugInvalid,
    form.formState.errors.slug?.message,
    slug,
  ]);

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
        twitter: twitter
          ? extractSocialUsername('twitter', twitter) || undefined
          : undefined,
        entityName,
      });
    }
  }, [sponsorData, form.reset, setSlug, setSponsorName]);

  const isSubmitDisabled = useMemo(
    () =>
      !logoUrl ||
      isUploading ||
      isLoading ||
      isSlugInvalid ||
      isSponsorNameInvalid,
    [logoUrl, isUploading, isLoading, isSlugInvalid, isSponsorNameInvalid],
  );

  const onSubmit = async (data: SponsorBase) => {
    if (isSubmitDisabled) return;
    setIsLoading(true);
    try {
      await api.post('/api/sponsors/edit', data);
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
      <div className="mx-auto flex flex-col gap-2 pb-24 pt-12">
        <div className="flex flex-col gap-2">
          <p className="mb-8 text-3xl font-semibold tracking-tight text-gray-900">
            Edit Sponsor Profile
          </p>
        </div>
        <div className="flex w-[42rem] flex-col">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              style={{ width: '100%' }}
            >
              <div className="flex w-full justify-between gap-4">
                <FormFieldWrapper
                  control={form.control}
                  name="name"
                  label="Company Name"
                  isRequired
                  onChange={(e) => {
                    setSponsorName(e.target.value);
                  }}
                >
                  <Input placeholder="Stark Industries" value={sponsorName} />
                </FormFieldWrapper>

                <FormFieldWrapper
                  control={form.control}
                  name="slug"
                  label="Company Username"
                  isRequired
                  onChange={(e) => {
                    const value = e.target.value
                      .toLowerCase()
                      .replace(/\s+/g, '-');
                    form.setValue('slug', value);
                    setSlug(value);
                  }}
                >
                  <Input placeholder="starkindustries" value={slug} />
                </FormFieldWrapper>
              </div>
              <div className="my-6 flex w-full justify-between gap-4">
                <FormFieldWrapper
                  control={form.control}
                  name="url"
                  label="Company URL"
                  isRequired
                >
                  <Input placeholder="https://starkindustries.com" />
                </FormFieldWrapper>

                <SocialInput
                  name="twitter"
                  socialName={'twitter'}
                  formLabel="Company Twitter"
                  placeholder="@StarkIndustries"
                  required
                  control={form.control}
                  height="h-9"
                />
              </div>

              <div className="flex w-full">
                <FormFieldWrapper
                  control={form.control}
                  name="entityName"
                  label={
                    <>
                      Entity Name
                      <Tooltip
                        content="Please mention the official entity name of your project. If you are a DAO, simply mention the name of the DAO. If you neither have an entity nor are a DAO, mention your full name."
                        contentProps={{ className: 'text-xs' }}
                      >
                        <Info className="ml-1 mt-1 hidden h-3 w-3 text-slate-500 md:block" />
                      </Tooltip>
                    </>
                  }
                  isRequired
                >
                  <Input placeholder="Full Entity Name" />
                </FormFieldWrapper>
              </div>

              <div className="mb-3 mt-6 w-full">
                <FormLabel isRequired>Company Logo</FormLabel>
                <ImagePicker
                  defaultValue={logoUrl ? { url: logoUrl } : undefined}
                  onChange={async (e) => {
                    setIsUploading(true);
                    const url = await uploadToCloudinary(e, 'earn-sponsor');
                    setLogoUrl(url);
                    form.setValue('logo', url);
                    setIsUploading(false);
                  }}
                />
              </div>

              <div className="mt-6 flex w-full justify-between">
                <FormField
                  control={form.control}
                  name="industry"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel isRequired>Industry</FormLabel>
                      <FormControl>
                        <MultiSelect
                          options={IndustryList.map((elm) => ({
                            label: elm,
                            value: elm,
                          }))}
                          value={field.value
                            ?.split(', ')
                            .map((value) => ({
                              label: value,
                              value: value,
                            }))
                            .filter(Boolean)}
                          onChange={(selected: any) => {
                            const values =
                              selected?.map((item: any) => item.value) || [];
                            field.onChange(values.join(', '));
                          }}
                          className="mt-2"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="my-6">
                <FormFieldWrapper
                  control={form.control}
                  name="bio"
                  label="Company Short Bio"
                  isRequired
                >
                  <Input
                    maxLength={180}
                    placeholder="What does your company do?"
                  />
                </FormFieldWrapper>
                <div className="text-right text-xs text-slate-400">
                  {180 - (form.watch('bio')?.length || 0)} characters left
                </div>
              </div>
              <div className="mt-8">
                <Button
                  className="w-full"
                  disabled={isSubmitDisabled}
                  size="lg"
                  type="submit"
                  variant="default"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Default>
  );
}
