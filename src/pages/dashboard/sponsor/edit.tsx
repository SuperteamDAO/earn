import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/router';
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
import { useUploadImage } from '@/hooks/use-upload-image';
import { SponsorLayout } from '@/layouts/Sponsor';
import { api } from '@/lib/api';
import { useUser } from '@/store/user';
import { IMAGE_SOURCE } from '@/utils/image';

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
  const { user, refetchUser } = useUser();

  const [selectedLogo, setSelectedLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { uploadAndReplace, uploading: isUploading } = useUploadImage();

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
      setLogoPreview(logo || '');
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
      !logoPreview ||
      isUploading ||
      isLoading ||
      isSlugInvalid ||
      isSponsorNameInvalid,
    [logoPreview, isUploading, isLoading, isSlugInvalid, isSponsorNameInvalid],
  );

  const onSubmit = async (data: SponsorBase) => {
    if (isSubmitDisabled) return;

    try {
      setIsLoading(true);

      let finalLogo = logoPreview;

      if (selectedLogo) {
        try {
          const uploadResult = await uploadAndReplace(
            selectedLogo,
            { folder: 'earn-sponsor', source: IMAGE_SOURCE.SPONSOR },
            sponsorData?.logo || undefined,
          );

          finalLogo = uploadResult.url;
        } catch (error) {
          console.error('Error uploading image:', error);
        }
      }

      await api.post('/api/sponsors/edit', {
        ...data,
        logo: finalLogo,
      });
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

  return (
    <SponsorLayout>
      <div className="mx-auto ml-4 flex flex-col gap-2 pr-4">
        <div className="flex flex-col gap-2">
          <p className="mb-4 text-2xl font-bold tracking-tight text-gray-900">
            Edit Sponsor Profile
          </p>
        </div>
        <div className="flex w-full flex-col">
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
                  formLabel="Company X"
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
                        <Info className="mt-1 ml-1 hidden h-3 w-3 text-slate-500 md:block" />
                      </Tooltip>
                    </>
                  }
                  isRequired
                >
                  <Input placeholder="Full Entity Name" />
                </FormFieldWrapper>
              </div>

              <div className="mt-6 mb-3 w-full">
                <FormLabel isRequired>Company Logo</FormLabel>
                <ImagePicker
                  crop="square"
                  defaultValue={logoPreview ? { url: logoPreview } : undefined}
                  onChange={(file, previewUrl) => {
                    setSelectedLogo(file);
                    setLogoPreview(previewUrl);
                    form.setValue('logo', previewUrl);
                  }}
                  onReset={() => {
                    setSelectedLogo(null);
                    setLogoPreview(null);
                    form.setValue('logo', '');
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
                    <span className="flex items-center gap-1">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Updating...</span>
                    </span>
                  ) : (
                    <span>Update Profile</span>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </SponsorLayout>
  );
}
